import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence,
} from "framer-motion";
import {
  Play, ArrowRight, ChevronDown,
  Target, Upload as UploadIcon, ShieldCheck, Cpu, Radio,
} from "lucide-react";
import { Btn, HexGrid, C } from "../components/ui.jsx";

/* ─── JARVIS Reactor SVG ────────────────────────────────────────── */

function JarvisReactor({ size = 500, rotation = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{ display: "block" }}>
      <defs>
        <filter id="jg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "200px 200px" }}>
        <circle cx="200" cy="200" r="190" fill="none" stroke={C.coral} strokeWidth="0.5" opacity="0.4" />
        <circle cx="200" cy="200" r="185" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.2" strokeDasharray="2 8" />
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i / 72) * Math.PI * 2; const major = i % 6 === 0;
          return <line key={i} x1={200 + Math.cos(a) * (major ? 175 : 180)} y1={200 + Math.sin(a) * (major ? 175 : 180)} x2={200 + Math.cos(a) * 190} y2={200 + Math.sin(a) * 190} stroke={C.coral} strokeWidth={major ? 1 : 0.4} opacity={major ? 0.8 : 0.35} />;
        })}
      </g>
      <g style={{ transform: `rotate(${-rotation * 0.6}deg)`, transformOrigin: "200px 200px" }}>
        <circle cx="200" cy="200" r="155" fill="none" stroke={C.coral} strokeWidth="0.5" opacity="0.3" />
        <circle cx="200" cy="200" r="140" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.2" strokeDasharray="4 6" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          return <line key={i} x1={200 + Math.cos(a) * 140} y1={200 + Math.sin(a) * 140} x2={200 + Math.cos(a) * 155} y2={200 + Math.sin(a) * 155} stroke={C.coral} strokeWidth="0.5" opacity="0.45" />;
        })}
      </g>
      <g style={{ transform: `rotate(${rotation * 1.2}deg)`, transformOrigin: "200px 200px" }}>
        <circle cx="200" cy="200" r="110" fill="none" stroke={C.coral} strokeWidth="0.6" opacity="0.4" />
        <circle cx="200" cy="200" r="95" fill="none" stroke={C.coral} strokeWidth="0.3" opacity="0.25" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={200 + Math.cos(a) * 95} y1={200 + Math.sin(a) * 95} x2={200 + Math.cos(a) * 110} y2={200 + Math.sin(a) * 110} stroke={C.coral} strokeWidth="1" opacity="0.55" />;
        })}
      </g>
      <g style={{ transform: `rotate(${-rotation * 0.3}deg)`, transformOrigin: "200px 200px" }}>
        <polygon points="200,130 260,260 140,260" fill="none" stroke={C.coral} strokeWidth="2" opacity="0.8" style={{ filter: "url(#jg)" }} />
        <polygon points="200,145 250,250 150,250" fill="none" stroke={C.coral} strokeWidth="0.8" opacity="0.35" />
        <polygon points="200,160 240,240 160,240" fill={C.coral} opacity="0.06" />
      </g>
      <circle cx="200" cy="210" r="8" fill={C.coral} opacity="0.15" style={{ filter: "url(#jg)" }} />
      <circle cx="200" cy="210" r="3" fill={C.coral} opacity="0.5" />
    </svg>
  );
}

/* ─── Phase data ────────────────────────────────────────────────── */

const PHASES = [
  { idx: 1, tag: "Query Protocol",   title: "Ask why before you crunch",   IconCmp: Target,      accent: C.coral,  desc: "D.A.R.V.I.S. interrogates your design — what you're comparing, predicting, or relating — then routes through 15+ tests to find the one that fits." },
  { idx: 2, tag: "Data Ingest",      title: "Stream any dataset",          IconCmp: UploadIcon,  accent: C.teal,   desc: "Drop CSV or Excel. Columns are parsed, types detected, missing values flagged, and a live preview rendered for surgical role assignment." },
  { idx: 3, tag: "Diagnostic Scan",  title: "Verify every assumption",     IconCmp: ShieldCheck, accent: C.yellow,  desc: "Before any test runs, D.A.R.V.I.S. sweeps for normality, variance, independence, and outliers. Violations trigger alternative recommendations." },
  { idx: 4, tag: "Compute Core",     title: "Statistical intelligence",    IconCmp: Cpu,         accent: C.purple,  desc: "The core executes the test — t, F, χ², r — derives effect sizes, confidence intervals, and APA write-ups in one atomic pass." },
  { idx: 5, tag: "Transmit Report",  title: "Publish anywhere",            IconCmp: Radio,       accent: C.coral,   desc: "Export as Markdown, CSV, or PNG. Reproducible, versioned, and ready to broadcast to your team or drop into a paper." },
];

