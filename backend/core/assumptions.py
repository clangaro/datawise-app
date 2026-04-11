"""
core/assumptions.py
────────────────────
Formal statistical assumption checks. Each function returns an
AssumptionResult so the UI can render pass/warn/fail badges.
"""

from dataclasses import dataclass
from typing import Optional
import numpy as np
import pandas as pd
from scipy import stats


@dataclass
class AssumptionResult:
    name: str
    passed: Optional[bool]          # True=pass, False=fail, None=not applicable
    statistic: Optional[float]
    p_value: Optional[float]
    interpretation: str
    recommendation: str
    severity: str                   # "ok" | "warn" | "fail"


# ── Individual assumption checks ─────────────────────────────────────────────

def check_normality(data: pd.Series, alpha: float = 0.05) -> AssumptionResult:
    """
    Shapiro-Wilk for n ≤ 50; Kolmogorov-Smirnov for n > 50.
    """
    clean = data.dropna()
    n = len(clean)
    if n < 3:
        return AssumptionResult(
            name="Normality", passed=None, statistic=None, p_value=None,
            interpretation="Insufficient data (n < 3).",
            recommendation="Collect more data.",
            severity="warn",
        )

    if n <= 50:
        stat, p = stats.shapiro(clean)
        test_name = "Shapiro-Wilk"
    else:
        stat, p = stats.kstest(clean, "norm",
                               args=(clean.mean(), clean.std()))
        test_name = "Kolmogorov-Smirnov"

    passed = p >= alpha
    return AssumptionResult(
        name=f"Normality ({test_name})",
        passed=passed,
        statistic=round(float(stat), 4),
        p_value=round(float(p), 4),
        interpretation=(
            f"{test_name}: W = {stat:.4f}, p = {p:.4f}. "
            + ("Data appear normally distributed." if passed
               else "Data significantly deviate from normality.")
        ),
        recommendation=(
            "Proceed with parametric test." if passed
            else "Consider non-parametric alternative or data transformation (log, sqrt)."
        ),
        severity="ok" if passed else "fail",
    )


def check_homogeneity_of_variance(*groups: pd.Series,
                                  alpha: float = 0.05) -> AssumptionResult:
    """Levene's test for equality of variances across groups."""
    clean_groups = [g.dropna() for g in groups]
    stat, p = stats.levene(*clean_groups)
    passed = p >= alpha
    return AssumptionResult(
        name="Homogeneity of Variance (Levene's)",
        passed=passed,
        statistic=round(float(stat), 4),
        p_value=round(float(p), 4),
        interpretation=(
            f"Levene's F = {stat:.4f}, p = {p:.4f}. "
            + ("Variances are homogeneous." if passed
               else "Variances differ significantly across groups.")
        ),
        recommendation=(
            "Proceed with standard test." if passed
            else "Use Welch's t-test or Welch's ANOVA (robust to unequal variances)."
        ),
        severity="ok" if passed else "warn",
    )


def check_sphericity(data: pd.DataFrame, alpha: float = 0.05) -> AssumptionResult:
    """
    Mauchly's test for sphericity (repeated-measures ANOVA).
    Delegates to pingouin for full implementation.
    """
    try:
        import pingouin as pg
        # data should be wide format: rows = subjects, cols = conditions
        result = pg.sphericity(data)
        passed = bool(result.at[0, "pval"] >= alpha)
        return AssumptionResult(
            name="Sphericity (Mauchly's test)",
            passed=passed,
            statistic=round(float(result.at[0, "W"]), 4),
            p_value=round(float(result.at[0, "pval"]), 4),
            interpretation=(
                "Sphericity assumption met." if passed
                else "Sphericity violated — apply Greenhouse-Geisser or Huynh-Feldt correction."
            ),
            recommendation=(
                "Use standard RM-ANOVA." if passed
                else "Apply Greenhouse-Geisser epsilon correction (conservative) "
                     "or Huynh-Feldt (liberal)."
            ),
            severity="ok" if passed else "warn",
        )
    except ImportError:
        return AssumptionResult(
            name="Sphericity (Mauchly's test)",
            passed=None, statistic=None, p_value=None,
            interpretation="pingouin not installed.",
            recommendation="pip install pingouin",
            severity="warn",
        )


