import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Play } from "lucide-react";
import {
  ParallaxBackdrop, ScanOverlay, BootSequence, SystemStatus,
  Btn, StepBar, C, FONTS_CSS,
} from "./ui.jsx";

const ROUTE_TO_STEP = {
  "/":              null,
  "/questionnaire": 0,
  "/upload":        1,
  "/assumptions":   2,
  "/analysis":      3,
  "/visualisation": 3,
  "/report":        4,
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const step = ROUTE_TO_STEP[location.pathname];
  const isLanding = location.pathname === "/";
  const [booted, setBooted] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("datawise_booted") === "1";
  });

  const finishBoot = () => {
    sessionStorage.setItem("datawise_booted", "1");
    setBooted(true);
  };

  return (
    <>
      <style>{FONTS_CSS}</style>

      {!booted && <BootSequence onComplete={finishBoot} />}

      <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden", background: C.deep }}>
        <ParallaxBackdrop />
        <ScanOverlay />

        {/* Top nav bar */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)",
          background: `${C.deep}ee`,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 32px", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            }}
          >
            <div style={{
              position: "relative", width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `1px dashed ${C.coral}`,
                  boxShadow: `0 0 12px ${C.coral}66`,
                }}
              />
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: C.coral,
                boxShadow: `0 0 12px ${C.coral}`,
              }} />
            </div>
            <div>
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontWeight: 800, fontSize: 18,
                color: C.ink, letterSpacing: "0.16em",
                textShadow: `0 0 14px ${C.coral}66`,
              }}>
                D.A.<span style={{ color: C.coral }}>R.V.</span>I.S.
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                color: C.muted, letterSpacing: "0.22em", marginTop: 1,
              }}>
                MK-II · ANALYSIS CORE
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: { xs: "none" } }}>
              <SystemStatus />
            </div>
            {isLanding
              ? <Btn onClick={() => navigate("/questionnaire")}><Play size={14} strokeWidth={2} /> Engage</Btn>
              : <Btn color={C.navy} outline onClick={() => navigate("/")}><Home size={14} strokeWidth={2} /> Home</Btn>
            }
          </div>
        </nav>

        <main style={{ position: "relative", zIndex: 1, padding: "56px 24px 120px" }}>
          {step !== null && step !== undefined && <StepBar current={step} onNavigate={(path) => navigate(path)} />}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
