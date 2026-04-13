import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3, CheckCircle2, XCircle, AlertTriangle, Circle,
  Zap, ArrowLeft, ArrowRight, PlayCircle, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, Btn, Pill, Spinner, SectionTitle, C } from "../components/ui.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { checkAssumptions } from "../api/client.js";

const CHECKABLE = new Set([
  "normality",
  "normality_of_differences",
  "homogeneity_of_variance",
  "no_significant_outliers",
  "linearity",
  "independence",
]);

const ASSUMPTION_EXPLAINERS = {
  normality:                 "Statistical tests like the t-test and ANOVA assume your data follows a bell-shaped (normal) distribution. If this is violated, p-values may be inaccurate, leading to false conclusions.",
  normality_of_differences:  "For paired tests, the differences between matched observations must be normally distributed — not the raw scores themselves. This ensures valid confidence intervals.",
  homogeneity_of_variance:   "Tests comparing group means assume each group has roughly equal spread (variance). Unequal variances inflate Type I error — Welch's correction or a non-parametric test is needed if this fails.",
  no_significant_outliers:   "Extreme values disproportionately pull the mean and inflate the test statistic. Outliers can mask real effects or create phantom ones. We flag points beyond 1.5× the IQR.",
  linearity:                 "Correlation and regression assume a straight-line relationship between variables. If the true relationship is curved, a linear model will underestimate the strength of association.",
  independence:              "Each observation must be unrelated to every other. Violating this (e.g. repeated measures treated as independent) inflates degrees of freedom and produces artificially small p-values.",
  continuous_dv:             "The dependent variable must be measured on a continuous scale (interval or ratio). Discrete or categorical outcomes require different test families.",
  ordinal_or_continuous_dv:  "Non-parametric tests require at least ordinal data — the values must have a meaningful rank order, even if intervals between ranks aren't equal.",
  similar_shape:             "Non-parametric tests like Mann-Whitney compare rank distributions. If the two distributions have very different shapes, the test compares medians ambiguously.",
  paired_observations:       "Each measurement in one condition must have a matched counterpart in the other. Unmatched pairs break the pairing logic and invalidate the test.",
  sphericity:                "Repeated-measures ANOVA assumes equal variance of differences between all pairs of conditions. Mauchly's test checks this; Greenhouse-Geisser corrects violations.",
  expected_freq_ge_5:        "Chi-square approximations break down when expected cell frequencies drop below 5. Fisher's exact test is used instead for small-sample contingency tables.",
  categorical_vars:          "Both variables must be categorical (nominal) for association tests like chi-square. Continuous data must be binned or a different test used.",
  two_by_two_table:          "Fisher's exact test is designed specifically for 2×2 contingency tables. Larger tables require chi-square or exact multinomial tests.",
  homoscedasticity:          "Regression assumes constant variance of residuals across all levels of the predictor. Funnel-shaped residual plots indicate heteroscedasticity, biasing standard errors.",
  monotonic_relationship:    "Spearman's rho detects monotonic (consistently increasing or decreasing) relationships, not just linear ones. A U-shaped pattern would produce ρ ≈ 0 even if variables are related.",
  normality_of_residuals:    "Regression assumes residuals (prediction errors) are normally distributed. Non-normal residuals invalidate confidence intervals and hypothesis tests on coefficients.",
  no_multicollinearity:      "When predictors are highly correlated with each other, their individual contributions become unstable. VIF > 10 signals problematic collinearity.",
  linearity_of_logit:        "Logistic regression assumes each continuous predictor has a linear relationship with the log-odds of the outcome. Non-linear relationships require polynomial or spline terms.",
  large_sample:              "Logistic regression relies on maximum likelihood estimation, which requires large samples to produce stable, reliable parameter estimates.",
};

