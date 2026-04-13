import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
   JARVIS / HUD design tokens
   ───────────────────────────────────────────────────────────────────── */
export const C = {
  coral:  "#00E5FF",   // primary cyan (semantic: primary)
  teal:   "#36F1CB",   // success mint
  yellow: "#FF7A1A",   // warning / Stark orange
  purple: "#FF3B5C",   // special / Stark red
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

      {/* ── HUD WIDGETS ─────────────────────────────────────── */}
      <HudWidgets />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Ambient HUD widgets — decorative background overlays
   ───────────────────────────────────────────────────────────────────── */

function HudWidgets() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const cpu = 8 + Math.round(Math.abs(Math.sin(tick * 0.4)) * 22);
  const ram = 38 + Math.round(Math.abs(Math.cos(tick * 0.3)) * 18);
  const net = 2 + Math.round(Math.abs(Math.sin(tick * 0.6)) * 12);
  const temp = 41 + Math.round(Math.abs(Math.sin(tick * 0.25)) * 8);
  const upH = Math.floor(tick * 1.2 / 3600) % 100;
  const upM = Math.floor((tick * 1.2 % 3600) / 60);
  const upS = Math.floor(tick * 1.2 % 60);

  const wBase = {
    position: "absolute",
    pointerEvents: "none",
    opacity: 0.35,
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 9,
    letterSpacing: "0.14em",
    color: C.muted,
  };

  return (
    <>
      {/* ── TOP-LEFT: clock + date ──────────────────────────── */}
      <div style={{ ...wBase, top: 80, left: 20, opacity: 0.4 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.coral, letterSpacing: "0.08em", textShadow: `0 0 10px ${C.coral}66` }}>
          {timeStr}
        </div>
        <div style={{ marginTop: 4, color: C.muted, fontSize: 9 }}>{dateStr.toUpperCase()}</div>
      </div>

      {/* ── TOP-LEFT: CPU + RAM bars ────────────────────────── */}
      <div style={{ ...wBase, top: 140, left: 20, width: 110 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ color: C.coral, fontSize: 8 }}>[CPU]</span>
            <span style={{ color: C.coral }}>{cpu}%</span>
          </div>
          <div style={{ height: 3, background: C.border, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${cpu}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: "100%", background: cpu > 70 ? "#FF3B5C" : C.coral, boxShadow: `0 0 6px ${C.coral}` }}
            />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ color: C.teal, fontSize: 8 }}>[RAM]</span>
            <span style={{ color: C.teal }}>{ram}%</span>
          </div>
          <div style={{ height: 3, background: C.border, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${ram}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: "100%", background: C.teal, boxShadow: `0 0 6px ${C.teal}` }}
            />
          </div>
        </div>
      </div>

      {/* ── LEFT: waveform visualizer ───────────────────────── */}
      <div style={{ ...wBase, top: "45%", left: 16, opacity: 0.25 }}>
        <div style={{ fontSize: 8, color: C.coral, marginBottom: 4 }}>[WAVEFORM]</div>
        <svg width="100" height="36" viewBox="0 0 100 36">
          {Array.from({ length: 25 }).map((_, i) => {
            const h = 4 + Math.abs(Math.sin((tick * 0.8 + i * 0.5)) * 14);
            return (
              <rect key={i} x={i * 4} y={18 - h / 2} width={2.5} height={h} fill={C.coral} opacity={0.7} rx={1} />
            );
          })}
        </svg>
      </div>

      {/* ── BOTTOM-LEFT: network speed ──────────────────────── */}
      <div style={{ ...wBase, bottom: 80, left: 20 }}>
        <div style={{ fontSize: 8, color: C.teal, marginBottom: 4 }}>[NETWORK]</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <span style={{ color: C.muted, fontSize: 7 }}>DN:</span>{" "}
            <span style={{ color: C.teal }}>{net}.{Math.floor(tick * 3 % 10)} MB/s</span>
          </div>
          <div>
            <span style={{ color: C.muted, fontSize: 7 }}>UP:</span>{" "}
            <span style={{ color: C.coral }}>{Math.max(1, net - 4)}.{Math.floor(tick * 7 % 10)} MB/s</span>
          </div>
        </div>
      </div>

      {/* ── TOP-RIGHT: temperature + uptime ─────────────────── */}
      <div style={{ ...wBase, top: 80, right: 20, textAlign: "right", opacity: 0.4 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: temp > 45 ? C.yellow : C.teal, textShadow: `0 0 8px ${temp > 45 ? C.yellow : C.teal}66` }}>
            {temp}
          </span>
          <span style={{ fontSize: 9, color: C.muted }}>°C</span>
          <span style={{ fontSize: 8, color: C.muted, marginLeft: 6 }}>[TEMP]</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 8, color: C.muted }}>
          [UPTIME] {String(upH).padStart(2, "0")}:{String(upM).padStart(2, "0")}:{String(upS).padStart(2, "0")}
        </div>
      </div>

      {/* ── RIGHT: circular gauge ───────────────────────────── */}
      <div style={{ ...wBase, top: "38%", right: 18, opacity: 0.25 }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="26" fill="none" stroke={C.border} strokeWidth="2" />
          <circle
            cx="30" cy="30" r="26" fill="none"
            stroke={C.coral} strokeWidth="2"
            strokeDasharray={`${cpu * 1.63} 163`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{ filter: `drop-shadow(0 0 4px ${C.coral})` }}
          />
          <text x="30" y="28" textAnchor="middle" fontSize="10" fill={C.coral} fontFamily="Orbitron" fontWeight="700">
            {cpu}
          </text>
          <text x="30" y="38" textAnchor="middle" fontSize="6" fill={C.muted} fontFamily="JetBrains Mono" letterSpacing="0.1em">
            CPU
          </text>
        </svg>
      </div>

      {/* ── RIGHT-MID: second circular gauge (RAM) ──────────── */}
      <div style={{ ...wBase, top: "55%", right: 22, opacity: 0.2 }}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="21" fill="none" stroke={C.border} strokeWidth="1.5" />
          <circle
            cx="25" cy="25" r="21" fill="none"
            stroke={C.teal} strokeWidth="1.5"
            strokeDasharray={`${ram * 1.32} 132`}
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
            style={{ filter: `drop-shadow(0 0 4px ${C.teal})` }}
          />
          <text x="25" y="24" textAnchor="middle" fontSize="9" fill={C.teal} fontFamily="Orbitron" fontWeight="700">
            {ram}
          </text>
          <text x="25" y="33" textAnchor="middle" fontSize="5" fill={C.muted} fontFamily="JetBrains Mono" letterSpacing="0.1em">
            RAM
          </text>
        </svg>
      </div>

      {/* ── BOTTOM-RIGHT: data throughput sparkline ──────────── */}
      <div style={{ ...wBase, bottom: 80, right: 20, opacity: 0.25, textAlign: "right" }}>
        <div style={{ fontSize: 8, color: C.coral, marginBottom: 4 }}>[THROUGHPUT]</div>
        <svg width="110" height="30" viewBox="0 0 110 30">
          <polyline
            fill="none" stroke={C.coral} strokeWidth="1.2"
            points={Array.from({ length: 22 }).map((_, i) => {
              const y = 15 + Math.sin((tick * 0.5 + i * 0.6)) * 10 + Math.cos((tick * 0.3 + i * 1.1)) * 4;
              return `${i * 5},${y}`;
            }).join(" ")}
            style={{ filter: `drop-shadow(0 0 3px ${C.coral})` }}
          />
          <polyline
            fill="none" stroke={C.teal} strokeWidth="0.8" opacity="0.6"
            points={Array.from({ length: 22 }).map((_, i) => {
              const y = 15 + Math.cos((tick * 0.4 + i * 0.8)) * 8;
              return `${i * 5},${y}`;
            }).join(" ")}
          />
        </svg>
      </div>

      {/* ── BOTTOM-CENTER-LEFT: small status blocks ─────────── */}
      <div style={{ ...wBase, bottom: 30, left: "15%", opacity: 0.2, display: "flex", gap: 12 }}>
        {[
          { label: "SYS", val: "OK", color: C.teal },
          { label: "SEC", val: "A+", color: C.teal },
          { label: "I/O", val: `${net}M`, color: C.coral },
        ].map(s => (
          <div key={s.label} style={{
            padding: "3px 8px",
            border: `1px solid ${s.color}44`,
            background: `${s.color}08`,
            fontSize: 7, letterSpacing: "0.16em",
          }}>
            <span style={{ color: C.muted }}>{s.label}: </span>
            <span style={{ color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM-CENTER-RIGHT: coordinates ────────────────── */}
      <div style={{ ...wBase, bottom: 30, right: "15%", opacity: 0.2, fontSize: 7 }}>
        <span style={{ color: C.muted }}>LAT </span>
        <span style={{ color: C.coral }}>48.8566°N</span>
        <span style={{ color: C.muted, marginLeft: 10 }}>LON </span>
        <span style={{ color: C.coral }}>2.3522°E</span>
      </div>

      {/* ── LEFT-MID: mini bar chart ────────────────────────── */}
      <div style={{ ...wBase, top: "65%", left: 18, opacity: 0.2 }}>
        <div style={{ fontSize: 7, color: C.teal, marginBottom: 4 }}>[ANALYSIS QUEUE]</div>
        <svg width="80" height="28" viewBox="0 0 80 28">
          {Array.from({ length: 10 }).map((_, i) => {
            const h = 6 + Math.abs(Math.sin(tick * 0.3 + i * 0.9)) * 18;
            return (
              <rect key={i} x={i * 8} y={28 - h} width={5} height={h} fill={i % 3 === 0 ? C.coral : C.teal} opacity={0.6} />
            );
          })}
        </svg>
      </div>

      {/* ── LEFT: ECG heartbeat line ────────────────────────── */}
      <div style={{ ...wBase, top: "28%", left: 16, opacity: 0.22 }}>
        <div style={{ fontSize: 7, color: "#FF3B5C", marginBottom: 3 }}>[VITALS]</div>
        <svg width="120" height="32" viewBox="0 0 120 32">
          <polyline
            fill="none" stroke="#FF3B5C" strokeWidth="1.2"
            strokeLinejoin="round" strokeLinecap="round"
            points={Array.from({ length: 40 }).map((_, i) => {
              const x = i * 3;
              const phase = (i + tick * 3) % 20;
              let y = 16;
              if (phase === 8) y = 6;
              else if (phase === 9) y = 26;
              else if (phase === 10) y = 10;
              else if (phase === 11) y = 16;
              return `${x},${y}`;
            }).join(" ")}
            style={{ filter: "drop-shadow(0 0 3px #FF3B5C)" }}
          />
        </svg>
        <div style={{ fontSize: 7, display: "flex", gap: 12, marginTop: 2 }}>
          <span style={{ color: "#FF3B5C" }}>{68 + (tick % 5)} BPM</span>
          <span style={{ color: C.muted }}>SpO2 {98 + (tick % 2)}%</span>
        </div>
      </div>

      {/* ── TOP: power level bar (horizontal) ───────────────── */}
      <div style={{ ...wBase, top: 80, left: "50%", transform: "translateX(-50%)", opacity: 0.18, width: 200 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, marginBottom: 3 }}>
          <span style={{ color: C.coral }}>[ARC REACTOR]</span>
          <span style={{ color: C.coral }}>PWR {Math.min(100, 85 + Math.round(Math.sin(tick * 0.2) * 10))}%</span>
        </div>
        <div style={{ height: 4, background: C.border, display: "flex", gap: 1 }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const filled = i < Math.floor((85 + Math.sin(tick * 0.2) * 10) / 5);
            return (
              <div key={i} style={{
                flex: 1, height: "100%",
                background: filled ? (i > 16 ? "#FF3B5C" : C.coral) : "transparent",
                boxShadow: filled ? `0 0 4px ${C.coral}` : "none",
              }} />
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: mini rotating radar ──────────────────────── */}
      <div style={{ ...wBase, top: "22%", right: 16, opacity: 0.2 }}>
        <div style={{ fontSize: 7, color: C.teal, marginBottom: 3, textAlign: "right" }}>[RADAR]</div>
        <svg width="70" height="70" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="32" fill="none" stroke={C.border} strokeWidth="0.5" />
          <circle cx="35" cy="35" r="22" fill="none" stroke={C.border} strokeWidth="0.4" />
          <circle cx="35" cy="35" r="12" fill="none" stroke={C.border} strokeWidth="0.3" />
          <line x1="35" y1="3" x2="35" y2="67" stroke={C.border} strokeWidth="0.3" />
          <line x1="3" y1="35" x2="67" y2="35" stroke={C.border} strokeWidth="0.3" />
          <motion.line
            x1="35" y1="35" x2="35" y2="5"
            stroke={C.teal} strokeWidth="1"
            style={{ transformOrigin: "35px 35px", filter: `drop-shadow(0 0 4px ${C.teal})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {[
            { cx: 45, cy: 20 }, { cx: 22, cy: 42 }, { cx: 50, cy: 48 },
          ].map((dot, i) => (
            <motion.circle
              key={i} cx={dot.cx} cy={dot.cy} r="2"
              fill={C.teal}
              animate={{ opacity: [0.9, 0.2, 0.9] }}
              transition={{ duration: 2, delay: i * 0.7, repeat: Infinity }}
              style={{ filter: `drop-shadow(0 0 3px ${C.teal})` }}
            />
          ))}
        </svg>
      </div>

      {/* ── RIGHT-BOTTOM: threat assessment ─────────────────── */}
      <div style={{ ...wBase, bottom: 160, right: 16, opacity: 0.22, textAlign: "right" }}>
        <div style={{ fontSize: 7, color: C.teal, marginBottom: 6 }}>[THREAT ASSESSMENT]</div>
        {[
          { label: "EXTERNAL", level: 0, color: C.teal },
          { label: "INTERNAL", level: 0, color: C.teal },
          { label: "NETWORK",  level: 1, color: C.yellow },
          { label: "PAYLOAD",  level: 0, color: C.teal },
        ].map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 7, color: C.muted }}>{t.label}</span>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 3,
                  background: i <= t.level ? t.color : C.border,
                  boxShadow: i <= t.level ? `0 0 3px ${t.color}` : "none",
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── LEFT-BOTTOM: shield integrity ───────────────────── */}
      <div style={{ ...wBase, bottom: 160, left: 16, opacity: 0.2 }}>
        <div style={{ fontSize: 7, color: C.coral, marginBottom: 4 }}>[SHIELD INTEGRITY]</div>
        <svg width="80" height="50" viewBox="0 0 80 50">
          <path d="M40 5 L70 18 L70 35 Q70 45 40 48 Q10 45 10 35 L10 18 Z"
            fill="none" stroke={C.coral} strokeWidth="1" opacity="0.5" />
          <path d="M40 10 L62 20 L62 33 Q62 40 40 43 Q18 40 18 33 L18 20 Z"
            fill={C.coral} opacity="0.06" />
          <text x="40" y="30" textAnchor="middle" fontSize="10" fill={C.coral} fontFamily="Orbitron" fontWeight="700">
            {96 + (tick % 4)}%
          </text>
        </svg>
      </div>

      {/* ── TOP-MID-LEFT: SWAP + DISK bars ──────────────────── */}
      <div style={{ ...wBase, top: 140, left: 150, width: 90, opacity: 0.18 }}>
        {[
          { label: "SWAP", val: 12 + (tick % 8), color: C.yellow },
          { label: "DISK", val: 64 + (tick % 3), color: C.purple },
          { label: "GPU",  val: 22 + Math.round(Math.sin(tick * 0.5) * 15), color: C.coral },
        ].map(b => (
          <div key={b.label} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, marginBottom: 2 }}>
              <span style={{ color: b.color }}>[{b.label}]</span>
              <span style={{ color: b.color }}>{b.val}%</span>
            </div>
            <div style={{ height: 2, background: C.border }}>
              <div style={{
                width: `${b.val}%`, height: "100%",
                background: b.color, boxShadow: `0 0 4px ${b.color}`,
                transition: "width 0.8s",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── TOP-MID-RIGHT: data feed scroll ─────────────────── */}
      <div style={{ ...wBase, top: 140, right: 100, opacity: 0.15, width: 140, height: 60, overflow: "hidden" }}>
        <div style={{ fontSize: 7, color: C.coral, marginBottom: 3 }}>[DATA FEED]</div>
        <div style={{ fontSize: 7, lineHeight: 1.6, color: C.muted }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const idx = (tick + i) % 8;
            const feeds = [
              `0x${(tick * 7 + i * 31).toString(16).toUpperCase().slice(0, 6).padStart(6, "0")}`,
              `PKT_${String(tick * 3 + i).padStart(4, "0")} RECV`,
              `CRC_OK  HASH_VALID`,
              `SEQ ${String(tick + i * 11).padStart(6, "0")}`,
              `ACK ${String(tick * 2 + i).padStart(4, "0")} · TTL 64`,
              `SIG_STRENGTH -${42 + (i * 3)}dBm`,
              `HANDSHAKE COMPLETE`,
              `BUFFER ${Math.round(45 + Math.sin(tick * 0.3 + i) * 30)}%`,
            ];
            return (
              <div key={i} style={{ color: idx % 3 === 0 ? C.coral : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {">"} {feeds[idx]}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── EDGES: decorative corner brackets ───────────────── */}
      {[
        { top: 10, left: 10 },
        { top: 10, right: 10 },
        { bottom: 10, left: 10 },
        { bottom: 10, right: 10 },
      ].map((pos, i) => (
        <div key={i} style={{
          ...wBase, ...pos, opacity: 0.15, width: 30, height: 30,
          borderLeft: pos.left !== undefined ? `1.5px solid ${C.coral}` : "none",
          borderRight: pos.right !== undefined ? `1.5px solid ${C.coral}` : "none",
          borderTop: pos.top !== undefined ? `1.5px solid ${C.coral}` : "none",
          borderBottom: pos.bottom !== undefined ? `1.5px solid ${C.coral}` : "none",
        }} />
      ))}

      {/* ── EDGES: horizontal rule lines ────────────────────── */}
      <div style={{ ...wBase, top: 70, left: 0, right: 0, height: 1, opacity: 0.08, background: `linear-gradient(90deg, ${C.coral}44, transparent 20%, transparent 80%, ${C.coral}44)` }} />
      <div style={{ ...wBase, bottom: 70, left: 0, right: 0, height: 1, opacity: 0.08, background: `linear-gradient(90deg, ${C.coral}44, transparent 20%, transparent 80%, ${C.coral}44)` }} />

      {/* ── LEFT: targeting crosshair ───────────────────────── */}
      <div style={{ ...wBase, top: "80%", left: 30, opacity: 0.15 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke={C.coral} strokeWidth="0.6" strokeDasharray="3 3" />
          <circle cx="20" cy="20" r="8" fill="none" stroke={C.coral} strokeWidth="0.4" />
          <line x1="20" y1="2" x2="20" y2="10" stroke={C.coral} strokeWidth="0.6" />
          <line x1="20" y1="30" x2="20" y2="38" stroke={C.coral} strokeWidth="0.6" />
          <line x1="2" y1="20" x2="10" y2="20" stroke={C.coral} strokeWidth="0.6" />
          <line x1="30" y1="20" x2="38" y2="20" stroke={C.coral} strokeWidth="0.6" />
          <motion.circle
            cx="20" cy="20" r="2" fill={C.coral}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ filter: `drop-shadow(0 0 4px ${C.coral})` }}
          />
        </svg>
      </div>

      {/* ── RIGHT-BOTTOM: mini frequency spectrum ──────────── */}
      <div style={{ ...wBase, top: "75%", right: 14, opacity: 0.18 }}>
        <div style={{ fontSize: 7, color: C.teal, marginBottom: 3, textAlign: "right" }}>[FREQ SPECTRUM]</div>
        <svg width="90" height="24" viewBox="0 0 90 24">
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 2 + Math.abs(Math.sin(tick * 0.6 + i * 0.4) * Math.cos(tick * 0.2 + i * 0.7)) * 18;
            return (
              <rect key={i} x={i * 3} y={24 - h} width={2} height={h}
                fill={h > 14 ? C.coral : C.teal} opacity={0.6} />
            );
          })}
        </svg>
      </div>

      {/* ── TOP: scrolling binary ticker ────────────────────── */}
      <div style={{
        ...wBase, top: 100, left: "50%", transform: "translateX(-50%)",
        opacity: 0.08, fontSize: 7, letterSpacing: "0.3em",
        color: C.coral, width: 300, textAlign: "center",
        overflow: "hidden", whiteSpace: "nowrap",
      }}>
        {Array.from({ length: 48 }).map((_, i) => ((tick * 7 + i * 13) % 2).toString()).join("")}
      </div>
    </>
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
const STEP_ROUTES = ["/questionnaire", "/upload", "/assumptions", "/analysis", "/report"];

export function StepBar({ current, onNavigate }) {
  return (
    <div style={{ margin: "0 auto 48px", maxWidth: 780 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        {STEPS.map((s, i) => {
          const active = i === current;
          const done = i < current;
          const clickable = done && onNavigate;
          return (
            <button
              key={s}
              onClick={clickable ? () => onNavigate(STEP_ROUTES[i]) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", padding: "4px 8px",
                cursor: clickable ? "pointer" : active ? "default" : "default",
                fontFamily: "Orbitron, sans-serif", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: active ? C.coral : done ? C.teal : C.muted,
                transition: "color 0.2s, text-shadow 0.2s",
                textShadow: clickable ? "none" : "none",
                opacity: (!done && !active) ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (clickable) e.target.style.textShadow = `0 0 10px ${C.teal}`; }}
              onMouseLeave={(e) => { e.target.style.textShadow = "none"; }}
            >
              <span className="mono" style={{ fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
              {clickable && <span style={{ fontSize: 8, opacity: 0.6, marginLeft: 2 }}>↩</span>}
            </button>
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
                cursor: done ? "pointer" : "default",
              }}
              onClick={done && onNavigate ? () => onNavigate(STEP_ROUTES[i]) : undefined}
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
        fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 800,
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
