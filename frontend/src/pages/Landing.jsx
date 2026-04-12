import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion, useScroll, useTransform, useMotionValueEvent, useMotionValue,
} from "framer-motion";
import {
  Play, ArrowRight, ChevronDown, Activity, Upload as UploadIcon,
  ShieldCheck, Cpu, Radio, Target, CheckCircle2, FileText,
} from "lucide-react";
import { Btn, Pill, ArcReactor, HexGrid, C } from "../components/ui.jsx";
import DecisionTreeViz from "../components/DecisionTreeViz.jsx";

/* ═══════════════════════════════════════════════════════════════════
   HERO SECTION — drifting background, huge title, scroll hint
   ═══════════════════════════════════════════════════════════════════ */

function HeroSection({ onStart }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY   = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const titleO   = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const reactorY = useTransform(scrollYProgress, [0, 1], [0, 260]);
  const reactorS = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const reactorO = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const gridY    = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const hintO    = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section ref={ref} style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      {/* drifting reactor */}
      <motion.div
        style={{
          position: "absolute", top: "48%", left: "50%",
          translateX: "-50%", translateY: "-50%",
          y: reactorY, scale: reactorS, opacity: reactorO,
          pointerEvents: "none",
        }}
      >
        <ArcReactor size={880} />
      </motion.div>

      {/* drifting hex grid */}
      <motion.div style={{
        position: "absolute", inset: "-10% 0 -10% 0",
        y: gridY, pointerEvents: "none",
      }}>
        <motion.div
          animate={{ x: [0, -56, 0], y: [0, -64, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <HexGrid opacity={0.06} />
        </motion.div>
      </motion.div>

      {/* content */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          y: titleY, opacity: titleO,
        }}
      >
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 0.8, letterSpacing: "0.35em" }}
          transition={{ duration: 1.5 }}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11, color: C.coral, marginBottom: 22,
          }}
        >
          {"// MK-II · STARK INDUSTRIES"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(54px, 11vw, 160px)",
            lineHeight: 0.9,
            color: C.ink, margin: 0,
            letterSpacing: "0.14em",
            textShadow: `0 0 50px ${C.coral}99, 0 0 100px ${C.coral}44`,
          }}
        >
          D.A.<span style={{ color: C.coral }}>R.V.</span>I.S.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 340 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{
            height: 1, marginTop: 16,
            background: `linear-gradient(90deg, transparent, ${C.coral}, transparent)`,
            boxShadow: `0 0 12px ${C.coral}`,
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(15px, 1.5vw, 19px)",
            color: C.ink + "cc",
            maxWidth: 720, textAlign: "center",
            marginTop: 22, marginBottom: 0,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            lineHeight: 1.6,
          }}
        >
          Data Analysis · Reasoning · Visualization <br/>Intelligence System
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.3 }}
          style={{ marginTop: 40, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Btn onClick={onStart}>
            <Play size={14} strokeWidth={2.5} /> Initiate Protocol
          </Btn>
          <Btn color={C.navy} outline onClick={() => window.open("http://localhost:8000/docs", "_blank")}>
            <ArrowRight size={14} /> System Docs
          </Btn>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        style={{
          position: "absolute", bottom: 36, left: "50%", translateX: "-50%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          opacity: hintO, pointerEvents: "none",
        }}
      >
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 9,
          letterSpacing: "0.3em", color: C.muted,
        }}>
          SCROLL TO ENGAGE
        </div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} color={C.coral} />
        </motion.div>
      </motion.div>

      {/* edge tick marks */}
      <div style={{ position: "absolute", top: 20, left: 30, right: 30, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
        {["00:00:00", "SEC 01", "NORTH 48°", "V 0.1.0"].map(s => (
          <span key={s} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>{s}</span>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PARALLAX PIPELINE SECTION — generic wrapper
   ═══════════════════════════════════════════════════════════════════ */

function ParallaxSection({ index, total, tag, title, description, IconCmp, accent, renderScene }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const contentY  = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -60]);
  const leftX     = useTransform(scrollYProgress, [0, 0.5, 1], [-40, 0, 20]);
  const rightX    = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -30]);
  const numScale  = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1.05]);

  return (
    <section ref={ref} style={{ position: "relative", height: "220vh" }}>
      <motion.div
        style={{
          position: "sticky", top: 0, height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity, padding: "0 48px",
        }}
      >
        {/* giant background step number */}
        <motion.div
          style={{
            position: "absolute", top: "50%", left: "50%",
            translateX: "-50%", translateY: "-50%",
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(280px, 42vw, 600px)",
            color: accent + "08",
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            pointerEvents: "none",
            userSelect: "none",
            scale: numScale,
          }}
        >
          0{index}
        </motion.div>

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1200, width: "100%",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 72, alignItems: "center",
        }}>
          {/* Left: text column */}
          <motion.div style={{ y: contentY, x: leftX }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "6px 14px",
              border: `1px solid ${accent}66`,
              background: `${accent}12`,
              clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10, color: accent, letterSpacing: "0.2em",
              marginBottom: 22,
            }}>
              <IconCmp size={12} /> PHASE {index} / {total}
            </div>

            <h2 style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(34px, 4.4vw, 60px)",
              fontWeight: 800, lineHeight: 1.05,
              color: C.ink, margin: "0 0 20px",
              textTransform: "uppercase", letterSpacing: "0.04em",
              textShadow: `0 0 30px ${accent}44`,
            }}>
              {tag}
            </h2>

            <div style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: 14, fontWeight: 600,
              color: accent, marginBottom: 18,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {title}
            </div>

            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 17, color: C.ink + "bb",
              lineHeight: 1.7, margin: 0,
              letterSpacing: "0.01em",
              maxWidth: 500,
            }}>
              {description}
            </p>

            <div style={{ marginTop: 26, display: "flex", gap: 10 }}>
              <div style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9, color: C.muted, letterSpacing: "0.18em",
              }}>
                {`>> SUBSYS_${String(index).padStart(3, "0")}.OPERATIONAL`}
              </div>
            </div>
          </motion.div>

          {/* Right: scene */}
          <motion.div style={{ y: contentY, x: rightX, display: "flex", justifyContent: "center" }}>
            {renderScene(scrollYProgress)}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE 01 — Decision tree forming
   ═══════════════════════════════════════════════════════════════════ */

