"""
core/statistical_tests.py
──────────────────────────
Wrappers around scipy/statsmodels/pingouin.
Each function returns a standardised TestResult for uniform rendering.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from scipy import stats


@dataclass
class TestResult:
    test_name: str
    statistic_name: str
    statistic: float
    p_value: float
    effect_size: Optional[float]
    effect_size_name: Optional[str]
    df: Optional[Any]                       # degrees of freedom
    significant: bool
    interpretation: str
    post_hoc: Optional[pd.DataFrame] = None
    extra: Dict[str, Any] = field(default_factory=dict)


# ── Helper: Cohen's d ─────────────────────────────────────────────────────────
def _cohens_d(g1: pd.Series, g2: pd.Series) -> float:
    n1, n2 = len(g1), len(g2)
    s_pooled = np.sqrt(((n1 - 1) * g1.var(ddof=1) + (n2 - 1) * g2.var(ddof=1))
                       / (n1 + n2 - 2))
    return float((g1.mean() - g2.mean()) / s_pooled)


def _eta_squared(f_stat: float, df_between: int, df_within: int) -> float:
    return (f_stat * df_between) / (f_stat * df_between + df_within)


# ── Test runners ──────────────────────────────────────────────────────────────

def run_independent_t(g1: pd.Series, g2: pd.Series,
                      equal_var: bool = True,
                      alpha: float = 0.05) -> TestResult:
    t, p = stats.ttest_ind(g1.dropna(), g2.dropna(), equal_var=equal_var)
    d = _cohens_d(g1.dropna(), g2.dropna())
    df = len(g1) + len(g2) - 2
    return TestResult(
        test_name="Welch's t-test" if not equal_var else "Independent samples t-test",
        statistic_name="t",
        statistic=round(float(t), 4),
        p_value=round(float(p), 4),
        effect_size=round(d, 4),
        effect_size_name="Cohen's d",
        df=df,
        significant=p < alpha,
        interpretation=(
            f"t({df}) = {t:.3f}, p = {p:.4f}, d = {d:.3f}. "
            + (f"Statistically significant difference (α = {alpha})."
               if p < alpha else "No significant difference.")
        ),
    )


def run_mann_whitney(g1: pd.Series, g2: pd.Series,
                     alpha: float = 0.05) -> TestResult:
    u, p = stats.mannwhitneyu(g1.dropna(), g2.dropna(), alternative="two-sided")
    n1, n2 = len(g1.dropna()), len(g2.dropna())
    r = 1 - (2 * u) / (n1 * n2)          # rank-biserial correlation
    return TestResult(
        test_name="Mann-Whitney U test",
        statistic_name="U",
        statistic=round(float(u), 4),
        p_value=round(float(p), 4),
        effect_size=round(float(r), 4),
        effect_size_name="Rank-biserial r",
        df=None,
        significant=p < alpha,
        interpretation=(
            f"U = {u:.1f}, p = {p:.4f}, r = {r:.3f}. "
            + ("Significant difference." if p < alpha else "No significant difference.")
        ),
    )


def run_paired_t(g1: pd.Series, g2: pd.Series,
                 alpha: float = 0.05) -> TestResult:
    t, p = stats.ttest_rel(g1.dropna(), g2.dropna())
    diff = (g1 - g2).dropna()
    d = float(diff.mean() / diff.std(ddof=1))
    df = len(diff) - 1
    return TestResult(
        test_name="Paired samples t-test",
        statistic_name="t",
        statistic=round(float(t), 4),
        p_value=round(float(p), 4),
        effect_size=round(d, 4),
        effect_size_name="Cohen's d (paired)",
        df=df,
        significant=p < alpha,
        interpretation=(
            f"t({df}) = {t:.3f}, p = {p:.4f}, d = {d:.3f}. "
            + ("Significant pre-post difference." if p < alpha else "No significant difference.")
        ),
    )


def run_one_way_anova(*groups: pd.Series,
                      alpha: float = 0.05) -> TestResult:
    clean = [g.dropna() for g in groups]
    f, p = stats.f_oneway(*clean)
    k = len(clean)
    n_total = sum(len(g) for g in clean)
    df_between = k - 1
    df_within  = n_total - k
    eta2 = _eta_squared(f, df_between, df_within)
    return TestResult(
        test_name="One-way ANOVA",
        statistic_name="F",
        statistic=round(float(f), 4),
        p_value=round(float(p), 4),
        effect_size=round(eta2, 4),
        effect_size_name="η² (eta-squared)",
        df=f"({df_between}, {df_within})",
        significant=p < alpha,
        interpretation=(
            f"F({df_between}, {df_within}) = {f:.3f}, p = {p:.4f}, η² = {eta2:.3f}. "
            + ("Significant group difference — run post-hoc tests."
               if p < alpha else "No significant group difference.")
        ),
    )


def run_kruskal_wallis(*groups: pd.Series,
                       alpha: float = 0.05) -> TestResult:
    clean = [g.dropna() for g in groups]
    h, p = stats.kruskal(*clean)
    n = sum(len(g) for g in clean)
    epsilon2 = (h - len(clean) + 1) / (n - len(clean))   # epsilon-squared
    return TestResult(
        test_name="Kruskal-Wallis H test",
        statistic_name="H",
        statistic=round(float(h), 4),
        p_value=round(float(p), 4),
        effect_size=round(float(epsilon2), 4),
        effect_size_name="ε² (epsilon-squared)",
        df=len(clean) - 1,
        significant=p < alpha,
        interpretation=(
            f"H({len(clean)-1}) = {h:.3f}, p = {p:.4f}, ε² = {epsilon2:.3f}. "
            + ("Significant group difference — run Dunn's post-hoc test."
               if p < alpha else "No significant group difference.")
        ),
    )


def run_chi_square(contingency_table: pd.DataFrame,
                   alpha: float = 0.05) -> TestResult:
    chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
    n = contingency_table.values.sum()
    cramers_v = np.sqrt(chi2 / (n * (min(contingency_table.shape) - 1)))
    min_expected = expected.min()
    note = "" if min_expected >= 5 else \
        f" ⚠️ Min expected frequency = {min_expected:.2f} < 5 — consider Fisher's exact."
    return TestResult(
        test_name="Chi-square test of independence",
        statistic_name="χ²",
        statistic=round(float(chi2), 4),
        p_value=round(float(p), 4),
        effect_size=round(float(cramers_v), 4),
        effect_size_name="Cramér's V",
        df=dof,
        significant=p < alpha,
        interpretation=(
            f"χ²({dof}) = {chi2:.3f}, p = {p:.4f}, V = {cramers_v:.3f}." + note
        ),
    )


def run_pearson_correlation(x: pd.Series, y: pd.Series,
                            alpha: float = 0.05) -> TestResult:
    clean = pd.DataFrame({"x": x, "y": y}).dropna()
    r, p = stats.pearsonr(clean["x"], clean["y"])
    r2 = r ** 2
    return TestResult(
        test_name="Pearson's r correlation",
        statistic_name="r",
        statistic=round(float(r), 4),
        p_value=round(float(p), 4),
        effect_size=round(float(r2), 4),
        effect_size_name="r² (variance explained)",
        df=len(clean) - 2,
        significant=p < alpha,
        interpretation=(
            f"r({len(clean)-2}) = {r:.3f}, p = {p:.4f}, r² = {r2:.3f}. "
            + ("Significant linear relationship." if p < alpha else "No significant correlation.")
        ),
    )


def run_spearman_correlation(x: pd.Series, y: pd.Series,
                             alpha: float = 0.05) -> TestResult:
    clean = pd.DataFrame({"x": x, "y": y}).dropna()
    rho, p = stats.spearmanr(clean["x"], clean["y"])
    return TestResult(
        test_name="Spearman's rho correlation",
        statistic_name="ρ",
        statistic=round(float(rho), 4),
        p_value=round(float(p), 4),
        effect_size=round(float(rho ** 2), 4),
        effect_size_name="ρ² (explained variance, approx)",
        df=len(clean) - 2,
        significant=p < alpha,
        interpretation=(
            f"ρ({len(clean)-2}) = {rho:.3f}, p = {p:.4f}. "
            + ("Significant monotonic relationship." if p < alpha else "No significant correlation.")
        ),
    )


# ── Dispatcher ────────────────────────────────────────────────────────────────

TEST_RUNNERS = {
    "independent_t":    run_independent_t,
    "welch_t":          lambda g1, g2, **kw: run_independent_t(g1, g2, equal_var=False, **kw),
    "mann_whitney":     run_mann_whitney,
    "paired_t":         run_paired_t,
    "one_way_anova":    run_one_way_anova,
    "kruskal_wallis":   run_kruskal_wallis,
    "chi_square":       run_chi_square,
    "pearson_r":        run_pearson_correlation,
    "spearman_rho":     run_spearman_correlation,
}
