import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  RefreshCw,
  Zap,
  BrainCircuit,
  Send,
  MessageSquare,
  BarChart2,
  Bot,
  Sparkles,
} from "lucide-react";
import Markdown from "react-markdown";
import { fetchStrategyAnalysis, sendAgentChat } from "../api";

const API_URL = import.meta.env.VITE_API_URL || "";

const TOOL_LABELS = {
  place_order: "Order Executed",
  set_alert: "Alert Created",
  get_portfolio: "Portfolio Checked",
  get_stock_price: "Live Quote Fetched",
  get_price_history: "Price History Loaded",
  analyze_holding: "Holding Analyzed",
};

const SUGGESTIONS = [
  "What's my portfolio worth?",
  "Analyze NVDA",
  "Should I buy the dip on TSLA?",
  "How diversified am I?",
];

export function GeminiStrategySidebar({
  isOpen,
  onClose,
  strategy = "dip_buyer",
  profile = "balanced",
  user,
  onTriggerScan,
}) {
  const [tab, setTab] = useState("chat");

  // ----- Chat state -----
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // ----- Analysis state -----
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1mo");

  const targetEmail = user?.email || "trader@stake.com";

  const fetchAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const data = await fetchStrategyAnalysis({ email: targetEmail, strategy, profile, timeframe });
      if (data.success) setAnalysisData(data);
    } catch (err) {
      console.error("Failed to load Gemini strategy analysis:", err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [targetEmail, strategy, profile, timeframe]);

  // Load analysis when its tab is opened
  useEffect(() => {
    if (isOpen && tab === "analysis") {
      fetchAnalysis();
    }
  }, [isOpen, tab, fetchAnalysis]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, tab]);

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? chatInput).trim();
      if (!message || sending) return;
      setChatInput("");
      setSending(true);
      const history = messages.map((m) => ({ sender: m.role === "user" ? "user" : "model", text: m.text }));
      setMessages((prev) => [...prev, { role: "user", text: message }]);
      try {
        const data = await sendAgentChat({ email: targetEmail, message, history });
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.reply, tools: data.toolCalls || [] },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: err.message || "I could not process that request. Please try again.", error: true },
        ]);
      } finally {
        setSending(false);
      }
    },
    [chatInput, sending, messages, targetEmail]
  );

  const resetChat = () => setMessages([]);

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
              inset: 0,
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
              background: "#ffffff",
              color: "#0f172a",
              zIndex: 999,
              boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.18)",
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid #e2e8f0",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
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
                    <h3 style={{ fontSize: 15.5, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>
                      AI Insights Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "#10b981",
                        color: "#ffffff",
                      }}
                    >
                      GEMINI 2.5 FLASH
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, marginTop: 2 }}>
                    Chat with your portfolio • analysis • live execution
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                title="Close"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 24px",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
              }}
            >
              <button
                onClick={() => setTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  tab === "chat"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200"
                }`}
              >
                <MessageSquare size={13} />
                Copilot Chat
              </button>
              <button
                onClick={() => setTab("analysis")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  tab === "analysis"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200"
                }`}
              >
                <BarChart2 size={13} />
                Daily Analysis
              </button>
              {tab === "chat" && messages.length > 0 && (
                <button
                  onClick={resetChat}
                  title="Clear conversation"
                  className="ml-auto p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

            {/* ================= CHAT TAB ================= */}
            {tab === "chat" && (
              <>
                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: 28 }}>
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          margin: "0 auto 14px",
                          borderRadius: 16,
                          background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(20,184,166,0.2))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#059669",
                        }}
                      >
                        <Sparkles size={26} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>Your personal trading copilot</div>
                      <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 6, lineHeight: 1.55 }}>
                        Ask about your portfolio, analyze any stock, place trades by voice of command, or create
                        price alerts — all in natural language.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="text-left px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {messages.map((m, i) =>
                        m.role === "user" ? (
                          <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                            <div
                              style={{
                                maxWidth: "85%",
                                background: "linear-gradient(135deg, #059669, #047857)",
                                color: "#ffffff",
                                padding: "10px 14px",
                                borderRadius: "16px 16px 4px 16px",
                                fontSize: 13,
                                lineHeight: 1.5,
                                fontWeight: 500,
                              }}
                            >
                              {m.text}
                            </div>
                          </div>
                        ) : (
                          <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                            <div style={{ maxWidth: "92%" }}>
                              {m.tools?.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                                  {m.tools.map((t, ti) => (
                                    <span
                                      key={ti}
                                      className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    >
                                      <Zap size={9} />
                                      {TOOL_LABELS[t.name] || t.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div
                                style={{
                                  background: m.error ? "#fef2f2" : "#f8fafc",
                                  border: `1px solid ${m.error ? "#fecaca" : "#e2e8f0"}`,
                                  padding: "10px 14px",
                                  borderRadius: "16px 16px 16px 4px",
                                  fontSize: 13,
                                  lineHeight: 1.6,
                                  color: "#334155",
                                }}
                                className="markdown-body prose prose-sm max-w-none"
                              >
                                <Markdown>{m.text}</Markdown>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {sending && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#059669" }}>
                          <Bot size={16} className="animate-pulse" />
                          <span className="text-xs font-bold text-slate-400">Analyzing market data...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    padding: "12px 24px 16px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask anything... e.g. 'Buy $500 of NVDA'"
                      disabled={sending}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-emerald-500 disabled:opacity-60"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={sending || !chatInput.trim()}
                      className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                      aria-label="Send message"
                    >
                      {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ================= ANALYSIS TAB ================= */}
            {tab === "analysis" && (
              <>
                {/* Strategy pill + Timeframe selector */}
                <div
                  style={{
                    padding: "12px 24px",
                    borderBottom: "1px solid #f1f5f9",
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                      {strategy.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["1mo", "3mo", "1y"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            background: timeframe === tf ? "#10b981" : "#f1f5f9",
                            color: timeframe === tf ? "#ffffff" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {tf.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={fetchAnalysis}
                      disabled={analysisLoading}
                      title="Refresh AI Analysis"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RefreshCw size={14} className={analysisLoading ? "animate-spin text-emerald-500" : ""} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {analysisLoading ? (
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
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                          Synthesizing Market Intelligence...
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          Benchmarking against S&P 500 order flow with Gemini 2.5 Flash
                        </div>
                      </div>
                    </div>
                  ) : analysisData ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {/* KPI Metric Strip */}
                      {analysisData.metrics && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Alpha vs S&P 500", value: analysisData.metrics.alphaVsSpy, color: "#10b981" },
                            { label: "Sharpe Ratio", value: analysisData.metrics.sharpeRatio, color: "#0f172a" },
                            { label: "Max Drawdown", value: analysisData.metrics.maxDrawdown, color: "#059669" },
                          ].map((kpi) => (
                            <div
                              key={kpi.label}
                              style={{
                                padding: "12px 10px",
                                borderRadius: 14,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                textAlign: "center",
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                {kpi.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 900,
                                  color: kpi.color,
                                  marginTop: 3,
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                {kpi.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Analysis Markdown Content */}
                      <div
                        style={{
                          padding: "18px 20px",
                          borderRadius: 16,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: 13.5,
                          lineHeight: 1.65,
                          color: "#334155",
                        }}
                        className="markdown-body prose prose-sm max-w-none"
                      >
                        <Markdown>{analysisData.analysis}</Markdown>
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
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