const ASSUMPTION_LABELS = {
  normality:                 "Normality of DV",
  normality_of_differences:  "Normality of differences (paired)",
  homogeneity_of_variance:   "Homogeneity of variance (Levene's)",
  no_significant_outliers:   "No significant outliers",
  linearity:                 "Linearity of relationship",
  independence:              "Independence of observations",
  continuous_dv:             "Continuous DV",
  ordinal_or_continuous_dv:  "Ordinal or continuous DV",
  similar_shape:             "Similar distribution shape",
  paired_observations:       "Paired observations",
  sphericity:                "Sphericity (Mauchly's)",
  expected_freq_ge_5:        "Expected frequencies ≥ 5",
  categorical_vars:          "Categorical variables",
  two_by_two_table:          "2×2 contingency table",
  homoscedasticity:          "Homoscedasticity",
  monotonic_relationship:    "Monotonic relationship",
  normality_of_residuals:    "Normality of residuals",
  no_multicollinearity:      "No multicollinearity",
  linearity_of_logit:        "Linearity of logit",
  large_sample:              "Large sample size",
};

function toNumericArray(rows, colName) {
  return rows
    .map(r => r[colName])
    .filter(v => v !== null && v !== undefined && v !== "")
    .map(Number)
    .filter(v => !Number.isNaN(v));
}

function buildGroups(rows, groupCol, dvCol) {
  const groups = {};
  for (const row of rows) {
    const key = row[groupCol];
    if (key === null || key === undefined || key === "") continue;
    const val = Number(row[dvCol]);
    if (Number.isNaN(val)) continue;
    const k = String(key);
    if (!groups[k]) groups[k] = [];
    groups[k].push(val);
  }
  return groups;
}

function statusFor(result) {
  if (result == null) return { color: C.muted, label: "Pending", Icon: Circle };
  if (result.severity === "fail" || result.passed === false) return { color: C.red, label: "Fail", Icon: XCircle };
  if (result.severity === "warning") return { color: C.yellow, label: "Warning", Icon: AlertTriangle };
  return { color: C.teal, label: "Pass", Icon: CheckCircle2 };
}

