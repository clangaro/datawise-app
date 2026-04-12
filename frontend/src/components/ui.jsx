import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
   JARVIS / HUD design tokens
   ───────────────────────────────────────────────────────────────────── */
export const C = {
  coral:  "#00E5FF",   // primary cyan (semantic: primary)
  teal:   "#36F1CB",   // success mint
  yellow: "#FF7A1A",   // warning / Stark orange
  purple: "#A78BFA",   // special / alternatives
  navy:   "#1E3A5F",   // outline neutral
  cream:  "#05080F",   // deep space bg
  ink:    "#E8F4FF",   // primary text
  muted:  "#7A8BA3",   // muted text
  card:   "#0B1220",   // panel bg
  border: "#1E3A5F",   // panel border
  red:    "#FF3B5C",   // alert red
  glow:   "#00E5FF",
  deep:   "#05080F",
  panel:  "#0B1220",
  grid:   "#0F2138",
};

export const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');
  html, body, #root {
    font-family: 'Rajdhani', sans-serif;
    color: ${C.ink};
    background: ${C.deep};
    -webkit-font-smoothing: antialiased;
    letter-spacing: 0.01em;
  }
  * { box-sizing: border-box; }
  ::selection { background: ${C.coral}44; color: ${C.ink}; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: ${C.deep}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 0; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.coral}66; }
  input, select, textarea, button { font-family: 'Rajdhani', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .display { font-family: 'Orbitron', sans-serif; letter-spacing: 0.05em; }
`;

const CLIP_ANGULAR  = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
const CLIP_BTN      = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

/* ─────────────────────────────────────────────────────────────────────
   Backgrounds / parallax layers
   ───────────────────────────────────────────────────────────────────── */

export function HexGrid({ opacity = 0.08 }) {
  const hexPattern = `
    <svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'>
      <path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z' fill='none' stroke='${encodeURIComponent(C.coral)}' stroke-width='0.6'/>
    </svg>`;
  const url = `url("data:image/svg+xml;utf8,${hexPattern.replace(/\s+/g, " ").trim()}")`;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: url,
      backgroundSize: "56px 64px",
      opacity,
      pointerEvents: "none",
    }} />
  );
}

export function ArcReactor({ size = 520, style = {} }) {
  return (
    <div style={{ position: "absolute", width: size, height: size, pointerEvents: "none", ...style }}>
      <motion.svg
        width={size} height={size} viewBox="0 0 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <circle cx="100" cy="100" r="96" fill="none" stroke={C.coral} strokeWidth="0.4" opacity="0.5" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="82" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.35" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 70;
          const y1 = 100 + Math.sin(a) * 70;
          const x2 = 100 + Math.cos(a) * 78;
          const y2 = 100 + Math.sin(a) * 78;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.coral} strokeWidth="0.5" opacity="0.7" />;
        })}
      </motion.svg>
      <motion.svg
        width={size} height={size} viewBox="0 0 200 200"
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <circle cx="100" cy="100" r="64" fill="none" stroke={C.coral} strokeWidth="0.4" opacity="0.45" strokeDasharray="1 3" />
        <circle cx="100" cy="100" r="50" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.3" />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 50;
          const y1 = 100 + Math.sin(a) * 50;
          const x2 = 100 + Math.cos(a) * 64;
          const y2 = 100 + Math.sin(a) * 64;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.coral} strokeWidth="0.7" opacity="0.6" />;
        })}
      </motion.svg>
      <motion.svg
        width={size} height={size} viewBox="0 0 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <circle cx="100" cy="100" r="34" fill="none" stroke={C.coral} strokeWidth="0.5" opacity="0.5" />
        <circle cx="100" cy="100" r="24" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.4" strokeDasharray="1 2" />
        <circle cx="100" cy="100" r="14" fill={C.coral} opacity="0.08" />
        <circle cx="100" cy="100" r="6"  fill={C.coral} opacity="0.25" />
      </motion.svg>
    </div>
  );
}

export function ParticleField({ count = 40 }) {
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.8 + Math.random() * 1.6,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 8,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: C.coral,
            boxShadow: `0 0 6px ${C.coral}`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -40, -80],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function ScanOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2,
      backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 3px, ${C.coral}06 3px, ${C.coral}06 4px)`,
      mixBlendMode: "screen",
    }} />
  );
}

