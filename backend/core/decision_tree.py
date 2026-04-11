"""
core/decision_tree.py
─────────────────────
Maps an analysis_profile (from the questionnaire) to a ranked list of
recommended statistical tests, along with the assumptions that must be
checked before running each one.

This is the scientific heart of DataWise. The logic follows standard
statistical decision frameworks (e.g. Field, 2013; Laerd Statistics).
"""

from dataclasses import dataclass, field
from typing import List, Optional


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class StatisticalTest:
    id: str
    name: str
    description: str
    assumptions: List[str]             # assumption IDs (see assumptions.py)
    parametric: bool
    references: List[str] = field(default_factory=list)
    scipy_function: Optional[str] = None
    notes: str = ""


@dataclass
class TestRecommendation:
    primary: StatisticalTest
    alternatives: List[StatisticalTest]
    rationale: str                     # plain-English explanation of why


# ── Test library ──────────────────────────────────────────────────────────────

TESTS = {

    # ── Comparison: 2 independent groups ─────────────────────────────────────
    "independent_t": StatisticalTest(
        id="independent_t",
        name="Independent samples t-test",
        description="Compares means of two independent groups.",
        assumptions=["normality", "homogeneity_of_variance", "independence",
                     "continuous_dv", "no_significant_outliers"],
        parametric=True,
        scipy_function="scipy.stats.ttest_ind",
        references=["Student, 1908", "Field, 2013, Ch.9"],
    ),
    "mann_whitney": StatisticalTest(
        id="mann_whitney",
        name="Mann-Whitney U test",
        description="Non-parametric alternative when normality or homogeneity assumptions fail.",
        assumptions=["independence", "ordinal_or_continuous_dv", "similar_shape"],
        parametric=False,
        scipy_function="scipy.stats.mannwhitneyu",
        references=["Mann & Whitney, 1947"],
    ),
    "welch_t": StatisticalTest(
        id="welch_t",
        name="Welch's t-test",
        description="Robust to unequal variances; preferred over Student's t when Levene's test is significant.",
        assumptions=["normality", "independence", "continuous_dv"],
        parametric=True,
        scipy_function="scipy.stats.ttest_ind(equal_var=False)",
        references=["Welch, 1947"],
        notes="Use when Levene's test is significant (p < .05).",
    ),

    # ── Comparison: 2 paired/related groups ──────────────────────────────────
    "paired_t": StatisticalTest(
        id="paired_t",
        name="Paired samples t-test",
        description="Compares means of the same group measured twice (e.g. pre/post).",
        assumptions=["normality_of_differences", "no_significant_outliers",
                     "continuous_dv"],
        parametric=True,
        scipy_function="scipy.stats.ttest_rel",
        references=["Field, 2013, Ch.9"],
    ),
    "wilcoxon": StatisticalTest(
        id="wilcoxon",
        name="Wilcoxon signed-rank test",
        description="Non-parametric paired comparison.",
        assumptions=["ordinal_or_continuous_dv", "paired_observations"],
        parametric=False,
        scipy_function="scipy.stats.wilcoxon",
        references=["Wilcoxon, 1945"],
    ),

    # ── Comparison: 3+ independent groups ────────────────────────────────────
    "one_way_anova": StatisticalTest(
        id="one_way_anova",
        name="One-way ANOVA",
        description="Compares means across 3+ independent groups.",
        assumptions=["normality", "homogeneity_of_variance", "independence",
                     "continuous_dv", "no_significant_outliers"],
        parametric=True,
        scipy_function="scipy.stats.f_oneway",
        references=["Fisher, 1921"],
        notes="Follow up with post-hoc tests (Tukey HSD, Bonferroni) if significant.",
    ),
    "kruskal_wallis": StatisticalTest(
        id="kruskal_wallis",
        name="Kruskal-Wallis H test",
        description="Non-parametric alternative to one-way ANOVA.",
        assumptions=["independence", "ordinal_or_continuous_dv", "similar_shape"],
        parametric=False,
        scipy_function="scipy.stats.kruskal",
        references=["Kruskal & Wallis, 1952"],
        notes="Follow up with Dunn's test for pairwise comparisons.",
    ),
    "welch_anova": StatisticalTest(
        id="welch_anova",
        name="Welch's ANOVA (one-way)",
        description="Robust ANOVA when homogeneity of variance is violated.",
        assumptions=["normality", "independence", "continuous_dv"],
        parametric=True,
        scipy_function="pingouin.welch_anova",
        references=["Welch, 1951"],
    ),

    # ── Comparison: repeated measures / mixed ─────────────────────────────────
    "repeated_anova": StatisticalTest(
        id="repeated_anova",
        name="Repeated-measures ANOVA",
        description="Compares means across 3+ time points or conditions within the same subjects.",
        assumptions=["normality", "sphericity", "continuous_dv"],
        parametric=True,
        scipy_function="pingouin.rm_anova",
        references=["Field, 2013, Ch.13"],
        notes="Check Mauchly's test for sphericity; apply Greenhouse-Geisser correction if violated.",
    ),
    "friedman": StatisticalTest(
        id="friedman",
        name="Friedman test",
        description="Non-parametric repeated-measures comparison.",
        assumptions=["ordinal_or_continuous_dv", "paired_observations"],
        parametric=False,
        scipy_function="scipy.stats.friedmanchisquare",
        references=["Friedman, 1937"],
    ),

    # ── Association: categorical data ─────────────────────────────────────────
    "chi_square": StatisticalTest(
        id="chi_square",
        name="Chi-square test of independence",
        description="Tests association between two categorical variables.",
        assumptions=["independence", "expected_freq_ge_5", "categorical_vars"],
        parametric=False,
        scipy_function="scipy.stats.chi2_contingency",
        references=["Pearson, 1900"],
        notes="If expected cell frequencies < 5, use Fisher's exact test.",
    ),
    "fishers_exact": StatisticalTest(
        id="fishers_exact",
        name="Fisher's exact test",
        description="Exact test for 2×2 contingency tables with small expected frequencies.",
        assumptions=["independence", "categorical_vars", "two_by_two_table"],
        parametric=False,
        scipy_function="scipy.stats.fisher_exact",
        references=["Fisher, 1922"],
    ),

    # ── Correlation / relationship ────────────────────────────────────────────
    "pearson_r": StatisticalTest(
        id="pearson_r",
        name="Pearson's r correlation",
        description="Linear relationship between two continuous variables.",
        assumptions=["normality", "linearity", "no_significant_outliers",
                     "continuous_dv", "homoscedasticity"],
        parametric=True,
        scipy_function="scipy.stats.pearsonr",
        references=["Pearson, 1895"],
    ),
    "spearman_rho": StatisticalTest(
        id="spearman_rho",
        name="Spearman's rho correlation",
        description="Monotonic relationship; robust to non-normality and outliers.",
        assumptions=["ordinal_or_continuous_dv", "monotonic_relationship"],
        parametric=False,
        scipy_function="scipy.stats.spearmanr",
        references=["Spearman, 1904"],
    ),
    "kendall_tau": StatisticalTest(
        id="kendall_tau",
        name="Kendall's tau correlation",
        description="Rank-based correlation; preferred over Spearman for small samples.",
        assumptions=["ordinal_or_continuous_dv"],
        parametric=False,
        scipy_function="scipy.stats.kendalltau",
        references=["Kendall, 1938"],
    ),

    # ── Prediction / modelling ────────────────────────────────────────────────
    "simple_linear_regression": StatisticalTest(
        id="simple_linear_regression",
        name="Simple linear regression",
        description="Predict a continuous outcome from one predictor.",
        assumptions=["linearity", "normality_of_residuals", "homoscedasticity",
                     "independence", "no_significant_outliers"],
        parametric=True,
        scipy_function="statsmodels.formula.api.ols",
        references=["Galton, 1886"],
    ),
    "multiple_linear_regression": StatisticalTest(
        id="multiple_linear_regression",
        name="Multiple linear regression",
        description="Predict a continuous outcome from multiple predictors.",
        assumptions=["linearity", "normality_of_residuals", "homoscedasticity",
                     "independence", "no_multicollinearity", "no_significant_outliers"],
        parametric=True,
        scipy_function="statsmodels.formula.api.ols",
        references=["Field, 2013, Ch.7-8"],
        notes="Check VIF for multicollinearity; plot residuals.",
    ),
    "logistic_regression": StatisticalTest(
        id="logistic_regression",
        name="Binary logistic regression",
        description="Predict a binary outcome from continuous/categorical predictors.",
        assumptions=["independence", "no_multicollinearity",
                     "large_sample", "linearity_of_logit"],
        parametric=True,
        scipy_function="statsmodels.formula.api.logit",
        references=["Cox, 1958"],
    ),
}


