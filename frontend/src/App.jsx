import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

/* ─── Design tokens ────────────────────────────────────────────────── */
const C = {
  coral:   "#FF5757",
  teal:    "#00C9B1",
  yellow:  "#FFD23F",
  purple:  "#B57BFF",
  navy:    "#0F0E1A",
  cream:   "#FFFDF4",
  ink:     "#1C1830",
  muted:   "#7B7896",
  card:    "#FFFFFF",
  border:  "#ECEAF5",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
`;

/* ─── Floating blob background ─────────────────────────────────────── */
function Blobs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      {[
        { color: C.coral,  x: "8%",  y: "12%", size: 340, delay: 0 },
        { color: C.teal,   x: "75%", y: "5%",  size: 280, delay: 2 },
        { color: C.yellow, x: "55%", y: "70%", size: 260, delay: 1 },
        { color: C.purple, x: "10%", y: "65%", size: 300, delay: 3 },
      ].map((b, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: b.x, top: b.y,
            width: b.size, height: b.size,
            borderRadius: "60% 40% 55% 45% / 45% 55% 40% 60%",
            background: b.color,
            opacity: 0.12,
            filter: "blur(60px)",
          }}
          animate={{
            borderRadius: [
              "60% 40% 55% 45% / 45% 55% 40% 60%",
              "40% 60% 45% 55% / 55% 45% 60% 40%",
              "60% 40% 55% 45% / 45% 55% 40% 60%",
            ],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 8 + b.delay, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

/* ─── Pill badge ───────────────────────────────────────────────────── */
function Pill({ color, children }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 99,
      background: color + "22",
      color,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "Outfit, sans-serif",
      letterSpacing: "0.03em",
    }}>
      {children}
    </span>
  );
}

/* ─── Step indicator ───────────────────────────────────────────────── */
const STEPS = ["Questionnaire", "Upload", "Assumptions", "Analysis", "Report"];

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "0 auto 40px", maxWidth: 600 }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <motion.div
                animate={{
                  background: done ? C.teal : active ? C.coral : C.border,
                  scale: active ? 1.15 : 1,
                }}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Syne, sans-serif", fontWeight: 700,
                  fontSize: 13, color: done || active ? "#fff" : C.muted,
                  boxShadow: active ? `0 0 0 4px ${C.coral}33` : "none",
                }}
              >
                {done ? "✓" : i + 1}
              </motion.div>
              <span style={{
                fontSize: 11, fontFamily: "Outfit, sans-serif",
                color: active ? C.ink : C.muted, marginTop: 4,
                fontWeight: active ? 600 : 400,
              }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                height: 2, flex: 1, marginBottom: 18,
                background: done ? C.teal : C.border,
                transition: "background 0.4s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card,
        borderRadius: 20,
        border: `1.5px solid ${C.border}`,
        padding: "32px 36px",
        boxShadow: "0 4px 40px rgba(15,14,26,0.07)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Primary button ───────────────────────────────────────────────── */
function Btn({ children, onClick, color = C.coral, outline = false, disabled = false, style = {} }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "12px 28px", borderRadius: 99, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.01em",
        border: outline ? `2px solid ${color}` : "none",
        background: outline ? "transparent" : (disabled ? C.border : color),
        color: outline ? color : (disabled ? C.muted : "#fff"),
        boxShadow: outline || disabled ? "none" : `0 6px 20px ${color}44`,
        transition: "background 0.2s",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Radio option card ────────────────────────────────────────────── */
function OptionCard({ label, desc, icon, selected, onClick, color = C.coral }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: "16px 20px", borderRadius: 14, cursor: "pointer",
        border: `2px solid ${selected ? color : C.border}`,
        background: selected ? color + "0f" : "#fff",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "border 0.2s, background 0.2s",
        boxShadow: selected ? `0 4px 20px ${color}22` : "none",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink }}>{label}</div>
        {desc && <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, color: C.muted, marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{
        marginLeft: "auto", width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${selected ? color : C.border}`,
        background: selected ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGES
═══════════════════════════════════════════════════════════════════ */

/* ─── Landing page ─────────────────────────────────────────────────── */

const demoBar = [
  { name: "A", v: 42 }, { name: "B", v: 67 }, { name: "C", v: 53 },
  { name: "D", v: 81 }, { name: "E", v: 38 },
];
const COLORS = [C.coral, C.teal, C.yellow, C.purple, C.coral];

function Landing({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        style={{ textAlign: "center", maxWidth: 680 }}>
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 64, display: "inline-block", marginBottom: 16 }}
        >
          🔬
        </motion.div>

        <h1 style={{
          fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(42px, 7vw, 76px)",
          lineHeight: 1.05, color: C.ink, margin: "0 0 16px",
        }}>
          Data<span style={{ color: C.coral }}>Wise</span>
        </h1>

        <p style={{
          fontFamily: "Outfit, sans-serif", fontSize: 19, color: C.muted,
          lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px",
        }}>
          The only analysis tool that asks <em>why</em> before it crunches.
          Guided statistical decisions. No more wrong tests.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={onStart}>Start Analysis →</Btn>
          <Btn color={C.navy} outline>View Docs</Btn>
        </div>
      </motion.div>

      {/* Mini chart preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ width: "100%", maxWidth: 480, marginTop: 56 }}
      >
        <Card style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>Group Comparison</div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, color: C.muted }}>One-way ANOVA  ·  F(4,45) = 6.2, p = .001</div>
            </div>
            <Pill color={C.teal}>✓ Significant</Pill>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={demoBar} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontFamily: "Outfit", fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontFamily: "Outfit", fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                cursor={{ fill: C.border + "66" }}
              />
              <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                {demoBar.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}
      >
        {[
          ["🎯", "Design-first", C.coral],
          ["✅", "Assumption-aware", C.teal],
          ["📐", "Effect sizes always", C.purple],
          ["📄", "APA-ready output", C.yellow],
          ["🔓", "Open source", C.ink],
        ].map(([icon, label, color]) => (
          <motion.div key={label} whileHover={{ y: -2 }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 99,
            background: "#fff", border: `1.5px solid ${C.border}`,
            fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.ink, fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <span style={{ color }}>{icon}</span> {label}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Questionnaire ─────────────────────────────────────────────────── */

const Q_STEPS = [
  {
    key: "rq_type",
    title: "What's your research question?",
    subtitle: "This determines the whole analysis pathway.",
    options: [
      { value: "comparison",  label: "Comparison",  icon: "⚖️",  desc: "Are groups different on some outcome?" },
      { value: "correlation", label: "Correlation", icon: "🔗",  desc: "Are two variables related?" },
      { value: "prediction",  label: "Prediction",  icon: "🎯",  desc: "Can I predict one variable from others?" },
      { value: "description", label: "Description", icon: "📊",  desc: "Summarise and describe my data only" },
    ],
    colors: [C.coral, C.teal, C.purple, C.yellow],
  },
  {
    key: "measurement",
    title: "Outcome variable type?",
    subtitle: "The measurement level of your dependent variable.",
    options: [
      { value: "interval_ratio", label: "Continuous",    icon: "📏", desc: "Height, reaction time, test score, biomarkers" },
      { value: "ordinal",        label: "Ordinal",       icon: "🏅", desc: "Likert scales, ranked severity" },
      { value: "nominal",        label: "Categorical",   icon: "🏷️", desc: "Yes/No, species, treatment group" },
    ],
    colors: [C.teal, C.purple, C.coral],
  },
  {
    key: "design",
    title: "Study design?",
    subtitle: "How were participants assigned to conditions?",
    options: [
      { value: "independent", label: "Independent groups", icon: "👥", desc: "Different people in each condition" },
      { value: "paired",      label: "Repeated / paired",  icon: "🔄", desc: "Same people across conditions or time" },
      { value: "mixed",       label: "Mixed",              icon: "🔀", desc: "Both between and within factors" },
    ],
    colors: [C.coral, C.yellow, C.purple],
  },
  {
    key: "n_groups",
    title: "How many groups?",
    subtitle: "Number of conditions or groups being compared.",
    options: [
      { value: 2, label: "2 groups",  icon: "2️⃣", desc: "e.g. treatment vs. control" },
      { value: 3, label: "3 groups",  icon: "3️⃣", desc: "" },
      { value: 4, label: "4+ groups", icon: "4️⃣", desc: "" },
    ],
    colors: [C.teal, C.coral, C.purple],
    skip: (answers) => answers.rq_type !== "comparison",
  },
];

const RECOMMENDATION = {
  title: "Independent samples t-test",
  icon: "📊",
  rationale: "Two independent groups, continuous outcome → Student's t-test. Normality and equal variances will be checked formally before running.",
  assumptions: ["Normality (Shapiro-Wilk)", "Homogeneity of variance (Levene's)", "Independence (Wald-Wolfowitz runs)"],
  alternatives: ["Welch's t-test (unequal variances)", "Mann-Whitney U (non-parametric)"],
};

function Questionnaire({ onNext }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const visibleSteps = Q_STEPS.filter(s => !s.skip || !s.skip(answers));
  const current = visibleSteps[step];
  const total = visibleSteps.length;
  const selected = answers[current?.key];
  const progress = ((step) / total) * 100;

  const handleSelect = (val) => setAnswers(a => ({ ...a, [current.key]: val }));

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1);
    else setDone(true);
  };

  if (done) return (
    <AnimatePresence mode="wait">
      <motion.div key="rec" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: C.ink, margin: 0 }}>Your recommended test</h2>
          <p style={{ fontFamily: "Outfit, sans-serif", color: C.muted, marginTop: 8 }}>Based on your design profile</p>
        </div>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.coral + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              {RECOMMENDATION.icon}
            </div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: C.ink }}>{RECOMMENDATION.title}</div>
              <Pill color={C.coral}>Primary recommendation</Pill>
            </div>
          </div>
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, borderLeft: `3px solid ${C.coral}`, paddingLeft: 14, margin: "0 0 24px" }}>
            {RECOMMENDATION.rationale}
          </p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Assumptions to check</div>
            {RECOMMENDATION.assumptions.map(a => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.yellow, fontSize: 16 }}>⚡</span> {a}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Alternatives if assumptions fail</div>
            {RECOMMENDATION.alternatives.map(a => (
              <div key={a} style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.muted, padding: "4px 0" }}>· {a}</div>
            ))}
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Btn onClick={onNext}>Upload Data →</Btn>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.muted }}>Question {step + 1} of {total}</span>
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.coral, fontWeight: 600 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
          <motion.div animate={{ width: `${progress}%` }} style={{ height: "100%", background: `linear-gradient(90deg, ${C.coral}, ${C.purple})`, borderRadius: 99 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <Card>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: C.ink, margin: "0 0 6px" }}>{current.title}</h2>
            <p style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, color: C.muted, margin: "0 0 24px" }}>{current.subtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((opt, i) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  desc={opt.desc}
                  icon={opt.icon}
                  selected={selected === opt.value}
                  onClick={() => handleSelect(opt.value)}
                  color={current.colors[i]}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Btn color={C.navy} outline onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</Btn>
        <Btn onClick={handleNext} disabled={selected === undefined}>
          {step < total - 1 ? "Next →" : "Get Recommendation →"}
        </Btn>
      </div>
    </div>
  );
}