const TREE_STEPS = [
  { key: "q1", label: "Question type" },
  { key: "q2", label: "Signal type" },
  { key: "q3", label: "Protocol" },
  { key: "q4", label: "Group count" },
  { key: "q5", label: "Sample size" },
];
const DEMO_VALUES = {
  q1: "COMPARISON",
  q2: "CONTINUOUS",
  q3: "INDEPENDENT",
  q4: "2 GROUPS",
  q5: "N = 60",
};

function SceneQuery({ progress }) {
  const [filled, setFilled] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const f = Math.floor(p * 6);
    setFilled(Math.max(0, Math.min(f, TREE_STEPS.length)));
  });
  const values = Object.fromEntries(
    Object.entries(DEMO_VALUES).slice(0, filled)
  );
  const activeIndex = Math.min(filled, TREE_STEPS.length - 1);

  return (
    <div style={{ width: 380 }}>
      <DecisionTreeViz
        steps={TREE_STEPS}
        values={values}
        activeIndex={activeIndex}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE 02 — Data ingest: streaming rows + column histogram
   ═══════════════════════════════════════════════════════════════════ */

function SceneIngest({ progress }) {
  const [rows, setRows] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    setRows(Math.min(12, Math.floor(p * 14)));
  });

  const cols = [
    { name: "group",    v: 0.55 },
    { name: "age",      v: 0.82 },
    { name: "score",    v: 0.66 },
    { name: "response", v: 0.91 },
    { name: "latency",  v: 0.44 },
  ];

  return (
    <div style={{
      position: "relative", width: 420,
      padding: "22px 24px",
      background: `linear-gradient(180deg, ${C.panel}cc, ${C.deep}cc)`,
      border: `1px solid ${C.border}`,
      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      boxShadow: `inset 0 0 0 1px ${C.teal}12, 0 0 40px ${C.teal}10`,
    }}>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.teal, letterSpacing: "0.22em",
        marginBottom: 14, display: "flex", justifyContent: "space-between",
      }}>
        <span>{">> DATA_INGEST.LIVE"}</span>
        <span>{rows.toString().padStart(4, "0")}/0100 ROWS</span>
      </div>

      {/* column histogram */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110, marginBottom: 20 }}>
        {cols.map((c, i) => (
          <div key={c.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: c.v }}
              viewport={{ once: false, margin: "-30%" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              style={{
                width: "100%",
                height: 100,
                background: `linear-gradient(180deg, ${C.teal}, ${C.coral})`,
                transformOrigin: "bottom",
                boxShadow: `0 0 14px ${C.teal}55`,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              }}
            />
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {c.name}
            </div>
          </div>
        ))}
      </div>

      {/* streaming rows */}
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.ink, lineHeight: 1.7,
        background: `${C.deep}cc`,
        padding: "10px 12px",
        border: `1px dashed ${C.border}`,
        height: 136, overflow: "hidden",
      }}>
        {Array.from({ length: rows }).map((_, i) => {
          const grp = ["A", "B"][i % 2];
          const age = 20 + ((i * 7) % 40);
          const score = (40 + ((i * 11) % 50)).toFixed(1);
          const resp = ["PASS", "PASS", "FAIL"][(i * 3) % 3];
          const lat = (100 + ((i * 17) % 300)).toFixed(0);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                color: i === rows - 1 ? C.teal : C.muted,
                letterSpacing: "0.06em",
              }}
            >
              {`> ${String(i + 1).padStart(3, "0")}  ${grp}  ${age}  ${score}  ${resp}  ${lat}ms`}
            </motion.div>
          );
        })}
        {rows < 12 && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ color: C.coral }}
          >
            ▊
          </motion.span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE 03 — Diagnostic radar sweep
   ═══════════════════════════════════════════════════════════════════ */

