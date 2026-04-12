import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Download, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, RefreshCw,
} from "lucide-react";
import { Card, Btn, Pill, SectionTitle, C } from "../components/ui.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

function download(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMarkdown({ profile, recommendation, fileData, columnRoles, assumptionResults, testResult, alpha }) {
  const lines = [];
  lines.push("# D.A.R.V.I.S. Analysis Report");
  lines.push("");
  lines.push(`_Generated ${new Date().toISOString().slice(0, 10)}_`);
  lines.push("");

  lines.push("## Research Question");
  lines.push("");
  lines.push(`- **Type:** ${profile?.research_question_type}`);
  lines.push(`- **Measurement level:** ${profile?.measurement_level}`);
  lines.push(`- **Design:** ${profile?.design}`);
  if (profile?.research_question_type === "comparison") {
    lines.push(`- **Number of groups:** ${profile?.n_groups}`);
  }
  lines.push(`- **Sample size:** ${profile?.sample_size}`);
  lines.push(`- **Alpha:** ${alpha}`);
  lines.push("");

  if (fileData) {
    lines.push("## Dataset");
    lines.push("");
    lines.push(`- **File:** ${fileData.filename}`);
    lines.push(`- **Rows × cols:** ${fileData.n_rows} × ${fileData.n_cols}`);
    if (columnRoles.dv)    lines.push(`- **DV:** ${columnRoles.dv}`);
    if (columnRoles.iv)    lines.push(`- **IV:** ${columnRoles.iv}`);
    if (columnRoles.group) lines.push(`- **Grouping variable:** ${columnRoles.group}`);
    if (columnRoles.covariates?.length) lines.push(`- **Covariates:** ${columnRoles.covariates.join(", ")}`);
    lines.push("");
  }

  if (recommendation) {
    lines.push("## Recommended Test");
    lines.push("");
    lines.push(`**${recommendation.primary.name}**`);
    lines.push("");
    lines.push(recommendation.primary.description);
    lines.push("");
    lines.push(`_Rationale:_ ${recommendation.rationale}`);
    lines.push("");
  }

  if (assumptionResults?.length) {
    lines.push("## Assumption Checks");
    lines.push("");
    lines.push("| Assumption | Status | Statistic | p-value | Interpretation |");
    lines.push("|---|---|---|---|---|");
    for (const r of assumptionResults) {
      const status = r.passed === false ? "FAIL" : r.severity === "warning" ? "WARNING" : "PASS";
      lines.push(`| ${r.name} | ${status} | ${r.statistic != null ? Number(r.statistic).toFixed(4) : "—"} | ${r.p_value != null ? Number(r.p_value).toFixed(4) : "—"} | ${(r.interpretation || "").replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
  }

  if (testResult) {
    lines.push("## Statistical Results");
    lines.push("");
    lines.push(`- **Test:** ${testResult.test_name}`);
    lines.push(`- **${testResult.statistic_name}:** ${Number(testResult.statistic).toFixed(4)}`);
    lines.push(`- **p-value:** ${Number(testResult.p_value).toFixed(4)}`);
    if (testResult.df) lines.push(`- **df:** ${testResult.df}`);
    if (testResult.effect_size != null) {
      lines.push(`- **${testResult.effect_size_name || "Effect size"}:** ${Number(testResult.effect_size).toFixed(4)}`);
    }
    lines.push(`- **Significant at α=${alpha}:** ${testResult.significant ? "Yes" : "No"}`);
    lines.push("");

    lines.push("### APA Write-Up");
    lines.push("");
    const pStr = testResult.p_value < 0.001 ? "< .001" : `= ${Number(testResult.p_value).toFixed(3)}`;
    const dfStr = testResult.df ? `(${testResult.df})` : "";
    const esStr = testResult.effect_size != null
      ? `, ${testResult.effect_size_name || "effect size"} = ${Number(testResult.effect_size).toFixed(2)}`
      : "";
    lines.push(`> A ${testResult.test_name} was conducted. The results indicated that the difference was ${testResult.significant ? "statistically significant" : "not statistically significant"}, ${testResult.statistic_name}${dfStr} = ${Number(testResult.statistic).toFixed(2)}, p ${pStr}${esStr}.`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("_Transmitted by **D.A.R.V.I.S.** — Data Analysis, Reasoning & Visualization Intelligence System._");
  return lines.join("\n");
}

function buildCsv({ testResult, assumptionResults }) {
  const rows = [["section", "metric", "value"]];
  if (testResult) {
    rows.push(["result", "test_name",       testResult.test_name]);
    rows.push(["result", "statistic_name",  testResult.statistic_name]);
    rows.push(["result", "statistic",       testResult.statistic]);
    rows.push(["result", "p_value",         testResult.p_value]);
    rows.push(["result", "df",              testResult.df ?? ""]);
    rows.push(["result", "effect_size_name", testResult.effect_size_name ?? ""]);
    rows.push(["result", "effect_size",     testResult.effect_size ?? ""]);
    rows.push(["result", "significant",     testResult.significant]);
    rows.push(["result", "alpha",           testResult.alpha]);
  }
  for (const r of assumptionResults || []) {
    rows.push(["assumption", `${r.name}:passed`,    r.passed]);
    rows.push(["assumption", `${r.name}:statistic`, r.statistic ?? ""]);
    rows.push(["assumption", `${r.name}:p_value`,   r.p_value ?? ""]);
  }
  return rows
    .map(row => row.map(v => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");
}

export default function Report() {
  const navigate = useNavigate();
  const state = useAnalysis();
  const { profile, recommendation, fileData, columnRoles, assumptionResults, testResult, alpha, reset } = state;

  const markdown = useMemo(() => buildMarkdown(state), [state]);

  if (!profile) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20, color: C.ink, marginBottom: 12 }}>
            Nothing to report — start an analysis first.
          </div>
          <Btn onClick={() => navigate("/questionnaire")}>Start analysis</Btn>
        </Card>
      </div>
    );
  }

  const handleReset = () => {
    reset();
    navigate("/");
    toast.success("Session cleared");
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <SectionTitle subtitle="Your full analysis, ready to share">Report</SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Research Question
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill color={C.coral}>{profile.research_question_type}</Pill>
          <Pill color={C.teal}>{profile.measurement_level}</Pill>
          <Pill color={C.purple}>{profile.design}</Pill>
          {profile.research_question_type === "comparison" && <Pill color={C.yellow}>{profile.n_groups} groups</Pill>}
          <Pill color={C.ink}>n = {profile.sample_size}</Pill>
          <Pill color={C.muted}>α = {alpha}</Pill>
        </div>
      </Card>

      {fileData && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Dataset
          </div>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.8 }}>
            <div><strong>File:</strong> {fileData.filename}</div>
            <div><strong>Shape:</strong> {fileData.n_rows} × {fileData.n_cols}</div>
            {columnRoles.dv && <div><strong>DV:</strong> {columnRoles.dv}</div>}
            {columnRoles.iv && <div><strong>IV:</strong> {columnRoles.iv}</div>}
            {columnRoles.group && <div><strong>Grouping:</strong> {columnRoles.group}</div>}
            {columnRoles.covariates?.length > 0 && <div><strong>Covariates:</strong> {columnRoles.covariates.join(", ")}</div>}
          </div>
        </Card>
      )}

      {recommendation && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Recommended test
          </div>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 18, color: C.ink }}>
            {recommendation.primary.name}
          </div>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
            {recommendation.rationale}
          </div>
        </Card>
      )}

      {assumptionResults?.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Assumption checks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assumptionResults.map((r, i) => {
              const pass = r.passed === false ? "fail" : r.severity === "warning" ? "warn" : "pass";
              const pillColor = pass === "fail" ? C.red : pass === "warn" ? C.yellow : C.teal;
              const Icon = pass === "fail" ? XCircle : pass === "warn" ? AlertTriangle : CheckCircle2;
              const label = pass === "fail" ? "Fail" : pass === "warn" ? "Warning" : "Pass";
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 16px",
                  border: `1px solid ${pillColor}44`,
                  background: `${C.panel}aa`,
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}>
                  <div>
                    <div style={{
                      fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 12,
                      color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>{r.name}</div>
                    <div style={{
                      fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 2,
                    }}>{r.interpretation}</div>
                  </div>
                  <Pill color={pillColor}><Icon size={10} /> {label}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {testResult && (
        <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${(testResult.significant ? C.teal : C.muted)}10, transparent)` }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Results
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            <div>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 22, color: C.coral }}>
                {Number(testResult.statistic).toFixed(2)}
              </div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted }}>{testResult.statistic_name}</div>
            </div>
            <div>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 22, color: testResult.significant ? C.teal : C.muted }}>
                {testResult.p_value < 0.001 ? "< .001" : Number(testResult.p_value).toFixed(3)}
              </div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted }}>p-value</div>
            </div>
            {testResult.effect_size != null && (
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 22, color: C.purple }}>
                  {Number(testResult.effect_size).toFixed(2)}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted }}>{testResult.effect_size_name}</div>
              </div>
            )}
            {testResult.df && (
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 22, color: C.yellow }}>{testResult.df}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted }}>df</div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Markdown preview
        </div>
        <pre style={{
          fontFamily: "'IBM Plex Mono', Menlo, monospace",
          fontSize: 12, color: C.ink, lineHeight: 1.6,
          background: C.cream, borderRadius: 10, padding: "14px 18px",
          border: `1px solid ${C.border}`, overflow: "auto", maxHeight: 300, margin: 0,
          whiteSpace: "pre-wrap",
        }}>
          {markdown}
        </pre>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Btn color={C.navy} outline onClick={() => navigate("/visualisation")}>
          <ArrowLeft size={14} /> Back
        </Btn>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn color={C.teal} outline onClick={() => download("datawise-report.md", markdown, "text/markdown")}>
            <Download size={14} /> Markdown
          </Btn>
          <Btn color={C.purple} outline onClick={() => download("datawise-results.csv", buildCsv(state), "text/csv")}>
            <Download size={14} /> CSV
          </Btn>
          <Btn color={C.coral} onClick={handleReset}>
            <RefreshCw size={14} /> New Mission
          </Btn>
        </div>
      </div>
    </div>
  );
}