/* ─── Results page (demo) ──────────────────────────────────────────── */

const scatterData = Array.from({ length: 30 }, (_, i) => ({
  x: 20 + Math.random() * 60,
  y: 30 + Math.random() * 50 + (i % 2 === 0 ? 10 : 0),
  group: i % 2 === 0 ? "Control" : "Treatment",
}));

function Results({ onRestart }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Result banner */}
        <Card style={{ background: `linear-gradient(135deg, ${C.teal}15, ${C.teal}05)`, borderColor: C.teal + "44", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: C.teal + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>✅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: C.ink }}>Significant difference found</div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, color: C.muted, marginTop: 4 }}>Independent samples t-test  ·  α = 0.05</div>
            </div>
            <Pill color={C.teal}>p = 0.0031</Pill>
          </div>
        </Card>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "t statistic", value: "3.42", color: C.coral },
            { label: "p-value", value: "0.003", color: C.teal },
            { label: "Cohen's d", value: "0.78", color: C.purple },
            { label: "Effect size", value: "Medium", color: C.yellow },
          ].map(s => (
            <Card key={s.label} style={{ padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 4 }}>Distribution comparison</div>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, color: C.muted, marginBottom: 20 }}>Treatment vs. Control group scores</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" name="Score" tick={{ fontFamily: "Outfit", fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name="Outcome" tick={{ fontFamily: "Outfit", fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Outfit", fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData.filter(d => d.group === "Control")} fill={C.coral} fillOpacity={0.7} name="Control" />
              <Scatter data={scatterData.filter(d => d.group === "Treatment")} fill={C.teal} fillOpacity={0.7} name="Treatment" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* APA write-up */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>APA-style write-up</div>
          <div style={{
            fontFamily: "Outfit, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.8,
            background: C.cream, borderRadius: 10, padding: "14px 18px", border: `1px solid ${C.border}`,
          }}>
            An independent samples t-test was conducted to compare scores between the treatment and control groups. The results indicated a statistically significant difference between groups, <em>t</em>(58) = 3.42, <em>p</em> = .003, <em>d</em> = 0.78.
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn color={C.purple}>⬇ Download Report</Btn>
          <Btn color={C.navy} outline onClick={onRestart}>Start Over</Btn>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════════════════════ */