function SceneDiagnostics({ progress }) {
  const [checks, setChecks] = useState([false, false, false, false]);
  useMotionValueEvent(progress, "change", (p) => {
    setChecks([
      p > 0.2, p > 0.35, p > 0.5, p > 0.65,
    ]);
  });

  const items = [
    { label: "Normality",    status: checks[0], color: C.teal },
    { label: "Variance",     status: checks[1], color: C.teal },
    { label: "Independence", status: checks[2], color: C.yellow },
    { label: "Outliers",     status: checks[3], color: C.teal },
  ];

  return (
    <div style={{
      position: "relative", width: 420,
      padding: "22px 24px",
      background: `linear-gradient(180deg, ${C.panel}cc, ${C.deep}cc)`,
      border: `1px solid ${C.border}`,
      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      boxShadow: `inset 0 0 0 1px ${C.yellow}12, 0 0 40px ${C.yellow}10`,
    }}>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.yellow, letterSpacing: "0.22em",
        marginBottom: 14, display: "flex", justifyContent: "space-between",
      }}>
        <span>{">> DIAGNOSTIC_SWEEP.LIVE"}</span>
        <span>{checks.filter(Boolean).length}/4 PASSED</span>
      </div>

      {/* radar */}
      <div style={{ position: "relative", width: "100%", height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={240} height={240} viewBox="0 0 240 240" style={{ position: "absolute" }}>
          {[100, 75, 50, 25].map((r, i) => (
            <circle key={i} cx={120} cy={120} r={r} fill="none" stroke={C.coral} strokeWidth={0.6} opacity={0.2 + i * 0.1} />
          ))}
          {[0, 45, 90, 135].map(deg => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={120 + Math.cos(rad) * 100} y1={120 + Math.sin(rad) * 100}
                x2={120 - Math.cos(rad) * 100} y2={120 - Math.sin(rad) * 100}
                stroke={C.coral} strokeWidth={0.4} opacity={0.3}
              />
            );
          })}
          {/* rotating sweep arm */}
          <motion.line
            x1={120} y1={120} x2={120} y2={20}
            stroke={C.coral} strokeWidth={1.2}
            style={{ transformOrigin: "120px 120px", filter: `drop-shadow(0 0 6px ${C.coral})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          {/* sweep afterglow arc */}
          <motion.path
            d="M 120 120 L 120 20 A 100 100 0 0 1 190 50 Z"
            fill={`url(#sweepFade)`}
            style={{ transformOrigin: "120px 120px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <defs>
            <radialGradient id="sweepFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={C.coral} stopOpacity={0.3} />
              <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* target blips */}
          {items.map((it, i) => {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const r = 60 + i * 10;
            const x = 120 + Math.cos(angle) * r;
            const y = 120 + Math.sin(angle) * r;
            return (
              <g key={it.label}>
                <motion.circle
                  cx={x} cy={y} r={5}
                  fill={it.status ? it.color : C.border}
                  animate={it.status ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ filter: it.status ? `drop-shadow(0 0 6px ${it.color})` : "none" }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {items.map(it => (
          <div key={it.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px",
            border: `1px solid ${it.status ? it.color + "66" : C.border}`,
            background: it.status ? `${it.color}0e` : "transparent",
            clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9, letterSpacing: "0.14em",
          }}>
            <CheckCircle2 size={10} color={it.status ? it.color : C.border} />
            <span style={{ color: it.status ? C.ink : C.muted }}>{it.label.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE 04 — Compute / arc reactor with stats
   ═══════════════════════════════════════════════════════════════════ */

function SceneCompute({ progress }) {
  const [vals, setVals] = useState({ t: 0, p: 1, d: 0 });
  useMotionValueEvent(progress, "change", (p) => {
    const easeP = Math.min(1, Math.max(0, (p - 0.1) / 0.7));
    setVals({
      t: +(3.42 * easeP).toFixed(2),
      p: Math.max(0.003, 1 - easeP * 0.997),
      d: +(0.78 * easeP).toFixed(2),
    });
  });

  return (
    <div style={{
      position: "relative", width: 420, padding: "22px 24px",
      background: `linear-gradient(180deg, ${C.panel}cc, ${C.deep}cc)`,
      border: `1px solid ${C.border}`,
      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      boxShadow: `inset 0 0 0 1px ${C.purple}12, 0 0 40px ${C.purple}10`,
    }}>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.purple, letterSpacing: "0.22em",
        marginBottom: 16, display: "flex", justifyContent: "space-between",
      }}>
        <span>{">> COMPUTE_CORE.LIVE"}</span>
        <span>T-TEST · α=0.05</span>
      </div>

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArcReactor size={240} />
        </div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: 42, fontWeight: 800, color: C.ink,
            textShadow: `0 0 20px ${C.coral}`,
            letterSpacing: "0.04em",
          }}>
            {vals.t.toFixed(2)}
          </div>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            color: C.muted, letterSpacing: "0.2em", marginTop: 4,
          }}>
            T-STATISTIC
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <div style={{
          padding: "12px 14px",
          border: `1px solid ${C.teal}44`,
          background: `${C.teal}08`,
          clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        }}>
          <div style={{
            fontFamily: "Orbitron, sans-serif", fontSize: 22, fontWeight: 800,
            color: C.teal, textShadow: `0 0 12px ${C.teal}66`,
          }}>
            {vals.p < 0.01 ? "< .01" : vals.p.toFixed(3)}
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: C.muted, letterSpacing: "0.16em" }}>
            P-VALUE
          </div>
        </div>
        <div style={{
          padding: "12px 14px",
          border: `1px solid ${C.purple}44`,
          background: `${C.purple}08`,
          clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        }}>
          <div style={{
            fontFamily: "Orbitron, sans-serif", fontSize: 22, fontWeight: 800,
            color: C.purple, textShadow: `0 0 12px ${C.purple}66`,
          }}>
            {vals.d.toFixed(2)}
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: C.muted, letterSpacing: "0.16em" }}>
            COHEN'S D
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE 05 — Transmission (report typing)
   ═══════════════════════════════════════════════════════════════════ */

const TRANSMISSION = [
  "// APA_TRANSMISSION.LOG",
  "",
  "An independent samples t-test was",
  "conducted to compare scores between",
  "the treatment and control groups.",
  "",
  "Results indicated a statistically",
  "significant difference between groups,",
  "t(58) = 3.42, p = .003, d = 0.78.",
  "",
  ">> ENCODING REPORT.MD",
  ">> ENCODING RESULTS.CSV",
  ">> TRANSMISSION COMPLETE",
];

function SceneTransmit({ progress }) {
  const [lineCount, setLineCount] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    setLineCount(Math.min(TRANSMISSION.length, Math.floor(p * TRANSMISSION.length + 1)));
  });

  return (
    <div style={{
      position: "relative", width: 420, padding: "22px 24px",
      background: `linear-gradient(180deg, ${C.panel}cc, ${C.deep}cc)`,
      border: `1px solid ${C.border}`,
      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      boxShadow: `inset 0 0 0 1px ${C.coral}12, 0 0 40px ${C.coral}10`,
    }}>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.coral, letterSpacing: "0.22em",
        marginBottom: 14, display: "flex", justifyContent: "space-between",
      }}>
        <span>{">> TRANSMISSION.LIVE"}</span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ color: C.teal }}
        >
          ● BROADCASTING
        </motion.span>
      </div>

      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11, color: C.ink, lineHeight: 1.8,
        padding: "14px 16px",
        background: `${C.deep}`,
        border: `1px dashed ${C.border}`,
        minHeight: 260,
      }}>
        {TRANSMISSION.slice(0, lineCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              color: line.startsWith(">>") ? C.teal : line.startsWith("//") ? C.coral : C.ink + "cc",
              letterSpacing: "0.04em",
            }}
          >
            {line || "\u00A0"}
            {i === lineCount - 1 && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                style={{ color: C.coral }}
              >
                ▊
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CTA — final call to action
   ═══════════════════════════════════════════════════════════════════ */

function CTASection({ onStart }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <section ref={ref} style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div style={{
        position: "absolute", top: "50%", left: "50%",
        translateX: "-50%", translateY: "-50%",
        opacity: useTransform(scrollYProgress, [0, 1], [0, 1]),
        scale,
      }}>
        <ArcReactor size={700} />
      </motion.div>

      <motion.div style={{ position: "relative", textAlign: "center", opacity, y, zIndex: 1 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          color: C.coral, letterSpacing: "0.3em", marginBottom: 18,
        }}>
          {">> SYSTEM READY"}
        </div>
        <h2 style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "clamp(40px, 6vw, 86px)",
          fontWeight: 800, color: C.ink, margin: 0,
          textTransform: "uppercase", letterSpacing: "0.08em",
          textShadow: `0 0 40px ${C.coral}99`,
        }}>
          Engage<br/>Protocol
        </h2>
        <p style={{
          fontFamily: "Rajdhani, sans-serif", fontSize: 18,
          color: C.ink + "aa", marginTop: 20,
          maxWidth: 540, marginLeft: "auto", marginRight: "auto",
          letterSpacing: "0.06em", lineHeight: 1.6,
        }}>
          Your data is waiting. Five phases. Zero wrong tests. Transmit your first analysis in under ninety seconds.
        </p>
        <div style={{ marginTop: 36 }}>
          <Btn onClick={onStart} style={{ padding: "16px 36px", fontSize: 14 }}>
            <Play size={16} strokeWidth={2.5} /> Initiate Protocol
          </Btn>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Landing root
   ═══════════════════════════════════════════════════════════════════ */