# ── Decision tree ─────────────────────────────────────────────────────────────

def recommend_tests(profile: dict) -> TestRecommendation:
    """
    Core routing function.

    profile keys (all set by questionnaire):
        research_question_type : "comparison" | "correlation" | "prediction" | "description"
        measurement_level      : "nominal" | "ordinal" | "interval_ratio"
        n_groups               : int  (for comparison questions)
        design                 : "independent" | "paired" | "mixed"
        sample_size            : int
        normality_known        : bool | None
        equal_variances_known  : bool | None
        binary_outcome         : bool
    """
    rqt  = profile.get("research_question_type")
    ml   = profile.get("measurement_level")
    n_g  = profile.get("n_groups", 2)
    design = profile.get("design", "independent")
    n    = profile.get("sample_size", 0)
    norm = profile.get("normality_known")          # True / False / None
    ev   = profile.get("equal_variances_known")    # True / False / None
    binary = profile.get("binary_outcome", False)

    # ── Comparison ─────────────────────────────────────────────────────────
    if rqt == "comparison":
        if ml == "nominal":
            return TestRecommendation(
                primary=TESTS["chi_square"],
                alternatives=[TESTS["fishers_exact"]],
                rationale="Nominal outcome → chi-square test of independence. "
                          "If any expected cell count < 5, use Fisher's exact test instead.",
            )

        if design == "independent":
            if n_g == 2:
                if norm is False or (norm is None and n < 30):
                    return TestRecommendation(
                        primary=TESTS["mann_whitney"],
                        alternatives=[TESTS["independent_t"]],
                        rationale="Non-parametric route: normality not confirmed and "
                                  "n < 30 (CLT cannot rescue). Mann-Whitney U is recommended. "
                                  "Verify with normality tests in the Assumptions tab.",
                    )
                if ev is False:
                    return TestRecommendation(
                        primary=TESTS["welch_t"],
                        alternatives=[TESTS["mann_whitney"]],
                        rationale="Levene's test significant → equal variances cannot be assumed. "
                                  "Welch's t-test is robust to this violation.",
                    )
                return TestRecommendation(
                    primary=TESTS["independent_t"],
                    alternatives=[TESTS["welch_t"], TESTS["mann_whitney"]],
                    rationale="Two independent groups, continuous outcome. "
                              "Student's t-test assuming normality and equal variances. "
                              "Run Levene's and Shapiro-Wilk in Assumptions tab first.",
                )
            else:  # 3+ groups
                if norm is False:
                    return TestRecommendation(
                        primary=TESTS["kruskal_wallis"],
                        alternatives=[TESTS["one_way_anova"]],
                        rationale="3+ independent groups, normality violated → Kruskal-Wallis.",
                    )
                if ev is False:
                    return TestRecommendation(
                        primary=TESTS["welch_anova"],
                        alternatives=[TESTS["kruskal_wallis"]],
                        rationale="Equal variances violated → Welch's ANOVA.",
                    )
                return TestRecommendation(
                    primary=TESTS["one_way_anova"],
                    alternatives=[TESTS["welch_anova"], TESTS["kruskal_wallis"]],
                    rationale="3+ independent groups → one-way ANOVA. "
                              "Follow up with Tukey HSD post-hoc if significant.",
                )

        elif design in ("paired", "repeated"):
            if n_g == 2:
                if norm is False:
                    return TestRecommendation(
                        primary=TESTS["wilcoxon"],
                        alternatives=[TESTS["paired_t"]],
                        rationale="Paired design, normality violated → Wilcoxon signed-rank test.",
                    )
                return TestRecommendation(
                    primary=TESTS["paired_t"],
                    alternatives=[TESTS["wilcoxon"]],
                    rationale="Paired/repeated design, 2 conditions → paired t-test.",
                )
            else:
                if norm is False:
                    return TestRecommendation(
                        primary=TESTS["friedman"],
                        alternatives=[TESTS["repeated_anova"]],
                        rationale="Repeated measures, normality violated → Friedman test.",
                    )
                return TestRecommendation(
                    primary=TESTS["repeated_anova"],
                    alternatives=[TESTS["friedman"]],
                    rationale="Repeated measures, 3+ conditions → RM-ANOVA. "
                              "Check Mauchly's sphericity test; apply Greenhouse-Geisser if violated.",
                )

    # ── Correlation / relationship ──────────────────────────────────────────
    elif rqt == "correlation":
        if ml == "nominal":
            return TestRecommendation(
                primary=TESTS["chi_square"],
                alternatives=[TESTS["fishers_exact"]],
                rationale="Nominal variables → chi-square (or Fisher's exact for small samples).",
            )
        if norm is False or ml == "ordinal":
            if n < 30:
                return TestRecommendation(
                    primary=TESTS["kendall_tau"],
                    alternatives=[TESTS["spearman_rho"]],
                    rationale="Small sample or ordinal data → Kendall's tau (more robust than Spearman for n < 30).",
                )
            return TestRecommendation(
                primary=TESTS["spearman_rho"],
                alternatives=[TESTS["kendall_tau"]],
                rationale="Non-normal or ordinal data → Spearman's rho.",
            )
        return TestRecommendation(
            primary=TESTS["pearson_r"],
            alternatives=[TESTS["spearman_rho"]],
            rationale="Continuous, normally distributed variables → Pearson's r. "
                      "Check for linearity (scatterplot) and outliers first.",
        )

    # ── Prediction ─────────────────────────────────────────────────────────
    elif rqt == "prediction":
        if binary:
            return TestRecommendation(
                primary=TESTS["logistic_regression"],
                alternatives=[],
                rationale="Binary outcome → binary logistic regression.",
            )
        n_predictors = profile.get("n_predictors", 1)
        if n_predictors == 1:
            return TestRecommendation(
                primary=TESTS["simple_linear_regression"],
                alternatives=[TESTS["multiple_linear_regression"]],
                rationale="Single continuous predictor → simple linear regression.",
            )
        return TestRecommendation(
            primary=TESTS["multiple_linear_regression"],
            alternatives=[],
            rationale=f"{n_predictors} predictors → multiple linear regression. "
                      "Check VIF for multicollinearity (threshold: VIF > 10).",
        )

    # ── Fallback ───────────────────────────────────────────────────────────
    return TestRecommendation(
        primary=TESTS["pearson_r"],
        alternatives=list(TESTS.values()),
        rationale="Could not determine test from profile. "
                  "Please complete the questionnaire.",
    )