const PAGE = { LANDING: 0, QUESTIONNAIRE: 1, RESULTS: 2 };

export default function App() {
  const [page, setPage] = useState(PAGE.LANDING);
  const [appStep, setAppStep] = useState(1);

  return (
    <>
      <style>{fonts}</style>
      <div style={{ minHeight: "100vh", background: C.cream, position: "relative", overflowX: "hidden" }}>
        <Blobs />

        {/* Nav */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(16px)", background: C.cream + "cc",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div
            style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: C.ink, cursor: "pointer" }}
            onClick={() => { setPage(PAGE.LANDING); setAppStep(1); }}
          >
            🔬 Data<span style={{ color: C.coral }}>Wise</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {page === PAGE.LANDING && <Btn onClick={() => setPage(PAGE.QUESTIONNAIRE)}>Start →</Btn>}
            {page !== PAGE.LANDING && (
              <Btn color={C.navy} outline onClick={() => { setPage(PAGE.LANDING); setAppStep(1); }}>← Home</Btn>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main style={{ position: "relative", zIndex: 1, padding: "40px 24px 80px" }}>
          <AnimatePresence mode="wait">
            {page === PAGE.LANDING && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Landing onStart={() => setPage(PAGE.QUESTIONNAIRE)} />
              </motion.div>
            )}

            {page === PAGE.QUESTIONNAIRE && appStep === 1 && (
              <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepBar current={0} />
                <Questionnaire onNext={() => setAppStep(2)} />
              </motion.div>
            )}

            {page === PAGE.QUESTIONNAIRE && appStep === 2 && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepBar current={4} />
                <Results onRestart={() => { setPage(PAGE.LANDING); setAppStep(1); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
