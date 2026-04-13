import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Calculator, CheckCircle2, MinusCircle, Play, Copy,
  ArrowLeft, ArrowRight, Info,
} from "lucide-react";
import { Card, Btn, Pill, Spinner, SectionTitle, C } from "../components/ui.jsx";

function HudTooltip({ children, label, description }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
              transform: "translateX(-50%)",
              width: 280, zIndex: 60,
              padding: "14px 16px",
              background: C.deep,
              border: `1px solid ${C.coral}66`,
              clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              boxShadow: `0 0 30px ${C.coral}33, inset 0 0 0 1px ${C.coral}15`,
              pointerEvents: "none",
            }}
          >
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontSize: 10, fontWeight: 700,
              color: C.coral, textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: 6, display: "flex", alignItems: "center", gap: 6,
            }}>
              <Info size={10} /> {label}
            </div>
            <div style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: 12,
              color: C.ink + "dd", lineHeight: 1.6,
            }}>
              {description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const METRIC_EXPLAINERS = {
  statistic: {
    label: "Test Statistic",
    description: "A number that summarises how far your data departs from the null hypothesis. Larger absolute values indicate stronger evidence against H₀. The exact formula depends on the test (t, F, χ², r, etc.).",
  },
  p_value: {
    label: "P-Value",
    description: "The probability of seeing results at least as extreme as yours if the null hypothesis were true. Below your alpha threshold (usually 0.05), you reject H₀. It does NOT tell you the size or importance of the effect.",
  },
  effect_size: {
    label: "Effect Size",
    description: "A standardised measure of how large the observed difference or relationship actually is, independent of sample size. Cohen's d: 0.2 = small, 0.5 = medium, 0.8 = large. Eta²/r follow their own benchmarks.",
  },
  df: {
    label: "Degrees of Freedom",
    description: "The number of independent values that can vary in the analysis. It shapes the reference distribution used to compute the p-value. Larger df generally means more statistical power.",
  },
};
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { runAnalysis } from "../api/client.js";

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

function effectSizeBenchmark(name, value) {
  if (value == null) return "";
  const v = Math.abs(value);
  if (/d|hedge/i.test(name)) {
    if (v >= 0.8) return "Large";
    if (v >= 0.5) return "Medium";
    if (v >= 0.2) return "Small";
    return "Negligible";
  }
  if (/eta|η|r/i.test(name)) {
    if (v >= 0.5) return "Large";
    if (v >= 0.3) return "Medium";
    if (v >= 0.1) return "Small";
    return "Negligible";
  }
  return "";
}

function apaWriteup(result) {
  if (!result) return "";
  const pStr = result.p_value < 0.001 ? "< .001" : `= ${Number(result.p_value).toFixed(3)}`;
  const statStr = result.statistic != null ? Number(result.statistic).toFixed(2) : "—";
  const dfStr = result.df ? `(${result.df})` : "";
  const esStr = result.effect_size != null
    ? `, ${result.effect_size_name || "effect size"} = ${Number(result.effect_size).toFixed(2)}`
    : "";
  return `A ${result.test_name} was conducted. The results indicated that the difference was ${result.significant ? "statistically significant" : "not statistically significant"}, ${result.statistic_name}${dfStr} = ${statStr}, p ${pStr}${esStr}.`;
}

export default function Analysis() {
  const navigate = useNavigate();
  const {
    recommendation, fileData, columnRoles, alpha,
    selectedTestId, testResult, setTestResult,
  } = useAnalysis();
  const [running, setRunning] = useState(false);

  const activeTest = useMemo(() => {
    if (!recommendation) return null;
    if (selectedTestId === recommendation.primary.id) return recommendation.primary;
    return recommendation.alternatives.find(a => a.id === selectedTestId) || recommendation.primary;
  }, [recommendation, selectedTestId]);

  if (!recommendation || !fileData || !activeTest) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20, color: C.ink, marginBottom: 12 }}>
            Missing analysis state.
          </div>
          <Btn onClick={() => navigate("/questionnaire")}>← Start over</Btn>
        </Card>
      </div>
    );
  }

  const rows = fileData.preview || [];
  const { dv: dvCol, iv: ivCol, group: groupCol } = columnRoles;

  const handleRun = async () => {
    setRunning(true);
    try {
      const payload = { test_id: activeTest.id, alpha };
      if (dvCol) payload.dv = toNumericArray(rows, dvCol);
      if (ivCol) payload.iv = toNumericArray(rows, ivCol);
      if (groupCol && dvCol) payload.groups = buildGroups(rows, groupCol, dvCol);
      const res = await runAnalysis(payload);
      setTestResult(res);
      toast.success("Analysis complete");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setRunning(false);
    }
  };

  const significant = testResult?.significant;
  const pColor = significant ? C.teal : C.muted;
  const writeup = apaWriteup(testResult);
  const esLabel = effectSizeBenchmark(testResult?.effect_size_name, testResult?.effect_size);

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 16px" }}>
      <SectionTitle subtitle="Execute the selected statistical test on your data">
        Run analysis
      </SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56,
            border: `1px solid ${C.purple}66`,
            background: `${C.purple}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            boxShadow: `0 0 20px ${C.purple}22 inset`,
          }}>
            <Calculator size={26} color={C.purple} strokeWidth={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 18,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {activeTest.name}
            </div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, color: C.muted, marginTop: 4 }}>
              {activeTest.description}
            </div>
          </div>
          <Btn color={C.purple} onClick={handleRun} disabled={running}>
            {running ? "Running…" : testResult ? <><Play size={14} /> Re-run</> : <><Play size={14} /> Execute</>}
          </Btn>
        </div>
      </Card>

      {running && (
        <Card style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Spinner color={C.purple} size={48} />
            <div style={{
              fontFamily: "JetBrains Mono, monospace", color: C.purple,
              fontSize: 11, letterSpacing: "0.2em",
            }}>
              {">> COMPUTING STATISTICAL PROFILE..."}
            </div>
          </div>
        </Card>
      )}

      {testResult && !running && (
        <>
          <Card style={{
            background: `linear-gradient(135deg, ${(significant ? C.teal : C.muted)}18, ${C.panel}ee)`,
            borderColor: (significant ? C.teal : C.muted) + "88",
            marginBottom: 20,
            boxShadow: `0 0 40px ${(significant ? C.teal : C.muted)}22, inset 0 0 1px ${C.coral}20`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{
                width: 72, height: 72,
                border: `1px solid ${(significant ? C.teal : C.muted)}`,
                background: `${(significant ? C.teal : C.muted)}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                boxShadow: `0 0 30px ${(significant ? C.teal : C.muted)}55 inset`,
              }}>
                {significant
                  ? <CheckCircle2 size={36} color={C.teal} strokeWidth={1.5} />
                  : <MinusCircle size={36} color={C.muted} strokeWidth={1.5} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 20,
                  color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
                  textShadow: `0 0 20px ${(significant ? C.teal : C.muted)}88`,
                }}>
                  {significant ? "Signal Detected" : "No Significant Signal"}
                </div>
                <div style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                  color: C.muted, marginTop: 6, letterSpacing: "0.14em",
                }}>
                  {testResult.test_name.toUpperCase()}  ·  α = {testResult.alpha}
                </div>
              </div>
              <Pill color={pColor}>
                p {testResult.p_value < 0.001 ? "< .001" : `= ${Number(testResult.p_value).toFixed(3)}`}
              </Pill>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            <HudTooltip {...METRIC_EXPLAINERS.statistic}>
              <Card style={{ padding: "18px 20px", textAlign: "center", cursor: "help" }}>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 24, color: C.coral }}>
                  {testResult.statistic != null ? Number(testResult.statistic).toFixed(2) : "—"}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>
                  {testResult.statistic_name}
                </div>
              </Card>
            </HudTooltip>
            <HudTooltip {...METRIC_EXPLAINERS.p_value}>
              <Card style={{ padding: "18px 20px", textAlign: "center", cursor: "help" }}>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 24, color: pColor }}>
                  {testResult.p_value != null ? Number(testResult.p_value).toFixed(3) : "—"}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>p-value</div>
              </Card>
            </HudTooltip>
            <HudTooltip {...METRIC_EXPLAINERS.effect_size}>
              <Card style={{ padding: "18px 20px", textAlign: "center", cursor: "help" }}>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 24, color: C.purple }}>
                  {testResult.effect_size != null ? Number(testResult.effect_size).toFixed(2) : "—"}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>
                  {testResult.effect_size_name || "Effect size"}{esLabel && ` · ${esLabel}`}
                </div>
              </Card>
            </HudTooltip>
            <HudTooltip {...METRIC_EXPLAINERS.df}>
              <Card style={{ padding: "18px 20px", textAlign: "center", cursor: "help" }}>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 24, color: C.yellow }}>
                  {testResult.df || "—"}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>df</div>
              </Card>
            </HudTooltip>
          </div>

          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: C.coral, letterSpacing: "0.2em",
              }}>
                {">> APA_TRANSMISSION.LOG"}
              </div>
              <Btn
                color={C.teal}
                outline
                onClick={() => {
                  navigator.clipboard.writeText(writeup);
                  toast.success("Copied to clipboard");
                }}
                style={{ padding: "7px 14px", fontSize: 10 }}
              >
                <Copy size={12} /> Copy
              </Btn>
            </div>
            <pre style={{
              fontFamily: "'IBM Plex Mono', Menlo, monospace",
              fontSize: 13, color: C.ink, lineHeight: 1.7,
              background: C.cream, borderRadius: 0, padding: "14px 18px",
              border: `1px solid ${C.border}`,
              margin: 0, whiteSpace: "pre-wrap",
            }}>
              {writeup}
            </pre>
            {testResult.interpretation && (
              <div style={{
                fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: C.muted,
                marginTop: 12, borderLeft: `3px solid ${C.purple}`, paddingLeft: 12,
              }}>
                {testResult.interpretation}
              </div>
            )}
          </Card>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn color={C.navy} outline onClick={() => navigate("/assumptions")}>
          <ArrowLeft size={14} /> Back
        </Btn>
        <Btn onClick={() => navigate("/visualisation")} disabled={!testResult}>
          Visualise <ArrowRight size={14} />
        </Btn>
      </div>
    </div>
  );
}