function AssumptionCard({ assumption, result, onRun, loading, canRun, expanded, onToggleExpand }) {
  const status = statusFor(result);
  const StatusIcon = status.Icon;
  const isFail = status.label === "Fail";
  return (
    <div style={{
      position: "relative",
      padding: "18px 22px",
      border: `1px solid ${isFail ? C.red + "aa" : result ? status.color + "66" : C.border}`,
      background: isFail
        ? `linear-gradient(135deg, ${C.red}14 0%, #1a0508 40%, ${C.deep} 100%)`
        : result
          ? `linear-gradient(90deg, ${status.color}10, ${C.panel}cc)`
          : `${C.panel}aa`,
      clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
      boxShadow: isFail
        ? `0 0 30px ${C.red}33, inset 0 0 0 1px ${C.red}22, inset 0 0 40px ${C.red}0a`
        : result ? `0 0 18px ${status.color}18` : "none",
    }}>
      {/* red scanline for failures */}
      {isFail && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
          opacity: 0.15,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 3px, ${C.red}18 3px, ${C.red}18 4px)`,
          }} />
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          {isFail
            ? <XCircle size={16} color={C.red} strokeWidth={1.8} />
            : <Zap size={16} color={C.yellow} strokeWidth={1.6} />}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 13,
                color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {ASSUMPTION_LABELS[assumption] || assumption}
              </div>
              {ASSUMPTION_EXPLAINERS[assumption] && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px 6px", display: "flex", alignItems: "center", gap: 4,
                    fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                    color: C.coral, letterSpacing: "0.14em",
                  }}
                >
                  <Info size={10} color={C.coral} strokeWidth={1.8} />
                  {expanded ? "HIDE" : "WHY?"}
                </button>
              )}
            </div>
            {!CHECKABLE.has(assumption) && (
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                color: C.muted, marginTop: 3, letterSpacing: "0.12em",
              }}>
                VERIFIED BY DESIGN · NO AUTO TEST
              </div>
            )}
            {expanded && ASSUMPTION_EXPLAINERS[assumption] && (
              <div style={{
                fontFamily: "Rajdhani, sans-serif", fontSize: 12,
                color: C.ink + "bb", lineHeight: 1.6, marginTop: 8,
                paddingLeft: 0, borderLeft: `2px solid ${C.coral}33`,
                paddingLeft: 12,
              }}>
                {ASSUMPTION_EXPLAINERS[assumption]}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color={status.color}><StatusIcon size={10} /> {status.label}</Pill>
          {CHECKABLE.has(assumption) && (
            <Btn
              color={C.teal}
              outline
              disabled={!canRun || loading}
              onClick={onRun}
              style={{ padding: "7px 14px", fontSize: 10 }}
            >
              {loading ? "Running…" : result ? "Re-run" : <><PlayCircle size={12} /> Run</>}
            </Btn>
          )}
        </div>
      </div>

      {result && (
        <div style={{
          position: "relative", zIndex: 1,
          marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${isFail ? C.red + "66" : status.color + "44"}`,
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10,
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
        }}>
          <div>
            <span style={{ color: C.muted, letterSpacing: "0.1em" }}>STAT:</span>{" "}
            <span style={{ color: isFail ? C.red : C.ink, fontWeight: 600 }}>
              {result.statistic != null ? Number(result.statistic).toFixed(4) : "—"}
            </span>
          </div>
          <div>
            <span style={{ color: C.muted, letterSpacing: "0.1em" }}>P-VALUE:</span>{" "}
            <span style={{ color: isFail ? C.red : C.ink, fontWeight: 600 }}>
              {result.p_value != null ? Number(result.p_value).toFixed(4) : "—"}
            </span>
          </div>
          <div style={{
            gridColumn: "1 / -1", color: isFail ? C.ink : C.ink,
            fontFamily: "Rajdhani, sans-serif", fontSize: 13,
          }}>
            <span style={{ color: isFail ? C.red : C.muted, fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.1em" }}>
              {isFail ? "VIOLATION:" : "INTERPRETATION:"}
            </span>{" "}
            {result.interpretation}
          </div>
          {result.recommendation && (
            <div style={{
              gridColumn: "1 / -1", color: isFail ? C.red : C.coral,
              fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 500,
              borderLeft: isFail ? `2px solid ${C.red}` : "none",
              paddingLeft: isFail ? 10 : 0,
            }}>
              {"→ "}{result.recommendation}
            </div>
          )}
          {isFail && ASSUMPTION_EXPLAINERS[assumption] && (
            <div style={{
              gridColumn: "1 / -1",
              padding: "10px 14px", marginTop: 4,
              background: `${C.red}0c`,
              border: `1px dashed ${C.red}44`,
              clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
              fontFamily: "Rajdhani, sans-serif", fontSize: 12,
              color: C.ink + "cc", lineHeight: 1.6,
            }}>
              <span style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                color: C.red, letterSpacing: "0.14em",
              }}>WHY THIS MATTERS: </span>
              {ASSUMPTION_EXPLAINERS[assumption]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Assumptions() {
  const navigate = useNavigate();
  const {
    profile, recommendation, fileData, columnRoles, alpha,
    assumptionResults, setAssumptionResults,
    selectedTestId, setSelectedTestId,
  } = useAnalysis();
  const [loadingMap, setLoadingMap] = useState({});
  const [showExplainer, setShowExplainer] = useState(true);
  const [expandedAssumption, setExpandedAssumption] = useState(null);

  const activeTest = useMemo(() => {
    if (!recommendation) return null;
    if (selectedTestId === recommendation.primary.id) return recommendation.primary;
    const alt = recommendation.alternatives.find(a => a.id === selectedTestId);
    return alt || recommendation.primary;
  }, [recommendation, selectedTestId]);

  const summary = useMemo(() => {
    let pass = 0, warn = 0, fail = 0;
    for (const r of assumptionResults) {
      const s = statusFor(r).label;
      if (s === "Pass") pass++;
      else if (s === "Warning") warn++;
      else if (s === "Fail") fail++;
    }
    return { pass, warn, fail };
  }, [assumptionResults]);

  if (!recommendation || !fileData || !activeTest) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20, color: C.ink, marginBottom: 12 }}>
            Missing data or recommendation.
          </div>
          <Btn onClick={() => navigate("/questionnaire")}>← Start over</Btn>
        </Card>
      </div>
    );
  }

  const rows = fileData.preview || [];
  const { dv: dvCol, iv: ivCol, group: groupCol } = columnRoles;

  const buildPayload = (assumption) => {
    const payload = { test_id: activeTest.id, alpha };
    if (dvCol) payload.dv = toNumericArray(rows, dvCol);
    if (ivCol) payload.iv = toNumericArray(rows, ivCol);
    if (groupCol) payload.groups = buildGroups(rows, groupCol, dvCol);
    if (assumption === "normality_of_differences" && payload.iv && payload.dv) {
      const len = Math.min(payload.iv.length, payload.dv.length);
      payload.differences = Array.from({ length: len }, (_, i) => payload.dv[i] - payload.iv[i]);
    }
    return payload;
  };

  const runOne = async (assumption) => {
    setLoadingMap(m => ({ ...m, [assumption]: true }));
    try {
      const payload = buildPayload(assumption);
      const res = await checkAssumptions(payload);
      const returned = res.results || [];
      const matched = returned.find(r => {
        const nm = r.name.toLowerCase();
        if (assumption === "normality") return nm.includes("normal");
        if (assumption === "normality_of_differences") return nm.includes("difference") || nm.includes("normal");
        if (assumption === "homogeneity_of_variance") return nm.includes("levene") || nm.includes("variance") || nm.includes("homogeneity");
        if (assumption === "no_significant_outliers") return nm.includes("outlier");
        if (assumption === "linearity") return nm.includes("linear");
        if (assumption === "independence") return nm.includes("independence") || nm.includes("runs");
        return false;
      }) || returned[0];

      const merged = [...assumptionResults.filter(r => r._assumption !== assumption)];
      if (matched) merged.push({ ...matched, _assumption: assumption });
      setAssumptionResults(merged);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || `Failed to check ${assumption}`);
    } finally {
      setLoadingMap(m => ({ ...m, [assumption]: false }));
    }
  };

  const runAll = async () => {
    for (const a of activeTest.assumptions) {
      if (CHECKABLE.has(a)) await runOne(a);
    }
  };

  const hasFailures = summary.fail > 0;
  const canRun = dvCol && rows.length > 0;

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 16px" }}>
      <SectionTitle subtitle="Verify that your data meets the test's requirements">
        Check assumptions
      </SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56,
            border: `1px solid ${C.coral}66`,
            background: `${C.coral}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            boxShadow: `0 0 20px ${C.coral}22 inset`,
          }}>
            <BarChart3 size={26} color={C.coral} strokeWidth={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 16,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {activeTest.name}
            </div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, color: C.muted, marginTop: 4 }}>
              {activeTest.description}
            </div>
          </div>
          <Pill color={activeTest.parametric ? C.coral : C.purple}>
            {activeTest.parametric ? "Parametric" : "Non-param"}
          </Pill>
        </div>
        <p style={{
          fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: C.ink + "cc",
          lineHeight: 1.7, margin: "16px 0 0", borderLeft: `2px solid ${C.coral}`,
          paddingLeft: 14,
        }}>
          {recommendation.rationale}
        </p>
      </Card>

      {/* Explainer card */}
      <Card style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowExplainer(s => !s)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Info size={20} color={C.coral} strokeWidth={1.6} />
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 14,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Why do we check assumptions?
            </div>
          </div>
          {showExplainer
            ? <ChevronUp size={18} color={C.muted} />
            : <ChevronDown size={18} color={C.muted} />}
        </button>
        {showExplainer && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: 14, color: C.ink + "cc",
              lineHeight: 1.7, margin: "0 0 16px",
            }}>
              Every statistical test is built on mathematical conditions that must hold for its results to be trustworthy.
              If an assumption is violated, the test may produce misleading p-values, inflated Type I error (false positives),
              or reduced power (missed real effects). D.A.R.V.I.S. runs formal checks before executing any test — and
              automatically suggests robust alternatives when violations are detected.
            </p>
            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10,
              color: C.coral, letterSpacing: "0.18em", marginBottom: 12,
            }}>
              {">> THIS TEST REQUIRES " + String(activeTest.assumptions.length).padStart(2, "0") + " ASSUMPTIONS"}
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10,
            }}>
              {activeTest.assumptions.map(a => (
                <div key={a} style={{
                  padding: "10px 14px",
                  background: `${C.panel}88`,
                  border: `1px dashed ${C.border}`,
                  clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
                }}>
                  <div style={{
                    fontFamily: "Orbitron, sans-serif", fontSize: 10, fontWeight: 600,
                    color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}>
                    {ASSUMPTION_LABELS[a] || a}
                  </div>
                  <div style={{
                    fontFamily: "Rajdhani, sans-serif", fontSize: 11,
                    color: C.muted, lineHeight: 1.5,
                  }}>
                    {ASSUMPTION_EXPLAINERS[a] || "Required by this test's mathematical model."}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.coral,
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          {">> "}ASSUMPTIONS · {String(activeTest.assumptions.length).padStart(2, "0")}
        </div>
        <Btn color={C.teal} onClick={runAll} disabled={!canRun} style={{ padding: "9px 18px" }}>
          <PlayCircle size={12} /> Run All
        </Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {activeTest.assumptions.map(a => {
          const result = assumptionResults.find(r => r._assumption === a);
          return (
            <AssumptionCard
              key={a}
              assumption={a}
              result={result}
              loading={!!loadingMap[a]}
              canRun={canRun}
              onRun={() => runOne(a)}
              expanded={expandedAssumption === a}
              onToggleExpand={() => setExpandedAssumption(prev => prev === a ? null : a)}
            />
          );
        })}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: C.coral,
          letterSpacing: "0.2em", marginBottom: 14,
        }}>
          {">> DIAGNOSTIC SUMMARY"}
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[
            { label: "PASSED",  val: summary.pass, color: C.teal,  Icon: CheckCircle2 },
            { label: "WARNING", val: summary.warn, color: C.yellow, Icon: AlertTriangle },
            { label: "FAILED",  val: summary.fail, color: C.red,   Icon: XCircle },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <s.Icon size={20} color={s.color} strokeWidth={1.6} />
              <div>
                <div style={{
                  fontFamily: "Orbitron, sans-serif", fontSize: 26, fontWeight: 800,
                  color: s.color, textShadow: `0 0 14px ${s.color}66`, lineHeight: 1,
                }}>
                  {String(s.val).padStart(2, "0")}
                </div>
                <div style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                  color: C.muted, letterSpacing: "0.18em", marginTop: 4,
                }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Failures breakdown */}
      {summary.fail > 0 && (
        <Card style={{
          marginBottom: 20,
          background: `linear-gradient(135deg, ${C.red}0c 0%, ${C.deep} 50%)`,
          borderColor: C.red + "66",
          boxShadow: `0 0 30px ${C.red}15, inset 0 0 0 1px ${C.red}12`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40,
              border: `1px solid ${C.red}88`,
              background: `${C.red}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
            }}>
              <AlertTriangle size={20} color={C.red} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontSize: 14, fontWeight: 700,
                color: C.red, textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Assumption Violations Detected
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                color: C.muted, letterSpacing: "0.18em", marginTop: 2,
              }}>
                {">> "}{summary.fail} CRITICAL · {summary.warn} WARNING · REVIEW REQUIRED
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: "Rajdhani, sans-serif", fontSize: 13,
            color: C.ink + "cc", lineHeight: 1.7, marginBottom: 18,
            borderLeft: `2px solid ${C.red}44`, paddingLeft: 14,
          }}>
            The following assumptions have been formally violated. Running the current test
            ({activeTest.name}) under these conditions may produce unreliable p-values or
            inflated Type I error. Consider switching to an alternative test or transforming your data.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assumptionResults
              .filter(r => r.passed === false || r.severity === "fail")
              .map((r, i) => (
                <div key={i} style={{
                  padding: "14px 18px",
                  background: `linear-gradient(90deg, ${C.red}10, ${C.deep})`,
                  border: `1px solid ${C.red}44`,
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <XCircle size={14} color={C.red} strokeWidth={1.8} />
                    <div style={{
                      fontFamily: "Orbitron, sans-serif", fontSize: 12, fontWeight: 600,
                      color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {r.name}
                    </div>
                    <div style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                      color: C.red, letterSpacing: "0.14em", marginLeft: "auto",
                    }}>
                      {r.statistic != null && `STAT: ${Number(r.statistic).toFixed(4)}`}
                      {r.p_value != null && `  ·  P: ${Number(r.p_value).toFixed(4)}`}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "Rajdhani, sans-serif", fontSize: 12,
                    color: C.ink + "cc", lineHeight: 1.5, marginBottom: 6,
                  }}>
                    {r.interpretation}
                  </div>
                  {r.recommendation && (
                    <div style={{
                      fontFamily: "Rajdhani, sans-serif", fontSize: 12,
                      color: C.red, fontWeight: 500,
                    }}>
                      → {r.recommendation}
                    </div>
                  )}
                  {r._assumption && ASSUMPTION_EXPLAINERS[r._assumption] && (
                    <div style={{
                      fontFamily: "Rajdhani, sans-serif", fontSize: 11,
                      color: C.muted, lineHeight: 1.5, marginTop: 8,
                      borderTop: `1px dashed ${C.red}33`, paddingTop: 8,
                    }}>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace", fontSize: 8,
                        color: C.red, letterSpacing: "0.16em",
                      }}>EXPLAINER: </span>
                      {ASSUMPTION_EXPLAINERS[r._assumption]}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </Card>
      )}

      {(recommendation.alternatives?.length > 0) && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            color: C.coral, letterSpacing: "0.22em", marginBottom: 14,
          }}>
            {hasFailures ? ">> ALTERNATIVES (RECOMMENDED)" : ">> ALTERNATIVE_TESTS"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => setSelectedTestId(recommendation.primary.id)}
              style={{
                textAlign: "left", padding: "14px 18px",
                border: `1px solid ${selectedTestId === recommendation.primary.id ? C.coral : C.border}`,
                background: selectedTestId === recommendation.primary.id
                  ? `linear-gradient(90deg, ${C.coral}18, ${C.panel}cc)`
                  : `${C.panel}88`,
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                cursor: "pointer",
                boxShadow: selectedTestId === recommendation.primary.id ? `0 0 20px ${C.coral}22, inset 0 0 0 1px ${C.coral}44` : "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 12, color: C.ink,
                textTransform: "uppercase", letterSpacing: "0.08em",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {recommendation.primary.name} <Pill color={C.coral}>Primary</Pill>
              </div>
              <div style={{
                fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4,
              }}>{recommendation.primary.description}</div>
            </button>
            {recommendation.alternatives.map(alt => {
              const isSelected = selectedTestId === alt.id;
              return (
                <button
                  key={alt.id}
                  onClick={() => setSelectedTestId(alt.id)}
                  style={{
                    textAlign: "left", padding: "14px 18px",
                    border: `1px solid ${isSelected ? C.teal : C.border}`,
                    background: isSelected
                      ? `linear-gradient(90deg, ${C.teal}18, ${C.panel}cc)`
                      : `${C.panel}55`,
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 0 20px ${C.teal}22, inset 0 0 0 1px ${C.teal}44` : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 12, color: isSelected ? C.ink : C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {alt.name}
                  </div>
                  <div style={{
                    fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4,
                  }}>{alt.description}</div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn color={C.navy} outline onClick={() => navigate("/upload")}>
          <ArrowLeft size={14} /> Back
        </Btn>
        <Btn onClick={() => navigate("/analysis")}>
          Engage Analysis <ArrowRight size={14} />
        </Btn>
      </div>
    </div>
  );
}
