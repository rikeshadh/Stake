import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  RefreshCw,
  Zap,
  BrainCircuit,
} from "lucide-react";
import Markdown from "react-markdown";

export function GeminiStrategySidebar({
  isOpen,
  onClose,
  strategy = "dip_buyer",
  profile = "balanced",
  user,
  onTriggerScan,
  darkMode = false,
}) {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1mo");

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/strategy-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          profile,
          timeframe,
          email: user?.email || "trader@stake.com",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data);
      }
    } catch (err) {
      console.error("Failed to load Gemini strategy analysis:", err);
    } finally {
      setLoading(false);
    }
  }, [strategy, profile, timeframe, user]);

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      const load = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/agent/strategy-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              strategy,
              profile,
              timeframe,
              email: user?.email || "trader@stake.com",
            }),
          });
          const data = await res.json();
          if (!ignore && data.success) {
            setAnalysisData(data);
          }
        } catch (err) {
          if (!ignore) {
            console.error("Failed to load Gemini strategy analysis:", err);
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };
      load();
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, strategy, profile, timeframe, user]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
              zIndex: 998,
            }}
          />

          {/* Slideover Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxWidth: 480,
              background: darkMode ? "#0f172a" : "#ffffff",
              color: darkMode ? "#f8fafc" : "#0f172a",
              zIndex: 999,
              boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.18)",
              display: "flex",
              flexDirection: "column",
              borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: darkMode ? "#111c2e" : "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>
                      Gemini Strategy Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "#10b981",
                        color: "#ffffff",
                      }}
                    >
                      3.7 FLASH
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0, marginTop: 2 }}>
                    Daily quantitative strategy analysis & benchmark alpha
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={fetchAnalysis}
                  disabled={loading}
                  title="Refresh AI Analysis"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RefreshCw size={15} className={loading ? "animate-spin text-emerald-500" : ""} />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Timeframe Selector & Strategy Pill */}
            <div
              style={{
                padding: "12px 24px",
                background: darkMode ? "#141e30" : "#ffffff",
                borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
                  {profile} Profile
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: darkMode ? "#cbd5e1" : "#475569" }}>
                  {strategy.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                {["1mo", "3mo", "1y"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setTimeframe(tf);
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      background: timeframe === tf ? "#10b981" : darkMode ? "#1e293b" : "#f1f5f9",
                      color: timeframe === tf ? "#ffffff" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Scrollable Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 280,
                    gap: 16,
                    color: "#64748b",
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      border: "3px solid rgba(16, 185, 129, 0.2)",
                      borderTopColor: "#10b981",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: darkMode ? "#f8fafc" : "#0f172a" }}>
                      Synthesizing Market Intelligence...
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Benchmarking against S&P 500 order flow with Gemini 3.7 Flash
                    </div>
                  </div>
                </div>
              ) : analysisData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* KPI Metric Strip */}
                  {analysisData.metrics && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 10px",
                          borderRadius: 14,
                          background: darkMode ? "#1e293b" : "#f8fafc",
                          border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Alpha vs S&P 500
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: "#10b981",
                            marginTop: 3,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {analysisData.metrics.alphaVsSpy}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px 10px",
                          borderRadius: 14,
                          background: darkMode ? "#1e293b" : "#f8fafc",
                          border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Sharpe Ratio
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: darkMode ? "#f8fafc" : "#0f172a",
                            marginTop: 3,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {analysisData.metrics.sharpeRatio}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px 10px",
                          borderRadius: 14,
                          background: darkMode ? "#1e293b" : "#f8fafc",
                          border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Max Drawdown
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: "#059669",
                            marginTop: 3,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {analysisData.metrics.maxDrawdown}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Markdown Content */}
                  <div
                    style={{
                      padding: "18px 20px",
                      borderRadius: 16,
                      background: darkMode ? "#131f33" : "#f8fafc",
                      border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      color: darkMode ? "#cbd5e1" : "#334155",
                    }}
                  >
                    <div className="markdown-body prose prose-sm max-w-none">
                      <Markdown>{analysisData.analysis}</Markdown>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <button
                    onClick={() => {
                      onTriggerScan?.();
                      onClose?.();
                    }}
                    style={{
                      padding: "14px 20px",
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 6px 20px rgba(16, 185, 129, 0.25)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Zap size={16} />
                    <span>Apply AI Strategy Guidance & Scan</span>
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <p>Click below to generate an AI strategy breakdown.</p>
                  <button
                    onClick={fetchAnalysis}
                    style={{
                      marginTop: 12,
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Generate Analysis
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