const NODE_ANGLES = [
  -Math.PI / 2,
  -Math.PI / 2 + (2 * Math.PI * 1 / 5),
  -Math.PI / 2 + (2 * Math.PI * 2 / 5),
  -Math.PI / 2 + (2 * Math.PI * 3 / 5),
  -Math.PI / 2 + (2 * Math.PI * 4 / 5),
];

/* ─── Phase node on the ring (no label — just the icon) ─────────── */

function PhaseNode({ phase, angle, active, reactorRadius }) {
  const Icon = phase.IconCmp;
  const orbitR = reactorRadius + 36;
  const x = Math.cos(angle) * orbitR;
  const y = Math.sin(angle) * orbitR;

  return (
    <motion.div
      animate={{
        scale: active ? 1 : 0.55,
        opacity: active ? 1 : 0.3,
      }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      {/* node */}
      <div style={{
        width: 50, height: 50,
        border: `1.5px solid ${active ? phase.accent : C.border}`,
        background: active ? `${phase.accent}22` : `${C.panel}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        boxShadow: active ? `0 0 30px ${phase.accent}66, inset 0 0 14px ${phase.accent}18` : "none",
        transition: "box-shadow 0.5s, border-color 0.5s, background 0.5s",
      }}>
        <Icon size={20} color={active ? phase.accent : C.muted} strokeWidth={1.5} />
      </div>

      {/* phase number below node */}
      <div style={{
        textAlign: "center", marginTop: 6,
        fontFamily: "JetBrains Mono, monospace", fontSize: 8,
        color: active ? phase.accent : C.muted,
        letterSpacing: "0.16em",
        transition: "color 0.5s",
      }}>
        {String(phase.idx).padStart(2, "0")}
      </div>

      {/* pulse ring */}
      {active && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute", top: 0, left: 0, width: 50, height: 50,
            border: `1px solid ${phase.accent}`,
            clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
}

/* ─── Side panel showing the currently-activating phase ──────────── */

function PhaseSidePanel({ activeIdx }) {
  const phase = activeIdx >= 0 && activeIdx < 5 ? PHASES[activeIdx] : null;

  return (
    <div style={{
      position: "absolute",
      right: 0, top: "50%", transform: "translateY(-50%)",
      width: "min(420px, 32vw)",
      minHeight: 300,
      display: "flex", alignItems: "center",
    }}>
      <AnimatePresence mode="wait">
        {phase && activeIdx < 5 && (
          <motion.div
            key={phase.idx}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              width: "100%",
              padding: "32px 28px",
              background: `linear-gradient(180deg, ${C.panel}ee, ${C.deep}ee)`,
              border: `1px solid ${phase.accent}55`,
              clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
              boxShadow: `0 0 50px ${phase.accent}22, inset 0 0 0 1px ${phase.accent}10`,
            }}
          >
            {/* scanline */}
            <motion.div
              initial={{ top: "-20%" }}
              animate={{ top: "120%" }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${phase.accent}, transparent)`,
                boxShadow: `0 0 10px ${phase.accent}`,
                pointerEvents: "none",
              }}
            />

            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10,
              color: phase.accent, letterSpacing: "0.22em", marginBottom: 10,
            }}>
              {`>> PHASE_${String(phase.idx).padStart(2, "0")} · INITIALIZING`}
            </div>

            {/* big phase number */}
            <div style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: 72, fontWeight: 800, lineHeight: 0.85,
              color: phase.accent + "15",
              position: "absolute", top: 20, right: 24,
              pointerEvents: "none",
            }}>
              0{phase.idx}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative" }}>
              <div style={{
                width: 48, height: 48,
                border: `1px solid ${phase.accent}66`,
                background: `${phase.accent}14`,
                display: "flex", alignItems: "center", justifyContent: "center",
                clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                boxShadow: `0 0 16px ${phase.accent}33 inset`,
              }}>
                <phase.IconCmp size={24} color={phase.accent} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{
                  fontFamily: "Orbitron, sans-serif", fontSize: 20, fontWeight: 800,
                  color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em",
                  textShadow: `0 0 16px ${phase.accent}44`,
                }}>
                  {phase.tag}
                </div>
                <div style={{
                  fontFamily: "Orbitron, sans-serif", fontSize: 11, fontWeight: 500,
                  color: phase.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4,
                }}>
                  {phase.title}
                </div>
              </div>
            </div>

            <div style={{
              width: "100%", height: 1, marginBottom: 18,
              background: `linear-gradient(90deg, ${phase.accent}66, transparent)`,
            }} />

            <p style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: 15,
              color: C.ink + "cc", lineHeight: 1.7, margin: 0,
              position: "relative",
            }}>
              {phase.desc}
            </p>

            <div style={{
              marginTop: 20,
              fontFamily: "JetBrains Mono, monospace", fontSize: 9,
              color: C.muted, letterSpacing: "0.18em",
            }}>
              {`SUBSYS_${String(phase.idx).padStart(3, "0")} · OPERATIONAL`}
            </div>
          </motion.div>
        )}
        {activeIdx >= 5 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              width: "100%",
              padding: "40px 28px",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11,
              color: C.teal, letterSpacing: "0.3em", marginBottom: 14,
            }}>
              {">> ALL SYSTEMS NOMINAL"}
            </div>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontSize: 32, fontWeight: 800,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
              textShadow: `0 0 30px ${C.coral}66`,
            }}>
              Protocol<br/>Ready
            </div>
            <div style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: 15,
              color: C.muted, marginTop: 14, letterSpacing: "0.06em",
            }}>
              Five phases. Zero wrong tests.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════ */