/* Scroll-driven parallax wrapper — attach to Layout root */
export function ParallaxBackdrop() {
  const { scrollY } = useScroll();
  const ring1Y  = useTransform(scrollY, [0, 2000], [0, -600]);
  const ring2Y  = useTransform(scrollY, [0, 2000], [0, -300]);
  const gridY   = useTransform(scrollY, [0, 2000], [0, -200]);
  const partY   = useTransform(scrollY, [0, 2000], [0, -120]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* deep gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 10%, ${C.card} 0%, ${C.deep} 45%, #000 100%)`,
      }} />

      {/* far hex grid */}
      <motion.div style={{ position: "absolute", inset: "-10% 0 -10% 0", y: gridY }}>
        <HexGrid opacity={0.05} />
      </motion.div>

      {/* far arc reactor */}
      <motion.div style={{ position: "absolute", top: "-20%", left: "50%", y: ring1Y, x: "-50%" }}>
        <ArcReactor size={900} />
      </motion.div>

      {/* mid arc */}
      <motion.div style={{ position: "absolute", top: "60%", right: "-10%", y: ring2Y }}>
        <ArcReactor size={520} />
      </motion.div>

      {/* drifting particles */}
      <motion.div style={{ position: "absolute", inset: 0, y: partY }}>
        <ParticleField count={50} />
      </motion.div>

      {/* horizon line */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: "50%",
        height: 1, background: `linear-gradient(90deg, transparent, ${C.coral}33, transparent)`,
      }} />

      {/* vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, transparent 40%, #000c 100%)`,
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Corner brackets + scan sweep
   ───────────────────────────────────────────────────────────────────── */

function CornerBrackets({ color = C.coral, size = 14 }) {
  const common = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    pointerEvents: "none",
  };
  return (
    <>
      <div style={{ ...common, top: 0, left: 0,         borderLeft: `1.5px solid ${color}`, borderTop:    `1.5px solid ${color}` }} />
      <div style={{ ...common, top: 0, right: 0,        borderRight:`1.5px solid ${color}`, borderTop:    `1.5px solid ${color}` }} />
      <div style={{ ...common, bottom: 0, left: 0,      borderLeft: `1.5px solid ${color}`, borderBottom: `1.5px solid ${color}` }} />
      <div style={{ ...common, bottom: 0, right: 0,     borderRight:`1.5px solid ${color}`, borderBottom: `1.5px solid ${color}` }} />
    </>
  );
}