export default function Landing() {
  const navigate = useNavigate();
  const onStart = () => navigate("/questionnaire");

  return (
    <div style={{ position: "relative", zIndex: 1, margin: "-56px -24px 0" }}>
      <HeroSection onStart={onStart} />

      <ParallaxSection
        index={1} total={5}
        tag="Query Protocol"
        title="Ask why before you crunch"
        description="D.A.R.V.I.S. begins by interrogating your design. What are you comparing, predicting, or relating? As you answer, the decision tree assembles itself — routing through 15+ statistical tests to find the one that actually fits."
        IconCmp={Target}
        accent={C.coral}
        renderScene={(progress) => <SceneQuery progress={progress} />}
      />

      <ParallaxSection
        index={2} total={5}
        tag="Data Ingest"
        title="Stream any dataset"
        description="Drop a CSV or Excel file into the dropzone. D.A.R.V.I.S. parses columns, detects data types, flags missing values, and renders a live preview so you can assign roles with surgical precision."
        IconCmp={UploadIcon}
        accent={C.teal}
        renderScene={(progress) => <SceneIngest progress={progress} />}
      />

      <ParallaxSection
        index={3} total={5}
        tag="Diagnostic Scan"
        title="Verify every assumption"
        description="Before a single test runs, D.A.R.V.I.S. sweeps the data for normality, homogeneity of variance, independence, and outliers. Anything suspicious is flagged — and alternative tests are pre-loaded in case."
        IconCmp={ShieldCheck}
        accent={C.yellow}
        renderScene={(progress) => <SceneDiagnostics progress={progress} />}
      />

      <ParallaxSection
        index={4} total={5}
        tag="Compute Core"
        title="Statistical intelligence"
        description="The compute core executes the chosen test — t-statistic, F-ratio, χ², r — and derives effect sizes, confidence intervals, and APA-formatted write-ups, all in one atomic pass."
        IconCmp={Cpu}
        accent={C.purple}
        renderScene={(progress) => <SceneCompute progress={progress} />}
      />

      <ParallaxSection
        index={5} total={5}
        tag="Transmit Report"
        title="Publish anywhere"
        description="Export as Markdown for your paper, CSV for your records, PNG for your slide deck. Every result is reproducible, versioned, and ready to broadcast to your team."
        IconCmp={Radio}
        accent={C.coral}
        renderScene={(progress) => <SceneTransmit progress={progress} />}
      />

      <CTASection onStart={onStart} />
    </div>
  );
}