function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const titleY = 0;
  const titleO = 1;

  return (
    <section ref={ref} style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div
          animate={{ x: [0, -56, 0], y: [0, -64, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <HexGrid opacity={0.04} />
        </motion.div>
      </div>

      <motion.div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5 }}
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.coral, marginBottom: 22, letterSpacing: "0.35em" }}
        >
          {"// MK-II · STARK INDUSTRIES"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: "Orbitron, sans-serif", fontWeight: 800,
            fontSize: "clamp(54px, 11vw, 160px)", lineHeight: 0.9,
            color: C.ink, margin: 0, letterSpacing: "0.14em",
            textShadow: `0 0 50px ${C.coral}99, 0 0 100px ${C.coral}44`,
          }}
        >
          D.A.<span style={{ color: C.coral }}>R.V.</span>I.S.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 340 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{ height: 1, marginTop: 16, background: `linear-gradient(90deg, transparent, ${C.coral}, transparent)`, boxShadow: `0 0 12px ${C.coral}` }}
        />

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: 26 }}
        >
          {[
            { letter: "D", word: "Data" },
            { letter: "A", word: "Analysis" },
            { letter: "R", word: "Reasoning" },
            { letter: "V", word: "Visualisation" },
            { letter: "I", word: "Intelligence" },
            { letter: "S", word: "System" },
          ].map((item, i) => (
            <motion.div key={item.letter}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                fontFamily: "Orbitron, sans-serif", textTransform: "uppercase",
                letterSpacing: "0.14em", lineHeight: 1.9,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "clamp(18px, 2vw, 26px)", color: C.coral, width: 32, textAlign: "right", textShadow: `0 0 14px ${C.coral}88` }}>
                {item.letter}.
              </span>
              <span style={{ fontWeight: 400, fontSize: "clamp(14px, 1.4vw, 18px)", color: C.ink + "bb" }}>
                {item.word}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          style={{ marginTop: 36, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Btn onClick={() => navigate("/questionnaire")}><Play size={14} strokeWidth={2.5} /> Initiate Protocol</Btn>
          <Btn color={C.navy} outline onClick={() => window.open("http://localhost:8000/docs", "_blank")}>
            <ArrowRight size={14} /> System Docs
          </Btn>
        </motion.div>
      </motion.div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE RING — pinned reactor, nodes light up, side panel swaps
   ═══════════════════════════════════════════════════════════════════ */

function PhaseRingSection({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const sectionRef = useRef(null);

  // Lock the page when this section is in view
  const wasExitedDown = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !locked) {
          setLocked(true);
          if (wasExitedDown.current) {
            setProgress(1);
            wasExitedDown.current = false;
          }
        }
      },
      { threshold: 0.9 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [locked]);

  // Lock body scroll when reactor is active
useEffect(() => {
    document.body.style.overflow = locked ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [locked]);

  // Capture wheel events to drive progress
  const atZeroRef = useRef(false);
  useEffect(() => {
    if (!locked) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0005;
      setProgress(prev => {
        const next = Math.max(0, Math.min(1, prev + delta));
        // Forward exit: unlock when done
        if (next >= 1 && delta > 0) { atZeroRef.current = false; wasExitedDown.current = true; setLocked(false); return 1; }
        // Backward: first scroll-up at 0 sets flag, second one unlocks
        if (next <= 0 && delta < 0) {
          if (atZeroRef.current) { setLocked(false); return 0; }
          atZeroRef.current = true;
          return 0;
        }
        atZeroRef.current = false;
        return next;
      });
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [locked]);

  // Also handle touch for mobile
  const lastTouchY = useRef(0);
  useEffect(() => {
    if (!locked) return;
    const handleTouchStart = (e) => { lastTouchY.current = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      e.preventDefault();
      const delta = (lastTouchY.current - e.touches[0].clientY) * 0.002;
      lastTouchY.current = e.touches[0].clientY;
      setProgress(prev => {
        const next = Math.max(0, Math.min(1, prev + delta));
        if (next >= 1 && delta > 0) setLocked(false);
        if (next <= 0 && delta < 0) setLocked(false);
        return next;
      });
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [locked]);

  // Phase logic
  const phaseEach = 0.17;
  const activatedCount = Math.min(5, Math.max(0,
    Math.floor(progress / phaseEach) + (progress > 0.01 ? 1 : 0)
  ));
  const currentPhaseIdx = activatedCount > 0 ? activatedCount - 1 : -1;
  const allDone = progress >= 1;
  const reactorRot = progress * 720;
  const reactorSize = Math.min(580, Math.max(360, typeof window !== "undefined" ? Math.min(window.innerWidth * 0.38, window.innerHeight * 0.6) : 480));
  const reactorRadius = reactorSize / 2;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100vh",
        overflow: "visible",
      }}
    >
      {/* two-column layout */}
      <div style={{
        display: "flex", alignItems: "center",
        width: "100%", maxWidth: 1400,
        padding: "0 5%",
        position: "absolute",
        top: "50%",
        left: "60%",
        transform: "translate(-50%, -50%)",
      }}>
        {/* LEFT: reactor + nodes + progress (vertical stack) */}
        <div style={{
          flex: "0 0 55%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{ position: "relative", pointerEvents: "none" }}>
            <JarvisReactor size={reactorSize} rotation={reactorRot} />

            {PHASES.map((p, i) => (
              <PhaseNode
                key={p.idx}
                phase={p}
                angle={NODE_ANGLES[i]}
                active={i < activatedCount}
                reactorRadius={reactorRadius}
              />
            ))}
          </div>

          {/* progress dots — right below the reactor + orbit nodes */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 14, marginTop: 80,
            fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            letterSpacing: "0.18em", color: C.muted,
          }}>
            {PHASES.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                color: i < activatedCount ? p.accent : C.muted,
                transition: "color 0.4s",
              }}>
                <motion.div
                  animate={{
                    background: i < activatedCount ? p.accent : C.border,
                    boxShadow: i < activatedCount ? `0 0 8px ${p.accent}` : "none",
                  }}
                  transition={{ duration: 0.4 }}
                  style={{ width: 6, height: 6, borderRadius: "50%" }}
                />
                {String(i + 1).padStart(2, "0")}
              </div>
            ))}
            <span style={{ color: allDone ? C.teal : C.coral, marginLeft: 6 }}>
              {activatedCount === 0 ? "STANDBY" : allDone ? "ALL SYSTEMS GO" : `PHASE_${String(activatedCount).padStart(2, "0")}_ACTIVE`}
            </span>
          </div>
        </div>

        {/* RIGHT: side panel */}
        <div style={{ flex: "0 0 45%", position: "relative", minHeight: 400 }}>
          <PhaseSidePanel activeIdx={allDone ? 5 : currentPhaseIdx} />
        </div>
      </div>

      {/* scroll hint when not started */}
      {progress < 0.01 && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)",
            fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            color: C.coral, letterSpacing: "0.25em",
          }}
        >
          <ChevronDown size={16} color={C.coral} style={{ display: "block", margin: "0 auto 4px" }} />
          SCROLL TO ACTIVATE PHASES
        </motion.div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════════════════════ */

