import { motion, AnimatePresence } from "framer-motion";
import { C } from "./ui.jsx";

/*
  DecisionTreeViz — visual decision tree that grows as answers come in.

  Props:
    steps        : [{ key, label }]          metadata for each node
    values       : { [key]: string|number }  current answers (label -> value)
    activeIndex  : number                    index of the "current" node (pulsing)
    width        : number                    svg width (default 340)
    labelFor     : (key, value) => string    optional formatter for the value label
*/

const NODE_R      = 14;
const NODE_GAP    = 96;
const LEFT_PAD    = 60;
const LABEL_PAD_X = 26;

function formatValue(v) {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "YES" : "NO";
  return String(v).toUpperCase().replace(/_/g, " ");
}

export default function DecisionTreeViz({
  steps,
  values = {},
  activeIndex = 0,
  width = 340,
  labelFor,
}) {
  const height = LEFT_PAD + (steps.length) * NODE_GAP + 30;
  const cx = 46;

  return (
    <div style={{
      position: "relative",
      padding: "22px 20px 14px",
      background: `linear-gradient(180deg, ${C.panel}cc 0%, ${C.deep}cc 100%)`,
      border: `1px solid ${C.border}`,
      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      boxShadow: `inset 0 0 0 1px ${C.coral}12, 0 0 40px ${C.coral}08`,
      overflow: "hidden",
    }}>
      {/* scan grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35,
        backgroundImage:
          `linear-gradient(0deg, ${C.coral}0c 1px, transparent 1px),
           linear-gradient(90deg, ${C.coral}0c 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }} />

      {/* header */}
      <div style={{
        position: "relative",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, color: C.coral,
        letterSpacing: "0.22em",
        marginBottom: 12,
        display: "flex", justifyContent: "space-between",
      }}>
        <span>{">> DECISION_TREE.LIVE"}</span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ color: C.teal }}
        >● ACTIVE</motion.span>
      </div>

      <svg width={width} height={height} style={{ display: "block" }}>
        <defs>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Root node */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <circle cx={cx} cy={28} r={NODE_R + 6} fill={C.coral} opacity={0.08} />
          <circle cx={cx} cy={28} r={NODE_R} fill="none" stroke={C.coral} strokeWidth={1.2} />
          <circle cx={cx} cy={28} r={NODE_R - 4} fill={C.coral} opacity={0.3} />
          <circle cx={cx} cy={28} r={3} fill={C.coral} style={{ filter: "url(#nodeGlow)" }} />
          <text
            x={cx + LABEL_PAD_X} y={24}
            fontSize={10} fill={C.muted}
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.14em"
          >
            {"[ ROOT ]"}
          </text>
          <text
            x={cx + LABEL_PAD_X} y={38}
            fontSize={11} fill={C.ink}
            fontFamily="Orbitron, sans-serif"
            fontWeight={600}
            letterSpacing="0.08em"
          >
            QUERY INITIATED
          </text>
        </motion.g>

        {/* Step nodes */}
        {steps.map((step, i) => {
          const parentY = 28 + i * NODE_GAP;
          const y = 28 + (i + 1) * NODE_GAP;
          const answered = values[step.key] !== undefined && values[step.key] !== "";
          const isActive = i === activeIndex;
          const isFuture = !answered && !isActive;
          const nodeColor = answered ? C.teal : isActive ? C.coral : C.border;

          const valueLabel = answered
            ? (labelFor ? labelFor(step.key, values[step.key]) : formatValue(values[step.key]))
            : isActive ? "AWAITING INPUT" : "—";

          return (
            <g key={step.key}>
              {/* connecting path */}
              <motion.path
                d={`M ${cx} ${parentY + NODE_R} L ${cx} ${y - NODE_R}`}
                stroke={answered ? C.teal : isActive ? C.coral : C.border}
                strokeWidth={1.5}
                fill="none"
                strokeDasharray={answered ? "0" : "4 4"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: answered || isActive ? 1 : 0.4 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ filter: answered ? `drop-shadow(0 0 4px ${C.teal})` : "none" }}
              />

              {/* tick marks on line */}
              {answered && (
                <>
                  <line x1={cx - 4} y1={parentY + NODE_R + 12} x2={cx + 4} y2={parentY + NODE_R + 12} stroke={C.teal} strokeWidth={1} opacity={0.6} />
                  <line x1={cx - 4} y1={parentY + NODE_R + 24} x2={cx + 4} y2={parentY + NODE_R + 24} stroke={C.teal} strokeWidth={1} opacity={0.4} />
                </>
              )}

              {/* node outer ring + pulse when active */}
              {isActive && (
                <motion.circle
                  cx={cx} cy={y} r={NODE_R + 10}
                  fill="none" stroke={C.coral} strokeWidth={1}
                  animate={{
                    r: [NODE_R + 6, NODE_R + 14, NODE_R + 6],
                    opacity: [0.8, 0, 0.8],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              <motion.circle
                cx={cx} cy={y} r={NODE_R + 4}
                fill={nodeColor} opacity={0.08}
                initial={{ scale: 0 }}
                animate={{ scale: answered || isActive ? 1 : 0.8 }}
                transition={{ duration: 0.4 }}
              />

              <motion.circle
                cx={cx} cy={y} r={NODE_R}
                fill="none"
                stroke={nodeColor}
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isFuture ? 0.4 : 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />

              <AnimatePresence mode="wait">
                {answered ? (
                  <motion.g key="filled" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <circle cx={cx} cy={y} r={NODE_R - 5} fill={C.teal} style={{ filter: "url(#nodeGlow)" }} />
                    <path
                      d={`M ${cx - 4} ${y} L ${cx - 1} ${y + 3} L ${cx + 5} ${y - 4}`}
                      stroke={C.deep} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </motion.g>
                ) : isActive ? (
                  <motion.text
                    key="active"
                    x={cx} y={y + 4}
                    fontSize={14} fontWeight={700}
                    fill={C.coral} textAnchor="middle"
                    fontFamily="Orbitron, sans-serif"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    ?
                  </motion.text>
                ) : (
                  <motion.text
                    key="idle"
                    x={cx} y={y + 4}
                    fontSize={12}
                    fill={C.border} textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.text>
                )}
              </AnimatePresence>

              {/* Label block */}
              <motion.g
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isFuture ? 0.35 : 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <text
                  x={cx + LABEL_PAD_X} y={y - 6}
                  fontSize={9} fill={C.muted}
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.18em"
                >
                  {`[ NODE_${String(i + 1).padStart(2, "0")} ]`}
                </text>
                <text
                  x={cx + LABEL_PAD_X} y={y + 7}
                  fontSize={11} fill={C.ink}
                  fontFamily="Orbitron, sans-serif"
                  fontWeight={600}
                  letterSpacing="0.06em"
                >
                  {step.label.toUpperCase()}
                </text>
                <text
                  x={cx + LABEL_PAD_X} y={y + 20}
                  fontSize={9}
                  fill={answered ? C.teal : isActive ? C.coral : C.muted}
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.14em"
                >
                  {valueLabel}
                </text>
              </motion.g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