def check_outliers(data: pd.Series,
                   method: str = "iqr") -> AssumptionResult:
    """
    IQR method: flags values beyond 1.5×IQR.
    Z-score method: flags |z| > 3.
    """
    clean = data.dropna()
    if method == "iqr":
        q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
        iqr = q3 - q1
        n_outliers = int(((clean < q1 - 1.5 * iqr) | (clean > q3 + 1.5 * iqr)).sum())
    else:
        n_outliers = int((np.abs(stats.zscore(clean)) > 3).sum())

    passed = n_outliers == 0
    pct = n_outliers / len(clean) * 100
    return AssumptionResult(
        name=f"Outliers ({method.upper()} method)",
        passed=passed,
        statistic=float(n_outliers),
        p_value=None,
        interpretation=(
            f"{n_outliers} outlier(s) detected ({pct:.1f}% of data)."
            if not passed else "No outliers detected."
        ),
        recommendation=(
            "Investigate outliers: report with/without, or use robust statistics."
            if not passed else "Proceed."
        ),
        severity="ok" if passed else "warn",
    )


def check_linearity(x: pd.Series, y: pd.Series) -> AssumptionResult:
    """
    Pearson r as a proxy for linearity, plus runs test on residuals.
    """
    clean = pd.DataFrame({"x": x, "y": y}).dropna()
    r, p = stats.pearsonr(clean["x"], clean["y"])
    passed = abs(r) > 0.1   # weak threshold — visually inspect scatterplot
    return AssumptionResult(
        name="Linearity (Pearson r)",
        passed=passed,
        statistic=round(float(r), 4),
        p_value=round(float(p), 4),
        interpretation=(
            f"Pearson r = {r:.4f} (p = {p:.4f}). "
            "Inspect scatterplot for linear trend."
        ),
        recommendation=(
            "Linearity plausible — confirm visually." if passed
            else "Weak linear relationship — consider non-linear models or Spearman."
        ),
        severity="ok" if passed else "warn",
    )


def check_independence_runs(data: pd.Series, alpha: float = 0.05) -> AssumptionResult:
    """
    Wald-Wolfowitz runs test to detect autocorrelation/non-independence.
    """
    clean = data.dropna()
    median = clean.median()
    runs_seq = (clean > median).astype(int).tolist()

    n1 = runs_seq.count(1)
    n2 = runs_seq.count(0)
    runs = sum(1 for i in range(1, len(runs_seq)) if runs_seq[i] != runs_seq[i-1]) + 1

    if n1 == 0 or n2 == 0:
        return AssumptionResult(
            name="Independence (Runs test)",
            passed=None, statistic=None, p_value=None,
            interpretation="All values on one side of median — runs test undefined.",
            recommendation="Check data collection method.",
            severity="warn",
        )

    mu = (2 * n1 * n2) / (n1 + n2) + 1
    sigma2 = (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / ((n1 + n2) ** 2 * (n1 + n2 - 1))
    z = (runs - mu) / np.sqrt(sigma2)
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    passed = p >= alpha

    return AssumptionResult(
        name="Independence (Runs test)",
        passed=passed,
        statistic=round(float(z), 4),
        p_value=round(float(p), 4),
        interpretation=(
            f"Z = {z:.4f}, p = {p:.4f}. "
            + ("No significant non-independence detected." if passed
               else "Significant non-independence / autocorrelation detected.")
        ),
        recommendation=(
            "Proceed." if passed
            else "Consider mixed models or time-series methods."
        ),
        severity="ok" if passed else "fail",
    )


# ── Dispatcher ────────────────────────────────────────────────────────────────

ASSUMPTION_CHECKERS = {
    "normality": check_normality,
    "homogeneity_of_variance": check_homogeneity_of_variance,
    "sphericity": check_sphericity,
    "outliers": check_outliers,
    "linearity": check_linearity,
    "independence": check_independence_runs,
}


def run_required_assumptions(test_id: str,
                              data: dict) -> list[AssumptionResult]:
    """
    Given a test_id and a data dict mapping column names to pd.Series,
    run all required assumption checks and return results.
    Placeholder — concrete routing added when tests are wired up.
    """
    from core.decision_tree import TESTS
    test = TESTS.get(test_id)
    if test is None:
        return []
    results = []
    # Normality check (single series)
    if "normality" in test.assumptions and "dv" in data:
        results.append(check_normality(data["dv"]))
    if "normality_of_differences" in test.assumptions and "differences" in data:
        results.append(check_normality(data["differences"]))
    # Homogeneity (requires groups)
    if "homogeneity_of_variance" in test.assumptions and "groups" in data:
        results.append(check_homogeneity_of_variance(*data["groups"]))
    # Outliers
    if "no_significant_outliers" in test.assumptions and "dv" in data:
        results.append(check_outliers(data["dv"]))
    # Linearity
    if "linearity" in test.assumptions and "iv" in data and "dv" in data:
        results.append(check_linearity(data["iv"], data["dv"]))
    return results