function CTASection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <section ref={ref} style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div style={{ position: "relative", textAlign: "center", opacity, y, zIndex: 1 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.coral, letterSpacing: "0.3em", marginBottom: 18 }}>
          {">> SYSTEM READY"}
        </div>
        <h2 style={{
          fontFamily: "Orbitron, sans-serif", fontSize: "clamp(40px, 6vw, 86px)",
          fontWeight: 800, color: C.ink, margin: 0,
          textTransform: "uppercase", letterSpacing: "0.08em",
          textShadow: `0 0 40px ${C.coral}99`,
        }}>
          Engage<br/>Protocol
        </h2>
        <p style={{
          fontFamily: "Rajdhani, sans-serif", fontSize: 18,
          color: C.ink + "aa", maxWidth: 540,
          margin: "20px auto 0", letterSpacing: "0.06em", lineHeight: 1.6,
        }}>
          Your data is waiting. Five phases. Zero wrong tests.
        </p>
        <div style={{ marginTop: 36 }}>
          <Btn onClick={() => navigate("/questionnaire")} style={{ padding: "16px 36px", fontSize: 14 }}>
            <Play size={16} strokeWidth={2.5} /> Initiate Protocol
          </Btn>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LANDING ROOT
   ═══════════════════════════════════════════════════════════════════ */

export default function Landing() {
  return (
    <div style={{ position: "relative", zIndex: 1, margin: "-56px -24px 0" }}>
      <HeroSection />
      <PhaseRingSection />
      <CTASection />
    </div>
  );
}
