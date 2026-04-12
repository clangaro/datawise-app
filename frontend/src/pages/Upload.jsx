import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import toast from "react-hot-toast";
import {
  UploadCloud, FileSpreadsheet, ArrowLeft, ArrowRight, RefreshCw,
  Activity, Database, Hash, AlertTriangle,
} from "lucide-react";
import { Card, Btn, Pill, Select, Spinner, SectionTitle, C } from "../components/ui.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { uploadFile } from "../api/client.js";

function ColumnSummaryCard({ col, index }) {
  const isNumeric = col.mean !== undefined;
  const missingColor = col.pct_missing > 20 ? C.red : col.pct_missing > 5 ? C.yellow : C.teal;
  const accent = isNumeric ? C.teal : C.purple;
  const missingRatio = Math.min(col.pct_missing / 100, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{
        borderColor: accent,
        boxShadow: `0 0 24px ${accent}33, inset 0 0 0 1px ${accent}44`,
        y: -3,
      }}
      style={{
        position: "relative",
        padding: "18px 20px",
        border: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.deep} 100%)`,
        clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
        boxShadow: `inset 0 0 0 1px ${accent}10, 0 4px 20px #0008`,
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* scan grid bg */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.12,
        backgroundImage:
          `linear-gradient(0deg, ${accent}0a 1px, transparent 1px),
           linear-gradient(90deg, ${accent}0a 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
      }} />

      {/* scan sweep on mount */}
      <motion.div
        initial={{ top: "-20%", opacity: 0 }}
        animate={{ top: "120%", opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.2, delay: index * 0.06 + 0.2 }}
        style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          boxShadow: `0 0 10px ${accent}`,
          pointerEvents: "none",
        }}
      />

      {/* corner brackets */}
      <div style={{ position: "absolute", top: 0, left: 0,   width: 10, height: 10, borderLeft: `1px solid ${accent}`, borderTop: `1px solid ${accent}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, right: 0,  width: 10, height: 10, borderRight: `1px solid ${accent}`, borderTop: `1px solid ${accent}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 10, height: 10, borderLeft: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRight: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, pointerEvents: "none" }} />

      {/* content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* header: name + dtype pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 9,
              color: C.muted, letterSpacing: "0.2em", marginBottom: 4,
            }}>
              {`FIELD_${String(index + 1).padStart(2, "0")}`}
            </div>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13,
              color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {col.name}
            </div>
          </div>
          <Pill color={accent}>{col.dtype}</Pill>
        </div>

        {/* stats row */}
        <div style={{
          display: "flex", gap: 16, marginBottom: isNumeric ? 14 : 0,
          fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.1em",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Hash size={10} color={C.muted} strokeWidth={1.6} />
            <span style={{ color: C.ink }}>{col.n_unique}</span>
            <span style={{ color: C.muted }}>UNIQUE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {col.pct_missing > 5 && <AlertTriangle size={10} color={missingColor} strokeWidth={1.6} />}
            <span style={{ color: missingColor, fontWeight: 600 }}>{col.pct_missing}%</span>
            <span style={{ color: C.muted }}>MISSING</span>
          </div>
        </div>

        {/* missing bar */}
        <div style={{
          height: 3, background: C.border, marginBottom: isNumeric ? 14 : 0,
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(missingRatio * 100, 2)}%` }}
            transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
            style={{
              height: "100%",
              background: missingColor,
              boxShadow: `0 0 8px ${missingColor}`,
            }}
          />
        </div>

        {/* numeric stats */}
        {isNumeric && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          }}>
            <div style={{
              padding: "8px 10px",
              background: `${accent}08`,
              border: `1px dashed ${accent}33`,
              clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
            }}>
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontSize: 15, fontWeight: 700,
                color: accent, textShadow: `0 0 10px ${accent}44`,
                letterSpacing: "0.04em",
              }}>
                <CountUp target={col.mean} decimals={2} delay={index * 0.06 + 0.4} />
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 8,
                color: C.muted, letterSpacing: "0.18em", marginTop: 2,
              }}>MEAN (μ)</div>
            </div>
            <div style={{
              padding: "8px 10px",
              background: `${accent}08`,
              border: `1px dashed ${accent}33`,
              clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
            }}>
              <div style={{
                fontFamily: "Orbitron, sans-serif", fontSize: 15, fontWeight: 700,
                color: accent, textShadow: `0 0 10px ${accent}44`,
                letterSpacing: "0.04em",
              }}>
                <CountUp target={col.std} decimals={2} delay={index * 0.06 + 0.5} />
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 8,
                color: C.muted, letterSpacing: "0.18em", marginTop: 2,
              }}>STD DEV (σ)</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CountUp({ target, decimals = 2, delay = 0, duration = 1.2 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const delayMs = delay * 1000;
    let raf;
    const step = (now) => {
      const elapsed = now - start - delayMs;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, delay, duration]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

export default function Upload() {
  const navigate = useNavigate();
  const { profile, fileData, columnRoles, setFileData, setColumnRoles } = useAnalysis();
  const [loading, setLoading] = useState(false);

  const rqt = profile?.research_question_type;
  const needsGroup = rqt === "comparison";
  const needsIV = rqt === "correlation" || rqt === "prediction";

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await uploadFile(file);
      setFileData(data);
      setColumnRoles({ dv: null, iv: null, group: null, covariates: [] });
      toast.success(`Loaded ${data.filename} — ${data.n_rows} rows × ${data.n_cols} cols`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [setFileData, setColumnRoles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const columns = fileData?.columns ?? [];
  const columnNames = columns.map(c => c.name);

  const canContinue = () => {
    if (!fileData || !columnRoles.dv) return false;
    if (needsGroup && !columnRoles.group) return false;
    if (needsIV && !columnRoles.iv) return false;
    return true;
  };

  const handleContinue = () => {
    if (!canContinue()) {
      toast.error("Assign the required columns first");
      return;
    }
    navigate("/assumptions");
  };

  const toggleCovariate = (name) => {
    const current = columnRoles.covariates || [];
    setColumnRoles({
      covariates: current.includes(name)
        ? current.filter(c => c !== name)
        : [...current, name],
    });
  };

  if (!profile) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20, color: C.ink, marginBottom: 12 }}>
            Complete the questionnaire first.
          </div>
          <Btn onClick={() => navigate("/questionnaire")}>← Back to Questionnaire</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <SectionTitle subtitle="Drop a CSV or Excel file to begin">Upload your data</SectionTitle>

      {!fileData && (
        <Card>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? C.coral : C.border}`,
              borderRadius: 0,
              padding: "60px 32px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragActive ? C.coral + "0a" : C.deep,
              transition: "border 0.2s, background 0.2s",
              clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
            }}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <Spinner size={48} />
                <div style={{
                  fontFamily: "JetBrains Mono, monospace", color: C.coral,
                  fontSize: 11, letterSpacing: "0.2em",
                }}>
                  {">> PARSING DATA STREAM..."}
                </div>
              </div>
            ) : (
              <>
                <UploadCloud size={56} strokeWidth={1.2} color={C.coral} style={{ marginBottom: 14, filter: `drop-shadow(0 0 14px ${C.coral})` }} />
                <div style={{
                  fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 16,
                  color: C.ink, marginBottom: 8,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  {isDragActive ? "Release to Upload" : "Drop Data Stream or Browse"}
                </div>
                <div style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                  color: C.muted, letterSpacing: "0.18em",
                }}>
                  ACCEPTED: .CSV  .XLS  .XLSX  ·  MAX 50MB
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {fileData && (
        <>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileSpreadsheet size={28} color={C.coral} strokeWidth={1.4} />
                <div>
                  <div style={{
                    fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 15,
                    color: C.ink, textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {fileData.filename}
                  </div>
                  <div style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                    color: C.muted, letterSpacing: "0.12em", marginTop: 2,
                  }}>
                    LOADED · READY FOR ANALYSIS
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Pill color={C.teal}>{fileData.n_rows} ROWS</Pill>
                <Pill color={C.purple}>{fileData.n_cols} COLS</Pill>
                <Btn color={C.navy} outline onClick={() => setFileData(null)} style={{ padding: "8px 16px", fontSize: 10 }}>
                  <RefreshCw size={12} /> Replace
                </Btn>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 18,
            }}>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: C.coral, letterSpacing: "0.22em",
              }}>
                {">> COLUMN_ANALYSIS.LIVE"}
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: C.muted, letterSpacing: "0.14em",
              }}>
                {String(columns.length).padStart(2, "0")} FIELDS DETECTED
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {columns.map((col, i) => <ColumnSummaryCard key={col.name} col={col} index={i} />)}
            </div>
          </Card>

          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Assign column roles
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                  Dependent variable (DV) <span style={{ color: C.coral }}>*</span>
                </label>
                <Select
                  value={columnRoles.dv ?? ""}
                  onChange={(v) => setColumnRoles({ dv: v || null })}
                  style={{ width: "100%" }}
                >
                  <option value="">— Select —</option>
                  {columnNames.map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>

              {needsGroup && (
                <div>
                  <label style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                    Grouping variable <span style={{ color: C.coral }}>*</span>
                  </label>
                  <Select
                    value={columnRoles.group ?? ""}
                    onChange={(v) => setColumnRoles({ group: v || null })}
                    style={{ width: "100%" }}
                  >
                    <option value="">— Select —</option>
                    {columnNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </Select>
                </div>
              )}

              {needsIV && (
                <div>
                  <label style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                    Independent variable (IV) <span style={{ color: C.coral }}>*</span>
                  </label>
                  <Select
                    value={columnRoles.iv ?? ""}
                    onChange={(v) => setColumnRoles({ iv: v || null })}
                    style={{ width: "100%" }}
                  >
                    <option value="">— Select —</option>
                    {columnNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </Select>
                </div>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: C.muted, display: "block", marginBottom: 8 }}>
                Covariates (optional)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {columnNames.map(n => {
                  const selected = (columnRoles.covariates || []).includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleCovariate(n)}
                      style={{
                        padding: "6px 14px",
                        clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
                        border: `1px solid ${selected ? C.purple : C.border}`,
                        background: selected ? C.purple + "18" : `${C.panel}`,
                        color: selected ? C.purple : C.muted,
                        fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                        fontWeight: 600, letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: selected ? `0 0 12px ${C.purple}33` : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {selected ? "✓ " : ""}{n}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 20, overflow: "hidden", padding: 0 }}>
            <div style={{
              padding: "18px 28px 10px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: C.coral, letterSpacing: "0.22em",
              }}>
                {">> DATA_PREVIEW.LOG"}
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: C.muted, letterSpacing: "0.14em",
              }}>
                FIRST 10 ROWS
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: `${C.panel}` }}>
                    {columnNames.map(n => (
                      <th key={n} style={{
                        padding: "10px 14px", textAlign: "left",
                        color: C.coral, fontWeight: 500,
                        borderBottom: `1px solid ${C.coral}44`,
                        whiteSpace: "nowrap",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontSize: 9,
                      }}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(fileData.preview || []).slice(0, 10).map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i % 2 === 0 ? "transparent" : `${C.panel}44`,
                    }}>
                      {columnNames.map(n => (
                        <td key={n} style={{ padding: "8px 14px", color: C.ink + "cc", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                          {row[n] === null || row[n] === undefined ? <span style={{ color: C.border }}>NULL</span> : String(row[n])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn color={C.navy} outline onClick={() => navigate("/questionnaire")}>
              <ArrowLeft size={14} /> Back
            </Btn>
            <Btn onClick={handleContinue} disabled={!canContinue()}>
              Proceed <ArrowRight size={14} />
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
