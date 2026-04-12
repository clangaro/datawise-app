import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ErrorBar, ReferenceLine, Legend,
} from "recharts";
import { Download, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, Btn, Pill, SectionTitle, C } from "../components/ui.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

const PALETTE = [C.coral, C.teal, C.purple, C.yellow, "#3BC0DB", "#F18F01"];

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
function sem(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance / arr.length);
}
function linearRegression(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return { slope: 0, intercept: 0 };
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

function downloadChartAsPng(container, filename = "datawise-chart.png") {
  const svg = container?.querySelector("svg");
  if (!svg) {
    toast.error("No chart to download");
    return;
  }
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const rect = svg.getBoundingClientRect();
  clone.setAttribute("width", rect.width);
  clone.setAttribute("height", rect.height);
  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFDF4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const dlUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(dlUrl);
      toast.success("Chart downloaded");
    }, "image/png");
  };
  img.onerror = () => toast.error("Download failed");
  img.src = url;
}

export default function Visualisation() {
  const navigate = useNavigate();
  const { profile, fileData, columnRoles, testResult } = useAnalysis();
  const chartRef = useRef(null);

  if (!fileData || !profile) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20, color: C.ink, marginBottom: 12 }}>
            Missing data.
          </div>
          <Btn onClick={() => navigate("/")}>← Home</Btn>
        </Card>
      </div>
    );
  }

  const rows = fileData.preview || [];
  const { dv: dvCol, iv: ivCol, group: groupCol } = columnRoles;
  const rqt = profile.research_question_type;

  const groupedData = useMemo(() => {
    if (!groupCol || !dvCol) return [];
    const groups = {};
    for (const row of rows) {
      const k = row[groupCol];
      if (k == null || k === "") continue;
      const v = Number(row[dvCol]);
      if (Number.isNaN(v)) continue;
      const key = String(k);
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    return Object.entries(groups).map(([name, values]) => {
      const m = mean(values);
      const s = sem(values);
      return { name, mean: Number(m.toFixed(2)), sem: Number(s.toFixed(2)), n: values.length, values };
    });
  }, [rows, groupCol, dvCol]);

  const scatterData = useMemo(() => {
    if (!ivCol || !dvCol) return [];
    return rows
      .map(r => ({ x: Number(r[ivCol]), y: Number(r[dvCol]) }))
      .filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y));
  }, [rows, ivCol, dvCol]);

  const regLine = useMemo(() => {
    if (!scatterData.length) return null;
    const xs = scatterData.map(p => p.x);
    const ys = scatterData.map(p => p.y);
    const { slope, intercept } = linearRegression(xs, ys);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];
  }, [scatterData]);

  const jitterScatter = useMemo(() => {
    if (!groupedData.length) return [];
    return groupedData.flatMap((g, gi) =>
      g.values.map(v => ({ xLabel: g.name, x: gi, y: v }))
    );
  }, [groupedData]);

  const isComparison = rqt === "comparison" && groupedData.length > 0;
  const isCorrelation = rqt === "correlation" && scatterData.length > 0;

  const chartTitle = isComparison
    ? `Group comparison · ${dvCol} by ${groupCol}`
    : isCorrelation
    ? `${dvCol} vs. ${ivCol}`
    : "Data overview";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <SectionTitle subtitle="Visual summary of your analysis">Visualisation</SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 16, color: C.ink }}>
              {chartTitle}
            </div>
            {testResult && (
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>
                {testResult.test_name}  ·  {testResult.statistic_name} = {Number(testResult.statistic).toFixed(2)}  ·  p {testResult.p_value < 0.001 ? "< .001" : `= ${Number(testResult.p_value).toFixed(3)}`}
              </div>
            )}
          </div>
          {testResult?.significant != null && (
            <Pill color={testResult.significant ? C.teal : C.muted}>
              {testResult.significant
                ? <><CheckCircle2 size={10} /> Significant</>
                : "Not significant"}
            </Pill>
          )}
        </div>

        <div ref={chartRef}>
          {isComparison && (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={groupedData} barCategoryGap="30%" margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 12, fill: C.muted }}
                  axisLine={false} tickLine={false}
                  label={{ value: groupCol, position: "insideBottom", offset: -5, fontFamily: "JetBrains Mono", fill: C.muted, fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 12, fill: C.muted }}
                  axisLine={false} tickLine={false}
                  label={{ value: dvCol, angle: -90, position: "insideLeft", fontFamily: "JetBrains Mono", fill: C.muted, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: C.border + "66" }}
                />
                <Bar dataKey="mean" radius={[8, 8, 0, 0]}>
                  {groupedData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  <ErrorBar dataKey="sem" width={6} strokeWidth={2} stroke={C.ink} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {isCorrelation && (
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis
                  type="number" dataKey="x" name={ivCol}
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: C.muted }}
                  axisLine={false} tickLine={false}
                  label={{ value: ivCol, position: "insideBottom", offset: -5, fontFamily: "JetBrains Mono", fill: C.muted, fontSize: 12 }}
                />
                <YAxis
                  type="number" dataKey="y" name={dvCol}
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: C.muted }}
                  axisLine={false} tickLine={false}
                  label={{ value: dvCol, angle: -90, position: "insideLeft", fontFamily: "JetBrains Mono", fill: C.muted, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <Scatter data={scatterData} fill={C.coral} fillOpacity={0.7} />
                {regLine && (
                  <Scatter
                    data={regLine}
                    line={{ stroke: C.purple, strokeWidth: 3 }}
                    lineType="joint"
                    shape={() => null}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {!isComparison && !isCorrelation && (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "Rajdhani, sans-serif", color: C.muted }}>
              No chart available for this analysis type.
            </div>
          )}
        </div>
      </Card>

      {isComparison && jitterScatter.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Raw data distribution
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                type="number" dataKey="x" domain={[-0.5, groupedData.length - 0.5]}
                ticks={groupedData.map((_, i) => i)}
                tickFormatter={(i) => groupedData[i]?.name ?? ""}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: C.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="number" dataKey="y"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: C.muted }}
                axisLine={false} tickLine={false}
              />
              <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, borderRadius: 10 }} cursor={{ strokeDasharray: "3 3" }} />
              {groupedData.map((g, gi) => (
                <Scatter
                  key={g.name}
                  name={g.name}
                  data={jitterScatter.filter(p => p.xLabel === g.name).map(p => ({ x: p.x + (Math.random() - 0.5) * 0.3, y: p.y }))}
                  fill={PALETTE[gi % PALETTE.length]}
                  fillOpacity={0.6}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn color={C.navy} outline onClick={() => navigate("/analysis")}>
          <ArrowLeft size={14} /> Back
        </Btn>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn color={C.teal} outline onClick={() => downloadChartAsPng(chartRef.current)}>
            <Download size={14} /> PNG
          </Btn>
          <Btn onClick={() => navigate("/report")}>
            Transmit Report <ArrowRight size={14} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
