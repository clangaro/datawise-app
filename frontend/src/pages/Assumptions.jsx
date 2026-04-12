import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3, CheckCircle2, XCircle, AlertTriangle, Circle,
  Zap, ArrowLeft, ArrowRight, PlayCircle,
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

function AssumptionCard({ assumption, result, onRun, loading, canRun }) {
  const status = statusFor(result);
  const StatusIcon = status.Icon;
  return (
    <div style={{
      position: "relative",
      padding: "18px 22px",
      border: `1px solid ${result ? status.color + "66" : C.border}`,
      background: result
        ? `linear-gradient(90deg, ${status.color}10, ${C.panel}cc)`
        : `${C.panel}aa`,
      clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
      boxShadow: result ? `0 0 18px ${status.color}18` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <Zap size={16} color={C.yellow} strokeWidth={1.6} />
          <div>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 13,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {ASSUMPTION_LABELS[assumption] || assumption}
            </div>
            {!CHECKABLE.has(assumption) && (
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                color: C.muted, marginTop: 3, letterSpacing: "0.12em",
              }}>
                VERIFIED BY DESIGN · NO AUTO TEST
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
          marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${status.color}44`,
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10,
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
        }}>
          <div>
            <span style={{ color: C.muted, letterSpacing: "0.1em" }}>STAT:</span>{" "}
            <span style={{ color: C.ink, fontWeight: 600 }}>
              {result.statistic != null ? Number(result.statistic).toFixed(4) : "—"}
            </span>
          </div>
          <div>
            <span style={{ color: C.muted, letterSpacing: "0.1em" }}>P-VALUE:</span>{" "}
            <span style={{ color: C.ink, fontWeight: 600 }}>
              {result.p_value != null ? Number(result.p_value).toFixed(4) : "—"}
            </span>
          </div>
          <div style={{
            gridColumn: "1 / -1", color: C.ink,
            fontFamily: "Rajdhani, sans-serif", fontSize: 13,
          }}>
            <span style={{ color: C.muted, fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.1em" }}>INTERPRETATION:</span>{" "}
            {result.interpretation}
          </div>
          {result.recommendation && (
            <div style={{
              gridColumn: "1 / -1", color: C.coral,
              fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 500,
            }}>
              {"→ "}{result.recommendation}
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
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
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

      {(recommendation.alternatives?.length > 0) && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {hasFailures ? "Alternatives (recommended)" : "Alternative tests"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => setSelectedTestId(recommendation.primary.id)}
              style={{
                textAlign: "left", padding: "12px 16px", borderRadius: 12,
                border: `1.5px solid ${selectedTestId === recommendation.primary.id ? C.coral : C.border}`,
                background: selectedTestId === recommendation.primary.id ? C.coral + "0f" : "#fff",
                cursor: "pointer", fontFamily: "Rajdhani, sans-serif",
              }}
            >
              <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink }}>
                {recommendation.primary.name} <Pill color={C.coral}>Primary</Pill>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{recommendation.primary.description}</div>
            </button>
            {recommendation.alternatives.map(alt => (
              <button
                key={alt.id}
                onClick={() => setSelectedTestId(alt.id)}
                style={{
                  textAlign: "left", padding: "12px 16px", borderRadius: 12,
                  border: `1.5px solid ${selectedTestId === alt.id ? C.teal : C.border}`,
                  background: selectedTestId === alt.id ? C.teal + "0f" : "#fff",
                  cursor: "pointer", fontFamily: "Rajdhani, sans-serif",
                }}
              >
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink }}>
                  {alt.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{alt.description}</div>
              </button>
            ))}
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
