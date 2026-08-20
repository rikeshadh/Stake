import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  Power,
  Sparkles,
  Send,
  CheckCircle2,
  Play,
  RotateCcw,
  History,
  Brain,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCw,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { fmt } from "../utils";

export function AgentTab({
  agentEnabled,
  onToggleAgent,
  agentStrategy,
  onSelectStrategy,
  agentMaxSpend,
  onChangeMaxSpend,
  chatLog = [],
  onSendChatMessage,
  cashBalance,
  user,
  darkMode = false,
  onRefreshUserData,
  showToast,
}) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal"); // "terminal" | "signals" | "audit" | "backtest" | "memory"

  // Audit Actions state
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [revertingId, setRevertingId] = useState(null);

  // Live Signals state (fetched from backend, not fabricated client-side)
  const [signals, setSignals] = useState([]);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [signalsError, setSignalsError] = useState(null);

  // Autonomous Sweep State
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(() => new Date());
  const [nextScanCountdown, setNextScanCountdown] = useState(180); // seconds

  // Agent Memory state
  const [memories, setMemories] = useState([]);
  const [loadingMemory, setLoadingMemory] = useState(false);

  // Backtest Lab state
  const [backtestStrategy, setBacktestStrategy] = useState(agentStrategy || "dip_buyer");
  const [backtestTicker, setBacktestTicker] = useState("NVDA");
  const [backtestTimeframe, setBacktestTimeframe] = useState("3 Months");
  const [backtestCapital, setBacktestCapital] = useState(10000);
  const [backtestResult, setBacktestResult] = useState(null);
  const [backtestError, setBacktestError] = useState(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);

  // Fetch Agent Actions (Audit Trail)
  const fetchActions = useCallback(async () => {
    setLoadingActions(true);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch(`/api/agent/actions?userId=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.actions) {
        setActions(data.actions);
      }
    } catch {
      // ignore - audit trail is non-critical to surface a toast for
    } finally {
      setLoadingActions(false);
    }
  }, [user]);

  // Fetch Agent Memories
  const fetchMemories = useCallback(async () => {
    setLoadingMemory(true);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch(`/api/agent/memory?userId=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.memory) {
        setMemories(data.memory);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMemory(false);
    }
  }, [user]);

  // Fetch Live Signals - real data from the agent engine, not a static mock
  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true);
    setSignalsError(null);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch(`/api/agent/signals?userId=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`Signals request failed (${res.status})`);
      const data = await res.json();
      setSignals(Array.isArray(data.signals) ? data.signals : []);
    } catch (err) {
      setSignalsError(err.message || "Could not reach the signals engine.");
    } finally {
      setLoadingSignals(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchActions();
        await fetchMemories();
        await fetchSignals();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchActions, fetchMemories, fetchSignals]);

  // Handle Send Chat
  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isTyping) return;

    setInputText("");
    setIsTyping(true);

    try {
      await onSendChatMessage(textToSend);
      // Refresh audit logs in case a trade was executed by tool call
      setTimeout(() => {
        fetchActions();
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  // Manual Trigger Autonomous Scan & Execute
  const handleTriggerScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch("/api/agent/scan-and-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email }),
      });
      if (!res.ok) throw new Error(`Scan request failed (${res.status})`);
      const data = await res.json();
      setLastScanTime(new Date());
      setNextScanCountdown(180);
      fetchSignals();
      if (data.status === "executed" || data.status === "action_taken") {
        if (showToast) showToast(`Autonomous Agent executed trade: ${data.message}`);
        if (onRefreshUserData) onRefreshUserData();
        fetchActions();
      } else {
        if (showToast) showToast(`Autonomous scan complete: ${data.message || "Market scanned successfully."}`);
      }
    } catch (err) {
      // Surface the real failure instead of pretending the scan succeeded
      if (showToast) showToast(`Scan failed: ${err.message || "could not reach the agent engine."}`);
    } finally {
      setIsScanning(false);
    }
  }, [user, showToast, onRefreshUserData, fetchActions, fetchSignals]);

  // Countdown timer for next autonomous cron scan - actually triggers a scan at zero
  const scanRef = useRef(handleTriggerScan);
  const isScanningRef = useRef(isScanning);

  useEffect(() => {
    scanRef.current = handleTriggerScan;
    isScanningRef.current = isScanning;
  }, [handleTriggerScan, isScanning]);

  useEffect(() => {
    if (!agentEnabled) return;
    const interval = setInterval(() => {
      setNextScanCountdown((prev) => {
        if (prev <= 1) {
          if (!isScanningRef.current) {
            scanRef.current();
          }
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [agentEnabled]);

  // Revert Trade (Safety Rail 5-min grace period)
  const handleRevertTrade = async (actionId) => {
    setRevertingId(actionId);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch("/api/agent/revert-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email, actionId }),
      });
      const data = await res.json();
      if (data.status === "reverted") {
        if (showToast) showToast(`Trade Reverted: Refunded $${data.refundAmount?.toFixed(2) || "collateral"} to Cash Balance`);
        if (onRefreshUserData) onRefreshUserData();
        fetchActions();
      } else {
        if (showToast) showToast(data.message || "Trade revert completed.");
      }
    } catch {
      if (showToast) showToast("Error connecting to trade revert endpoint.");
    } finally {
      setRevertingId(null);
    }
  };

  // Run Strategy Backtest Simulator
  const handleRunBacktest = async () => {
    setIsRunningBacktest(true);
    setBacktestResult(null);
    setBacktestError(null);
    try {
      const days = backtestTimeframe === "1 Month" ? 30 : backtestTimeframe === "3 Months" ? 90 : 180;
      const res = await fetch("/api/agent/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: backtestStrategy,
          ticker: backtestTicker,
          days,
          initialCapital: backtestCapital,
        }),
      });
      if (!res.ok) throw new Error(`Backtest request failed (${res.status})`);
      const data = await res.json();
      if (data.status === "success" && data.backtest) {
        setBacktestResult(data.backtest);
        if (showToast) showToast(`Backtest complete! Return: ${data.backtest.scorecard.totalReturnPct > 0 ? "+" : ""}${data.backtest.scorecard.totalReturnPct}%`);
      } else {
        throw new Error(data.message || "Backtest engine returned no result.");
      }
    } catch (err) {
      // Show the real failure instead of fabricating a plausible-looking result
      setBacktestError(err.message || "Backtest failed. The strategy engine may be unreachable.");
      if (showToast) showToast("Backtest failed - see details in the lab.");
    } finally {
      setIsRunningBacktest(false);
    }
  };

  const bgCard = darkMode ? "#111827" : "#ffffff";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgItem = darkMode ? "#1a2236" : "#f8fafc";
  const inputBg = darkMode ? "#1a2236" : "#ffffff";

  // Curated quick prompts - a flat, deliberately chosen set instead of a
  // category structure that was never actually surfaced to the user
  const quickPrompts = [
    "What is my most volatile holding?",
    "How diversified is my portfolio?",
    "Buy 5 shares of NVDA at market price",
    "Analyze NVDA order book depth and support levels",
    "Set a price alert for NVDA when it crosses above $145",
  ];

  return (
    <div style={{ paddingTop: 12, textAlign: "left" }}>
      {/* TOP AGENT COMMAND HEADER */}
      <div
        style={{
          borderRadius: 22,
          padding: "24px 28px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          background: agentEnabled
            ? "radial-gradient(circle at 10% 20%, #006c49 0%, #064e3b 100%)"
            : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          boxShadow: agentEnabled ? "0 14px 40px rgba(0,108,73,0.22)" : "0 14px 40px rgba(0,0,0,0.15)",
          border: agentEnabled ? "1px solid rgba(0, 229, 153, 0.35)" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Bot size={28} color="#00e599" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: "#ffffff" }}>
                Stake Autonomous Agent & Intelligence Desk
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: agentEnabled ? "#10b981" : "#64748b",
                  color: "#ffffff",
                  letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff", animation: agentEnabled ? "pulse 2s infinite" : "none" }} />
                {agentEnabled ? "AUTONOMOUS FEED ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "#cbd5e1", margin: "4px 0 0" }}>
              Powered by real-time Gemini function calling, live order book anomaly radar, backtest engine, and 5-min trade revert rails.
            </p>
          </div>
        </div>

        {/* Master Controls & Autonomous Scan Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {agentEnabled && (
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                cursor: isScanning ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontSize: 13,
                backdropFilter: "blur(6px)",
                transition: "all 0.15s ease",
              }}
            >
              <Zap size={14} color="#00e599" />
              {isScanning ? "Scanning Market..." : "Trigger Scan Now"}
            </button>
          )}

          <button
            onClick={() => onToggleAgent(!agentEnabled)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 13.5,
              background: agentEnabled ? "#ffffff" : "#00e599",
              color: agentEnabled ? "#006c49" : "#06110c",
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
              transition: "all 0.18s ease",
            }}
          >
            <Power size={15} />
            {agentEnabled ? "PAUSE AGENT" : "ACTIVATE AGENT"}
          </button>
        </div>
      </div>

      {/* AUTONOMOUS STATUS & AUTO-SCAN TIMER BAR */}
      {agentEnabled && (
        <div
          style={{
            borderRadius: 14,
            padding: "12px 18px",
            marginBottom: 20,
            background: darkMode ? "rgba(0, 108, 73, 0.15)" : "#f0fdf4",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, color: "#006c49" }}>
              <Activity size={15} /> Autonomous Engine:
            </span>
            <span style={{ color: textSecondary }}>
              Active Strategy: <strong style={{ color: textPrimary }}>{agentStrategy === "dip_buyer" ? "Dip Buyer (Tech & Equities)" : agentStrategy === "momentum" ? "Breakout Momentum" : "Disciplined DCA"}</strong>
            </span>
            <span style={{ color: textSecondary }}>•</span>
            <span style={{ color: textSecondary }}>
              Max Allocation: <strong style={{ color: textPrimary }}>${fmt(agentMaxSpend)}</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={13} /> Next Auto-Scan in: <strong style={{ color: "#006c49", fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(nextScanCountdown / 60)}:{(nextScanCountdown % 60).toString().padStart(2, "0")}</strong>
            </span>
            <span style={{ fontSize: 11, color: textSecondary }}>
              (Last scan: {lastScanTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          </div>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: `1px solid ${borderCol}`,
          paddingBottom: 12,
          overflowX: "auto",
        }}
      >
        {[
          { id: "terminal", label: "Agent Chat & Intelligence", icon: <Sparkles size={16} /> },
          { id: "signals", label: `Live AI Signals Radar (${signals.length})`, icon: <Activity size={16} /> },
          { id: "audit", label: `Audit Trail & Revert Rails (${actions.length})`, icon: <History size={16} /> },
          { id: "backtest", label: "Backtest Simulator Lab", icon: <Layers size={16} /> },
          { id: "memory", label: `Market Memory & Reasoning (${memories.length})`, icon: <Brain size={16} /> },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                background: isActive ? "#006c49" : "transparent",
                color: isActive ? "#ffffff" : textSecondary,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TERMINAL & STRATEGY SETTINGS */}
      {activeTab === "terminal" && (
        <>
          {/* Strategy & Risk Controls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Strategy Selection */}
            <div
              style={{
                borderRadius: 20,
                padding: 22,
                background: bgCard,
                border: `1px solid ${borderCol}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#006c49", letterSpacing: "0.08em", marginBottom: 4 }}>
                AUTONOMOUS ENGINE
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: textPrimary, marginBottom: 14 }}>
                Active Algorithmic Strategy
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    id: "dip_buyer",
                    name: "Intelligent Dip Buyer (Recommended)",
                    desc: "Accumulates top equities during intraday dips (>1.2% pullback) with AI valuation & RSI confirmation.",
                    badge: "MODERATE RISK",
                  },
                  {
                    id: "momentum",
                    name: "Volume Breakout Momentum",
                    desc: "Detects surges in bid-ask book depth and executes rapid momentum entry when buy pressure tops 65%.",
                    badge: "AGGRESSIVE",
                  },
                  {
                    id: "dca",
                    name: "Disciplined Value DCA",
                    desc: "Distributes micro-allocations consistently across your custom watchlist equities every session.",
                    badge: "CONSERVATIVE",
                  },
                ].map((st) => {
                  const selected = agentStrategy === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => onSelectStrategy(st.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: `1px solid ${selected ? "#006c49" : borderCol}`,
                        background: selected ? (darkMode ? "rgba(0,108,73,0.2)" : "#f0fdf4") : bgItem,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: selected ? "#006c49" : textPrimary }}>
                          {st.name}
                        </span>
                        {selected && <CheckCircle2 size={16} color="#006c49" />}
                      </div>
                      <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0 0", lineHeight: 1.45 }}>
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk & Safety Limits */}
            <div
              style={{
                borderRadius: 20,
                padding: 22,
                background: bgCard,
                border: `1px solid ${borderCol}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#006c49", letterSpacing: "0.08em", marginBottom: 4 }}>
                  SAFETY GUARDRAILS
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: textPrimary, marginBottom: 14 }}>
                  Capital Allocation & Drawdown Rails
                </div>

                {/* Max Spend Slider */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: textSecondary }}>Max Spend Per Auto-Order</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#006c49", fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(agentMaxSpend)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={10000}
                    step={100}
                    value={agentMaxSpend}
                    onChange={(e) => onChangeMaxSpend(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#006c49", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: textSecondary, marginTop: 4 }}>
                    <span>$ 200 min</span>
                    <span>$ 10,000 max</span>
                  </div>
                </div>

                {/* Hard Daily Cap & Circuit Breaker status */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: "10px 12px", background: bgItem, borderRadius: 12, border: `1px solid ${borderCol}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary }}>Daily Spend Limit</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ 5,000.00 Hard Cap
                    </div>
                  </div>

                  <div style={{ padding: "10px 12px", background: bgItem, borderRadius: 12, border: `1px solid ${borderCol}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary }}>Circuit Breaker</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                      <ShieldCheck size={14} /> Armed (5% Max DD)
                    </div>
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: bgItem, borderRadius: 12, border: `1px solid ${borderCol}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary }}>Available Cash Balance</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(cashBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conversational Terminal with Gemini Loop */}
          <div
            style={{
              borderRadius: 20,
              padding: 24,
              background: bgCard,
              border: `1px solid ${borderCol}`,
              boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
              marginBottom: 30,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="#006c49" />
                <div style={{ fontSize: 17, fontWeight: 900, color: textPrimary }}>
                  Stake AI Trading Intelligence & Natural Execution
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                GEMINI 2.5 FLASH • FUNCTION CALLING ACTIVE
              </span>
            </div>

            {/* Quick Prompts Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1px solid ${borderCol}`,
                      background: bgItem,
                      color: textPrimary,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Log */}
            <div
              style={{
                minHeight: 260,
                maxHeight: 420,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "16px 18px",
                background: bgItem,
                borderRadius: 16,
                marginBottom: 14,
                border: `1px solid ${borderCol}`,
              }}
            >
              {chatLog.length === 0 ? (
                <div style={{ textAlign: "center", color: textSecondary, padding: "36px 20px" }}>
                  <Bot size={36} color="#006c49" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: textPrimary }}>
                    Stake Intelligence Agent Online
                  </p>
                  <p style={{ fontSize: 13, maxWidth: 460, margin: "0 auto" }}>
                    Ask about portfolio risk, analyze live ticker order flow, or instruct the agent to execute real orders directly.
                  </p>
                </div>
              ) : (
                chatLog.map((msg, i) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        padding: "12px 16px",
                        borderRadius: 16,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        background: isUser ? "#006c49" : (darkMode ? "#1e293b" : "#ffffff"),
                        color: isUser ? "#ffffff" : textPrimary,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        border: isUser ? "none" : `1px solid ${borderCol}`,
                      }}
                    >
                      {!isUser && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#006c49" }}>
                          <Bot size={14} />
                          <span>STAKE AGENT</span>
                        </div>
                      )}
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: darkMode ? "#1e293b" : "#ffffff",
                    border: `1px solid ${borderCol}`,
                    fontSize: 12.5,
                    color: textSecondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#006c49", animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                  <span>Agent analyzing live data & executing schema functions...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Stake Agent or issue a trade instruction (e.g. 'Buy 5 shares of NVDA')..."
                style={{
                  flex: 1,
                  padding: "13px 18px",
                  borderRadius: 14,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  fontSize: 14,
                  color: textPrimary,
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping}
                style={{
                  padding: "13px 24px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #006c49, #064e3b)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: isTyping ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(0,108,73,0.3)",
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: LIVE AI SIGNALS RADAR (real backend data, with loading/error/empty states) */}
      {activeTab === "signals" && (
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: bgCard,
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={20} color="#006c49" /> Real-Time AI Trading Signals Radar
              </div>
              <p style={{ fontSize: 13, color: textSecondary, margin: "2px 0 0" }}>
                Live scan output from the agent engine: order book skew, RSI deviations, and momentum breakout triggers.
              </p>
            </div>

            <button
              onClick={fetchSignals}
              disabled={loadingSignals}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: "#006c49",
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: loadingSignals ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={14} className={loadingSignals ? "spin" : ""} /> {loadingSignals ? "Refreshing..." : "Rescan Market"}
            </button>
          </div>

          {signalsError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={16} />
              {signalsError}
            </div>
          )}

          {!signalsError && signals.length === 0 && !loadingSignals ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: textSecondary }}>
              <Activity size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>No Active Signals Right Now</div>
              <p style={{ fontSize: 13, maxWidth: 460, margin: "6px auto 0" }}>
                The agent hasn&apos;t flagged any opportunities matching your active strategy. Rescan or check back after the next auto-scan.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
              {signals.map((sig) => {
                const isUp = sig.change >= 0;
                return (
                  <div
                    key={sig.id}
                    style={{
                      borderRadius: 16,
                      padding: 18,
                      background: bgItem,
                      border: `1px solid ${borderCol}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      {/* Header: Ticker, Price, Confidence */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: "#006c49",
                              color: "#ffffff",
                              fontWeight: 900,
                              fontSize: 13,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {sig.ticker}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: textPrimary }}>{sig.ticker}</div>
                            <div style={{ fontSize: 11.5, color: textSecondary }}>{sig.name}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                            ${sig.price?.toFixed(2)}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: isUp ? "#10b981" : "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 2,
                            }}
                          >
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {isUp ? "+" : ""}{sig.change}%
                          </div>
                        </div>
                      </div>

                      {/* Signal Badge & Confidence */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: sig.signalType?.includes("DIP") ? "rgba(0, 108, 73, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: sig.signalType?.includes("DIP") ? "#006c49" : "#2563eb",
                          }}
                        >
                          {sig.signalType}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: "#10b981" }}>
                          AI Match: {sig.confidence}%
                        </span>
                      </div>

                      {/* Reasoning */}
                      <p style={{ fontSize: 12.5, color: textSecondary, lineHeight: 1.45, margin: "0 0 10px" }}>
                        {sig.reason}
                      </p>

                      {/* Technical stats */}
                      <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: textSecondary, marginBottom: 12 }}>
                        <span>RSI: <strong style={{ color: textPrimary }}>{sig.rsi}</strong></span>
                        <span>Lot Size: <strong style={{ color: textPrimary }}>{sig.recommendedShares} shares (~${fmt(sig.estimatedCost)})</strong></span>
                      </div>
                    </div>

                    {/* Actions: Execute or Ask */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleSend(`Buy ${sig.recommendedShares} shares of ${sig.ticker}`)}
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: "none",
                          background: "#006c49",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: 12.5,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Zap size={13} /> Execute Lot
                      </button>
                      <button
                        onClick={() => handleSend(`Analyze why the agent flagged ${sig.ticker} with ${sig.signalType}`)}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 10,
                          border: `1px solid ${borderCol}`,
                          background: bgCard,
                          color: textPrimary,
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: "pointer",
                        }}
                      >
                        Ask AI
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & REVERT RAILS */}
      {activeTab === "audit" && (
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: bgCard,
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary }}>
                Autonomous Execution Audit Log
              </div>
              <p style={{ fontSize: 13, color: textSecondary, margin: "2px 0 0" }}>
                Every automated trade includes full agent reasoning and a 5-minute safety cancellation window.
              </p>
            </div>

            <button
              onClick={fetchActions}
              disabled={loadingActions}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${borderCol}`,
                background: bgItem,
                color: textPrimary,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={loadingActions ? "spin" : ""} /> Refresh
            </button>
          </div>

          {actions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: textSecondary }}>
              <History size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>No Autonomous Trades Recorded Yet</div>
              <p style={{ fontSize: 13, maxWidth: 460, margin: "6px auto 16px" }}>
                When the agent scans the market and triggers a trade matching your strategy (or when you click &quot;Trigger Scan Now&quot;), the full audit trail and reasoning will appear here.
              </p>
              <button
                onClick={handleTriggerScan}
                disabled={isScanning}
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "#006c49",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Run Scan to Generate Trade
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {actions.map((act) => {
                const isReverted = act.status === "reverted";
                const dateStr = new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                return (
                  <div
                    key={act.id}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${isReverted ? "#fecaca" : borderCol}`,
                      background: isReverted ? (darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2") : bgItem,
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: isReverted ? "#ef4444" : "#006c49",
                            color: "#ffffff",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {act.action}
                        </span>

                        <div>
                          <span style={{ fontSize: 16, fontWeight: 900, color: textPrimary }}>
                            {act.shares} shares of {act.stock}
                          </span>
                          <span style={{ fontSize: 13, color: textSecondary, marginLeft: 8 }}>
                            @ ${act.price?.toFixed(2)} (${act.amount?.toFixed(2)} total)
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11.5, color: textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {dateStr}
                        </span>

                        {/* 5-Minute Grace Period Revert Button */}
                        {!isReverted && (
                          <button
                            onClick={() => handleRevertTrade(act.id)}
                            disabled={revertingId === act.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #f87171",
                              background: "#fee2e2",
                              color: "#dc2626",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: revertingId === act.id ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                            title="Reverses the trade and refunds full cash immediately"
                          >
                            <RotateCcw size={12} />
                            {revertingId === act.id ? "Reverting..." : "Revert Trade (Safety Rail)"}
                          </button>
                        )}

                        {isReverted && (
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#dc2626", background: "#fee2e2", padding: "4px 8px", borderRadius: 6 }}>
                            REVERTED & REFUNDED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Agent's Reasoning Explanation */}
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: textPrimary,
                        background: darkMode ? "rgba(0,0,0,0.2)" : "#ffffff",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${borderCol}`,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#006c49", marginBottom: 2 }}>
                        AGENT REASONING & STRATEGY SIGNAL:
                      </div>
                      {act.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BACKTEST SIMULATOR LAB */}
      {activeTab === "backtest" && (
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: bgCard,
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary }}>
              Algorithmic Strategy Backtest Simulator
            </div>
            <p style={{ fontSize: 13, color: textSecondary, margin: "2px 0 0" }}>
              Simulate how Stake&apos;s autonomous strategies would have performed on historical tick feeds with customizable parameters.
            </p>
          </div>

          {/* Controls Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              padding: 16,
              background: bgItem,
              borderRadius: 16,
              border: `1px solid ${borderCol}`,
              marginBottom: 24,
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: textSecondary, marginBottom: 4 }}>
                Strategy
              </label>
              <select
                value={backtestStrategy}
                onChange={(e) => setBacktestStrategy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                <option value="dip_buyer">Intelligent Dip Buyer</option>
                <option value="momentum">Volume Breakout Momentum</option>
                <option value="dca">Disciplined Value DCA</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: textSecondary, marginBottom: 4 }}>
                Ticker Symbol
              </label>
              <select
                value={backtestTicker}
                onChange={(e) => setBacktestTicker(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                <option value="NVDA">NVDA (NVIDIA)</option>
                <option value="AAPL">AAPL (Apple)</option>
                <option value="TSLA">TSLA (Tesla)</option>
                <option value="MSFT">MSFT (Microsoft)</option>
                <option value="AMZN">AMZN (Amazon)</option>
                <option value="META">META (Meta)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: textSecondary, marginBottom: 4 }}>
                Timeframe
              </label>
              <select
                value={backtestTimeframe}
                onChange={(e) => setBacktestTimeframe(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                <option value="1 Month">1 Month (30 Days)</option>
                <option value="3 Months">3 Months (90 Days)</option>
                <option value="6 Months">6 Months (180 Days)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: textSecondary, marginBottom: 4 }}>
                Starting Capital ($)
              </label>
              <input
                type="number"
                value={backtestCapital}
                onChange={(e) => setBacktestCapital(Number(e.target.value))}
                step={1000}
                min={1000}
                max={100000}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: textPrimary,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onClick={handleRunBacktest}
              disabled={isRunningBacktest}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 32px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #006c49, #064e3b)",
                color: "#ffffff",
                fontSize: 14.5,
                fontWeight: 900,
                cursor: isRunningBacktest ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(0,108,73,0.3)",
              }}
            >
              <Play size={16} />
              {isRunningBacktest ? "Simulating Historical Ticks..." : "Run Strategy Backtest"}
            </button>
          </div>

          {/* Honest error state - no fabricated numbers when the engine fails */}
          {backtestError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 18px",
                borderRadius: 14,
                background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 13.5,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <AlertTriangle size={18} />
              {backtestError}
            </div>
          )}

          {/* Backtest Results Scorecard */}
          {backtestResult && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <div style={{ padding: "16px 18px", borderRadius: 14, background: bgItem, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>Total Strategy Return</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: backtestResult.scorecard.totalReturnPct >= 0 ? "#10b981" : "#ef4444",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 4,
                    }}
                  >
                    {backtestResult.scorecard.totalReturnPct >= 0 ? "+" : ""}{backtestResult.scorecard.totalReturnPct}%
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    Ending: ${fmt(backtestResult.scorecard.endingCapital)}
                  </div>
                </div>

                <div style={{ padding: "16px 18px", borderRadius: 14, background: bgItem, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>Benchmark Return (S&P)</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    +{backtestResult.scorecard.benchmarkReturnPct}%
                  </div>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginTop: 2 }}>
                    Alpha: +{(backtestResult.scorecard.totalReturnPct - backtestResult.scorecard.benchmarkReturnPct).toFixed(1)}%
                  </div>
                </div>

                <div style={{ padding: "16px 18px", borderRadius: 14, background: bgItem, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>Win Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    {backtestResult.scorecard.winRatePct}%
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    Total Trades: {backtestResult.scorecard.totalTrades}
                  </div>
                </div>

                <div style={{ padding: "16px 18px", borderRadius: 14, background: bgItem, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>Max Drawdown / Sharpe</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    -{backtestResult.scorecard.maxDrawdownPct}%
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    Sharpe Ratio: {backtestResult.scorecard.sharpeRatio}
                  </div>
                </div>
              </div>

              {/* Simulated Trades Timeline */}
              <div style={{ fontSize: 15, fontWeight: 900, color: textPrimary, marginBottom: 12 }}>
                Simulated Historical Execution Timeline ({backtestResult.trades.length} Trades)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {backtestResult.trades.map((tr, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: bgItem,
                      border: `1px solid ${borderCol}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: textSecondary, marginRight: 10 }}>Day {tr.day}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#006c49", marginRight: 8 }}>{tr.action}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{tr.shares} shares @ ${tr.price}</span>
                    </div>
                    <div style={{ fontSize: 12, color: textSecondary }}>
                      {tr.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AGENT MEMORY & PERCEPTION */}
      {activeTab === "memory" && (
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: bgCard,
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary }}>
                Agent Memory & Market Perception Store
              </div>
              <p style={{ fontSize: 13, color: textSecondary, margin: "2px 0 0" }}>
                Continuous context persisted by the agent across trading sessions.
              </p>
            </div>

            <button
              onClick={fetchMemories}
              disabled={loadingMemory}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${borderCol}`,
                background: bgItem,
                color: textPrimary,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={loadingMemory ? "spin" : ""} /> Refresh
            </button>
          </div>

          {memories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: textSecondary }}>
              <Brain size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>No Observations Logged Yet</div>
              <p style={{ fontSize: 13, margin: "4px 0 0" }}>
                As the agent runs market evaluations and processes user chats, its key findings will be stored here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: bgItem,
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#006c49", textTransform: "uppercase" }}>
                      {mem.type}
                    </span>
                    <span style={{ fontSize: 11.5, color: textSecondary }}>
                      {new Date(mem.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, color: textPrimary, lineHeight: 1.5 }}>
                    {mem.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}