function ScanSweep({ color = C.coral }) {
  return (
    <motion.div
      initial={{ top: "-20%", opacity: 0 }}
      animate={{ top: "120%", opacity: [0, 0.5, 0] }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 12px ${color}`,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Card / HudPanel  (same export name as before: Card)
   ───────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, tilt3d = true, noScan = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -6]);
  const translateY = useTransform(scrollYProgress, [0, 1], [10, -10]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "relative",
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.deep} 100%)`,
        borderRadius: 0,
        border: `1px solid ${C.border}`,
        padding: "28px 32px",
        boxShadow: `0 0 0 1px ${C.coral}10 inset, 0 20px 60px #000a, 0 0 40px ${C.coral}08`,
        clipPath: CLIP_ANGULAR,
        transformStyle: "preserve-3d",
        perspective: 1200,
        rotateX: tilt3d ? rotateX : 0,
        y: tilt3d ? translateY : 0,
        ...style,
      }}
    >
      <CornerBrackets />
      {inView && !noScan && <ScanSweep />}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Button / HudBtn   (export name: Btn)
   ───────────────────────────────────────────────────────────────────── */
export function Btn({ children, onClick, color = C.coral, outline = false, disabled = false, type = "button", style = {} }) {
  const bgBase = outline ? "transparent" : `linear-gradient(180deg, ${color}25, ${color}0a)`;
  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { y: -1, filter: `drop-shadow(0 0 12px ${color})` }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        position: "relative",
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "12px 26px",
        clipPath: CLIP_BTN,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Orbitron, sans-serif",
        fontWeight: 600, fontSize: 12, letterSpacing: "0.14em",
        textTransform: "uppercase",
        border: "none",
        background: disabled ? `${C.border}55` : bgBase,
        color: disabled ? C.muted : (outline ? color : color === C.coral ? C.ink : color),
        boxShadow: disabled ? "none" : (outline
          ? `inset 0 0 0 1px ${color}aa`
          : `inset 0 0 0 1px ${color}aa, 0 0 24px ${color}33`),
        transition: "background 0.2s, box-shadow 0.2s",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Pill (status badge)
   ───────────────────────────────────────────────────────────────────── */
export function Pill({ color, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px",
      clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
      background: color + "1f",
      border: `1px solid ${color}66`,
      color,
      fontFamily: "Orbitron, sans-serif",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
      textTransform: "uppercase",
      lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   OptionCard (target reticle)
   ───────────────────────────────────────────────────────────────────── */
export function OptionCard({ label, desc, icon, selected, onClick, color = C.coral }) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        position: "relative",
        padding: "14px 18px",
        cursor: "pointer",
        border: `1px solid ${selected ? color : C.border}`,
        background: selected ? `linear-gradient(90deg, ${color}18, transparent)` : `${C.panel}aa`,
        display: "flex", alignItems: "center", gap: 14,
        clipPath: CLIP_BTN,
        transition: "border 0.2s, background 0.2s",
        boxShadow: selected ? `inset 0 0 0 1px ${color}, 0 0 20px ${color}22` : "none",
      }}
    >
      <div style={{
        width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: selected ? color : C.muted,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "Orbitron, sans-serif", fontWeight: 600, fontSize: 13,
          color: selected ? C.ink : C.ink + "cc",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{label}</div>
        {desc && <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: C.muted, marginTop: 2 }}>{desc}</div>}
      </div>
      {/* target reticle */}
      <div style={{
        position: "relative", width: 22, height: 22, flexShrink: 0,
        border: `1px solid ${selected ? color : C.border}`,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && (
          <>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }}
            />
            <div style={{ position: "absolute", top: -3, left: "50%", width: 1, height: 3, background: color }} />
            <div style={{ position: "absolute", bottom: -3, left: "50%", width: 1, height: 3, background: color }} />
            <div style={{ position: "absolute", left: -3, top: "50%", width: 3, height: 1, background: color }} />
            <div style={{ position: "absolute", right: -3, top: "50%", width: 3, height: 1, background: color }} />
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Segmented step bar
   ───────────────────────────────────────────────────────────────────── */
export const STEPS = ["Questionnaire", "Upload", "Assumptions", "Analysis", "Report"];

export function StepBar({ current }) {
  return (
    <div style={{ margin: "0 auto 48px", maxWidth: 720 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "Orbitron, sans-serif", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.14em", textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {STEPS.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div key={s} style={{
              color: active ? C.coral : done ? C.teal : C.muted,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="mono" style={{ fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {STEPS.map((_, i) => {
          const active = i === current;
          const done = i < current;
          const color = done ? C.teal : active ? C.coral : C.border;
          return (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.08 }}
              style={{
                flex: 1,
                height: 4,
                background: color,
                boxShadow: active || done ? `0 0 12px ${color}` : "none",
                clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                transformOrigin: "left",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Spinner (rotating reticle)
   ───────────────────────────────────────────────────────────────────── */
export function Spinner({ color = C.coral, size = 36 }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1.5px dashed ${color}`,
          boxShadow: `0 0 20px ${color}55`,
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 6, borderRadius: "50%",
          border: `1px solid ${color}88`,
        }}
      />
      <div style={{
        position: "absolute", inset: "50%",
        width: 4, height: 4, margin: "-2px 0 0 -2px",
        borderRadius: "50%", background: color,
        boxShadow: `0 0 10px ${color}`,
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SectionTitle — display font
   ───────────────────────────────────────────────────────────────────── */
export function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.coral, letterSpacing: "0.3em",
        marginBottom: 8, opacity: 0.7,
      }}>
        {">> "}D.A.R.V.I.S. SYSTEM
      </div>
      <h2 style={{
        fontFamily: "Orbitron, sans-serif",
        fontSize: 36, fontWeight: 800,
        color: C.ink, margin: 0,
        textTransform: "uppercase", letterSpacing: "0.08em",
        textShadow: `0 0 30px ${C.coral}44`,
      }}>
        {children}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: "Rajdhani, sans-serif",
          color: C.muted, marginTop: 10, fontSize: 15,
          textTransform: "uppercase", letterSpacing: "0.12em",
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        width: 60, height: 1, margin: "14px auto 0",
        background: `linear-gradient(90deg, transparent, ${C.coral}, transparent)`,
        boxShadow: `0 0 10px ${C.coral}`,
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Form inputs
   ───────────────────────────────────────────────────────────────────── */
export function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: "Rajdhani, sans-serif",
        fontSize: 14, fontWeight: 500,
        padding: "10px 14px",
        borderRadius: 0,
        border: `1px solid ${C.border}`,
        background: C.deep,
        color: C.ink,
        cursor: "pointer",
        outline: "none",
        minWidth: 160,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function Input({ value, onChange, type = "text", style = {}, ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 16,
        padding: "14px 18px",
        borderRadius: 0,
        border: `1px solid ${C.border}`,
        background: C.deep,
        color: C.ink,
        outline: "none",
        width: "100%",
        letterSpacing: "0.06em",
        boxShadow: `inset 0 0 20px ${C.coral}08`,
        ...style,
      }}
      {...rest}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Boot sequence (splash on first mount)
   ───────────────────────────────────────────────────────────────────── */
const BOOT_LINES = [
  ">> INITIALIZING D.A.R.V.I.S. SYSTEMS",
  ">> LOADING STATISTICAL CORE",
  ">> CALIBRATING DECISION TREE",
  ">> ESTABLISHING SECURE LINK",
  ">> ALL SYSTEMS NOMINAL",
];

export function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => setVisibleLines(v => [...v, line]), i * 180);
    });
    const t = setTimeout(() => {
      setDone(true);
      setTimeout(() => onComplete?.(), 400);
    }, BOOT_LINES.length * 180 + 400);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: C.deep,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <ArcReactor size={800} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        <HexGrid opacity={0.06} />
      </div>
      <div style={{
        position: "relative", zIndex: 1,
        fontFamily: "JetBrains Mono, monospace",
        color: C.coral, fontSize: 13,
        lineHeight: 1.9, letterSpacing: "0.08em",
        minWidth: 360,
      }}>
        <div style={{
          fontFamily: "Orbitron, sans-serif", fontSize: 28, fontWeight: 800,
          letterSpacing: "0.2em", color: C.ink, marginBottom: 20, textAlign: "center",
          textShadow: `0 0 20px ${C.coral}`,
        }}>
          D . A . R . V . I . S .
        </div>
        {visibleLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {line}
            {i === visibleLines.length - 1 && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ marginLeft: 6 }}
              >
                ▊
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   System status ticker — fake live readouts for the nav bar
   ───────────────────────────────────────────────────────────────────── */
export function SystemStatus() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1100);
    return () => clearInterval(id);
  }, []);

  const cpu = 8 + Math.round(Math.abs(Math.sin(tick * 0.5)) * 18);
  const lat = 3 + Math.round(Math.abs(Math.cos(tick * 0.7)) * 6);
  const mem = 42 + Math.round(Math.abs(Math.sin(tick * 0.3)) * 14);

  const Readout = ({ label, value, unit, color }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontFamily: "JetBrains Mono, monospace", fontSize: 10,
      letterSpacing: "0.1em",
    }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color, minWidth: 28, textAlign: "right" }}>{String(value).padStart(2, "0")}{unit}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <Readout label="CPU" value={cpu} unit="%"  color={C.coral} />
      <Readout label="LAT" value={lat} unit="ms" color={C.teal} />
      <Readout label="MEM" value={mem} unit="%"  color={C.purple} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: C.teal, boxShadow: `0 0 6px ${C.teal}`,
          }}
        />
        <span style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 10,
          color: C.teal, letterSpacing: "0.12em",
        }}>ONLINE</span>
      </div>
    </div>
  );
}

/* Legacy Blobs export — kept so old imports don't break but returns null */
export function Blobs() { return null; }
