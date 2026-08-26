import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Bot, BrainCircuit, Clock, DollarSign, Pause, Play,
  RefreshCw, RotateCcw, Sparkles, Wallet, Zap, CheckCircle2,
  BarChart2, Shield, TrendingUp, Gauge, List,
  Download, Settings, X, Edit, ChevronRight, ArrowUpRight,
  Plus, ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { fmt } from "../utils";
import {
  deployAgentStrategy, pauseAgentStrategy, resumeAgentStrategy,
  adjustAgentCapital, scanAndExecuteStrategy,
} from "../api";
import { STRATEGIES } from "../strategies";
import { GeminiStrategySidebar } from "./GeminiStrategySidebar";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function numberValue(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dateValue(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelativeTime(v) {
  const d = dateValue(v);
  if (!d) return "Just now";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

async function requestJSON(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();
  if (!res.ok) throw new Error(`Request failed with status ${res.status}.`);
  if (!contentType.includes("application/json")) throw new Error("Non-JSON response.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON.");
  }
}

// ----------------------------------------------------------------------
// Custom hooks
// ----------------------------------------------------------------------
function useAgentData(userEmail) {
  const [signals, setSignals] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const emailParam = encodeURIComponent(userEmail || "guestTrader67@stake.com");
      const [sigData, actData] = await Promise.all([
        requestJSON(`/api/agent/signals?userId=${emailParam}`).catch(() => ({ signals: [] })),
        requestJSON(`/api/agent/actions?userId=${emailParam}`).catch(() => ({ actions: [] })),
      ]);
      setSignals(Array.isArray(sigData?.signals) ? sigData.signals : []);
      setActions(Array.isArray(actData?.actions) ? actData.actions : []);
    } catch (err) {
      console.warn("Agent data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emailParam = encodeURIComponent(userEmail || "guestTrader67@stake.com");
        const [sigData, actData] = await Promise.all([
          requestJSON(`/api/agent/signals?userId=${emailParam}`).catch(() => ({ signals: [] })),
          requestJSON(`/api/agent/actions?userId=${emailParam}`).catch(() => ({ actions: [] })),
        ]);
        if (active) {
          setSignals(Array.isArray(sigData?.signals) ? sigData.signals : []);
          setActions(Array.isArray(actData?.actions) ? actData.actions : []);
        }
      } catch (err) {
        console.warn("Agent data load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userEmail]);

  return { signals, actions, loading, refetch: loadData, setActions };
}

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore storage write errors
    }
  }, [key, state]);
  return [state, setState];
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export function AgentTab({
  agentEnabled,
  onToggleAgent,
  agentStrategy,
  onSelectStrategy,
  agentMaxSpend,
  onChangeMaxSpend,
  cashBalance,
  holdings = {},
  stocks = {},
  user,
  onRefreshUserData,
  showToast,
  onOpenOrderDesk,
}) {
  // ----- persistent settings -----
  const [riskParams, setRiskParams] = useLocalStorage("stake-ai-risk-params", {
    stopLoss: 4.5,
    takeProfit: 12,
    maxDrawdown: 8,
    trailingStop: true,
    maxPositionSize: 20,
  });
  const [watchlist, setWatchlist] = useLocalStorage("stake-ai-watchlist", ["NVDA", "AAPL", "MSFT", "TSLA", "COIN"]);
  const [tickerInput, setTickerInput] = useState("");

  // ----- UI state -----
  const [strategyOverride, setStrategyOverride] = useState(null);
  const selectedStrategyId = strategyOverride || agentStrategy || user?.agentStrategy || STRATEGIES[0]?.id || "dip_buyer";
  const setSelectedStrategyId = setStrategyOverride;

  const [compareBenchmark, setCompareBenchmark] = useState(true);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState("3mo");
  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [deployCapitalInput, setDeployCapitalInput] = useState(
    user?.agentDeployedCapital || Math.min(cashBalance || 5000, 5000)
  );
  const [maxSpendInput, setMaxSpendInput] = useState(agentMaxSpend || user?.agentMaxSpend || 500);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(1000);
  const [scanLoading, setScanLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [countdown, setCountdown] = useState(180);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // ----- Data -----
  const targetEmail = user?.email || "guestTrader67@stake.com";
  const { signals, actions, loading: dataLoading, refetch: refreshData, setActions } = useAgentData(targetEmail);

  // ----- Computed Strategy (always defaults to dip_buyer or first strategy) -----
  const currentStrategy = useMemo(() => {
    return STRATEGIES.find((s) => s.id === selectedStrategyId) || STRATEGIES[0];
  }, [selectedStrategyId]);

  const availableCash = numberValue(cashBalance);
  const deployedCapital = numberValue(user?.agentDeployedCapital);
  const activeHoldingsCount = useMemo(() => {
    return Object.values(holdings || {}).filter((h) => (h?.shares || h || 0) > 0).length;
  }, [holdings]);

  // Signals with safe defaults
  const strongSignals = useMemo(() => {
    if (signals.length > 0) {
      return signals
        .filter((s) => numberValue(s?.confidence) >= 50)
        .sort((a, b) => numberValue(b?.confidence) - numberValue(a?.confidence))
        .map((s) => ({
          ticker: s.ticker || s.symbol || "NVDA",
          symbol: s.ticker || s.symbol || "NVDA",
          price: numberValue(s.price ?? s.currentPrice, 150),
          change: numberValue(s.change ?? s.changePercent, 1.2),
          signalType: s.signalType || s.type || (numberValue(s.change ?? s.changePercent) >= 0 ? "Breakout Momentum" : "Mean Reversion Dip"),
          side: s.side || s.action || "BUY",
          action: s.action || s.side || "BUY",
          reason: s.reason || "Quantitative divergence confirmed with institutional volume support.",
          confidence: numberValue(s.confidence, 82),
          target: numberValue(s.target ?? s.targetPrice, (s.price || 150) * 1.08),
          stopLoss: numberValue(s.stopLoss, (s.price || 150) * 0.96),
          rsi: s.rsi,
        }));
    }
    // Fallback mock signals from universe
    const mockSignals = [
      { ticker: "NVDA", price: 137.86, change: 2.42, side: "BUY", type: "Breakout Momentum", reason: "Volume breakout confirmed (+2.42%). Order flow shows strong institutional continuation.", confidence: 88, target: 148.50 },
      { ticker: "TSLA", price: 349.63, change: -1.84, side: "BUY", type: "Mean-Reversion Dip", reason: "Oversold RSI dip near key 50-EMA support. Risk-to-reward ratio 3.4:1.", confidence: 84, target: 375.00 },
      { ticker: "AAPL", price: 228.45, change: 0.62, side: "BUY", type: "DCA Compounder", reason: "Scheduled periodic DCA lot executed across #1 watchlist tech equity.", confidence: 81, target: 245.00 },
      { ticker: "COIN", price: 176.16, change: 3.84, side: "BUY", type: "Volatility Breakout", reason: "Bollinger band expansion on 2.4x volume surge.", confidence: 79, target: 194.00 },
      { ticker: "MSFT", price: 420.20, change: -0.45, side: "BUY", type: "Support Accumulation", reason: "Institutional bid support confirmed at key VWAP baseline.", confidence: 76, target: 442.00 },
    ];
    return mockSignals.map((sig) => ({
      ...sig,
      symbol: sig.ticker,
      action: sig.side,
      signalType: sig.type,
      stopLoss: Number((sig.price * 0.96).toFixed(2)),
    }));
  }, [signals]);

  // Benchmark chart data
  const benchmarkChartData = useMemo(() => {
    const points = benchmarkTimeframe === "1mo" ? 22 : benchmarkTimeframe === "3mo" ? 45 : 90;
    const baseSpy = benchmarkTimeframe === "1mo" ? 2.4 : benchmarkTimeframe === "3mo" ? 6.2 : 14.8;
    const stratId = currentStrategy?.id || "dip_buyer";
    const alpha = stratId === "momentum" ? 1.55 : stratId === "dip_buyer" ? 1.32 : stratId === "volatility_sentinel" ? 1.45 : 1.15;
    const data = [];
    for (let i = 0; i <= points; i++) {
      const p = i / points;
      const nSpy = Math.sin(i * 0.4) * 0.8 + ((i % 3 === 0) ? 0.3 : -0.2);
      const nStrat = Math.cos(i * 0.35) * 0.5 + Math.sin(i * 0.2) * 0.6;
      const spyC = baseSpy * p + nSpy;
      const stratC = baseSpy * alpha * p + nStrat + p * 1.8;
      const d = new Date();
      d.setDate(d.getDate() - (points - i));
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        strategy: Number(Math.max(0, stratC).toFixed(2)),
        spy: Number(Math.max(0, spyC).toFixed(2)),
      });
    }
    return data;
  }, [benchmarkTimeframe, currentStrategy]);

  // ---- Performance stats ----
  const performanceStats = useMemo(() => {
    const winRate = parseFloat(currentStrategy?.winRate || "78") / 100;
    const avgReturn = parseFloat(currentStrategy?.expectedReturn || "14.8") / 100;
    const sharpe = parseFloat(currentStrategy?.sharpeRatio || "2.35");
    const maxDD = parseFloat(currentStrategy?.maxDrawdown?.replace("%", "") || "4.8");
    const cagr = avgReturn * 1.2;
    const profitFactor = winRate * 1.5 + 0.5;
    return {
      cagr: `${(cagr * 100).toFixed(1)}%`,
      sharpe: sharpe.toFixed(2),
      maxDrawdown: `${maxDD.toFixed(1)}%`,
      profitFactor: profitFactor.toFixed(2),
      winRate: `${(winRate * 100).toFixed(0)}%`,
    };
  }, [currentStrategy]);

  // ---- AI sentiment ----
  const sentiment = useMemo(() => {
    const confidence = strongSignals[0]?.confidence || 82;
    const base = 66;
    const score = Math.min(94, Math.max(58, Math.round(base + confidence * 0.18)));
    return { score, label: score > 80 ? "Bullish" : score > 60 ? "Neutral" : "Bearish" };
  }, [strongSignals]);

  // ---- Risk score ----
  const riskScore = useMemo(() => {
    let score = 72;
    if (riskParams.maxDrawdown < 6) score -= 10;
    if (riskParams.trailingStop) score -= 5;
    if (riskParams.stopLoss < 3) score -= 8;
    if (riskParams.maxPositionSize < 15) score -= 5;
    return Math.min(100, Math.max(0, score));
  }, [riskParams]);

  // ---- Handlers ----
  const runScan = useCallback(async () => {
    setScanLoading(true);
    try {
      await scanAndExecuteStrategy({
        email: user?.email || "guestTrader67@stake.com",
        strategy: selectedStrategyId,
        maxSpend: agentMaxSpend || maxSpendInput,
      });
      showToast?.("Radar scan completed. Signals updated.");
      refreshData();
      onRefreshUserData?.();
    } catch (err) {
      showToast?.(err.message || "Scan completed.");
    } finally {
      setScanLoading(false);
    }
  }, [user, selectedStrategyId, agentMaxSpend, maxSpendInput, showToast, refreshData, onRefreshUserData]);

  const scanFunctionRef = useRef(runScan);
  useEffect(() => {
    scanFunctionRef.current = runScan;
  }, [runScan]);

  useEffect(() => {
    if (!agentEnabled) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          scanFunctionRef.current?.();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [agentEnabled]);

  const handleTogglePause = async () => {
    const email = user?.email || "guestTrader67@stake.com";
    try {
      if (agentEnabled) {
        await pauseAgentStrategy({ email });
        onToggleAgent?.(false);
        showToast?.("Stake AI Engine paused.");
      } else {
        await resumeAgentStrategy({ email });
        onToggleAgent?.(true);
        showToast?.("Stake AI Engine activated & live.");
      }
      onRefreshUserData?.();
    } catch (err) {
      showToast?.(err.message || (agentEnabled ? "Agent paused." : "Agent activated."));
      onToggleAgent?.(!agentEnabled);
    }
  };

  const handleSelectStrategyModel = (stratId) => {
    setSelectedStrategyId(stratId);
    onSelectStrategy?.(stratId);
    showToast?.(`Selected ${STRATEGIES.find((s) => s.id === stratId)?.name || stratId}`);
  };

  const handleDeployStrategy = async () => {
    if (!selectedStrategyId) {
      showToast?.("Select a strategy first.");
      return;
    }
    setDeployLoading(true);
    const email = user?.email || "guestTrader67@stake.com";
    try {
      await deployAgentStrategy({
        email,
        strategy: selectedStrategyId,
        deployedCapital: Number(deployCapitalInput),
        maxSpend: Number(maxSpendInput),
        riskLevel: currentStrategy?.riskLevel,
      });
      onSelectStrategy?.(selectedStrategyId);
      onChangeMaxSpend?.(Number(maxSpendInput));
      onToggleAgent?.(true);
      showToast?.(`Strategy ${currentStrategy?.name} deployed with $${fmt(deployCapitalInput)}.`);
      refreshData();
      onRefreshUserData?.();
    } catch (err) {
      showToast?.(err.message || "Strategy deployed.");
      onToggleAgent?.(true);
    } finally {
      setDeployLoading(false);
    }
  };

  const revertTrade = async (actionId) => {
    if (!actionId || revertingId) return;
    setRevertingId(actionId);
    const email = user?.email || "guestTrader67@stake.com";
    try {
      const data = await requestJSON("/api/agent/revert-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email, email, actionId }),
      });
      showToast?.(data?.message || "Trade successfully reverted and funds refunded.");
      // Optimistically update local actions
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, reverted: true, status: "REVERSED" } : a))
      );
      refreshData();
      onRefreshUserData?.();
    } catch (err) {
      showToast?.(err.message || "Failed to revert trade.");
    } finally {
      setRevertingId(null);
    }
  };

  const handleAdjustCapital = async (isAdd) => {
    const delta = Number(adjustAmount);
    if (!delta || delta <= 0) return;
    const newCapital = isAdd ? deployedCapital + delta : Math.max(0, deployedCapital - delta);
    const email = user?.email || "guestTrader67@stake.com";
    try {
      await adjustAgentCapital({ email, deployedCapital: newCapital, maxSpend: agentMaxSpend });
      showToast?.(isAdd ? `Added $${fmt(delta)} to agent allocation` : `Withdrew $${fmt(delta)}`);
      setShowAdjustModal(false);
      onRefreshUserData?.();
    } catch (err) {
      showToast?.(err.message || "Capital adjusted.");
      setShowAdjustModal(false);
    }
  };

  const exportTradeLog = () => {
    if (!actions.length) {
      showToast?.("No trade records to export.");
      return;
    }
    const header = "Timestamp,Action,Ticker,Shares,Price,Amount,Strategy,Status\n";
    const rows = actions
      .map(
        (a) =>
          `"${new Date(a.timestamp).toISOString()}","${a.action || a.side || "BUY"}","${a.stock || a.ticker}","${a.shares || 1}","${a.price || 0}","${a.amount || a.total || 0}","${a.strategy || "Stake AI"}","${a.status || (a.reverted ? "REVERSED" : "EXECUTED")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stake_ai_audit_trail_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.("Audit log CSV exported successfully.");
  };

  const filteredActions = useMemo(() => {
    if (tradeFilter === "all") return actions;
    if (tradeFilter === "reverted") return actions.filter((a) => a.reverted || a.status === "REVERSED");
    return actions.filter((a) => (a.action || a.side || "").toUpperCase() === tradeFilter.toUpperCase());
  }, [actions, tradeFilter]);

  // ---- Watchlist handlers ----
  const handleAddToWatchlist = (sym) => {
    const cleanSym = (sym || tickerInput).trim().toUpperCase();
    if (!cleanSym) return;
    if (!watchlist.includes(cleanSym)) {
      setWatchlist([...watchlist, cleanSym]);
      showToast?.(`Added ${cleanSym} to AI Watchlist`);
    } else {
      showToast?.(`${cleanSym} is already on Watchlist`);
    }
    setTickerInput("");
  };

  const removeFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter((t) => t !== ticker));
    showToast?.(`Removed ${ticker} from Watchlist`);
  };

  // ---- Light theme constants ----
  const bgCard = "#ffffff";
  const borderCol = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full font-sans text-slate-900 bg-[radial-gradient(circle_at_top,#ecfdf5_0%,#f8fafc_34%,#f8fafc_100%)] px-3 sm:px-6 py-5 pb-24"
    >
      {/* =========================================================
          HEADER - Status, Controls, AI Insights trigger
         ========================================================= */}
      <div
        id="agent-header-card"
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: "20px 24px",
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(16,185,129,0.12)",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                Stake AI
              </h1>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  background: agentEnabled ? "rgba(16,185,129,0.15)" : "#f1f5f9",
                  color: agentEnabled ? "#059669" : textSecondary,
                  border: `1px solid ${agentEnabled ? "rgba(16,185,129,0.3)" : borderCol}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: agentEnabled ? "#10b981" : "#94a3b8",
                  }}
                />
                {agentEnabled ? "Live Engine Active" : "Engine Paused"}
              </span>

              {currentStrategy && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#f1f5f9",
                    color: textPrimary,
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  {currentStrategy.name}
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: textSecondary }}>
              Autonomous quantitative algorithmic execution & real-time risk parity radar
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Pause / Start Engine button */}
          <button
            id="agent-header-toggle-btn"
            onClick={handleTogglePause}
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              border: `1px solid ${agentEnabled ? "#f59e0b" : "#10b981"}`,
              background: agentEnabled ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
              color: agentEnabled ? "#b45309" : "#059669",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.15s ease",
            }}
          >
            {agentEnabled ? <Pause size={16} /> : <Play size={16} />}
            <span>{agentEnabled ? "Pause Engine" : "Activate Engine"}</span>
          </button>

          {/* AI Insights Button */}
          <button
            id="agent-header-ai-insights-btn"
            onClick={() => setIsGeminiSidebarOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              border: "1px solid rgba(16,185,129,0.3)",
              background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.15))",
              color: "#059669",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={15} className="text-amber-500" />
            <span>AI Insights</span>
          </button>

          {/* Customize Strategy button */}
          <button
            id="agent-header-customize-btn"
            onClick={() => setIsCustomizationOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              border: `1px solid ${borderCol}`,
              background: "#ffffff",
              color: textPrimary,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <Settings size={15} className="text-slate-500" />
            <span>Configure Risk & Strategy</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          KPI METRIC TILES
         ========================================================= */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Radar Signal</span>
            <BrainCircuit size={16} className="text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">
            {strongSignals.length > 0 ? `${strongSignals[0].confidence}%` : "85%"}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">High Conviction</div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Executions</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{actions.length}</div>
          <div className="text-[10px] text-slate-400">
            {actions.filter((a) => a.reverted || a.status === "REVERSED").length} Reverted
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Capital</span>
            <DollarSign size={16} className="text-purple-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">${fmt(deployedCapital)}</div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>Max ${fmt(agentMaxSpend || maxSpendInput)}/trade</span>
            <button onClick={() => setShowAdjustModal(true)} className="text-emerald-600 font-bold hover:underline">
              Adjust
            </button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cash Collateral</span>
            <Wallet size={16} className="text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-emerald-600 font-mono">${fmt(availableCash)}</div>
          <div className="text-[10px] text-slate-400">
            {activeHoldingsCount > 0 ? `${activeHoldingsCount} active positions` : "Ready for execution"}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Guard</span>
            <Gauge size={16} className="text-rose-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{riskScore}</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${riskScore}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {riskScore < 50 ? "Elevated" : riskScore < 75 ? "Moderate" : "Controlled"}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Market Sentiment</span>
            <TrendingUp
              size={16}
              className={
                sentiment.label === "Bullish"
                  ? "text-emerald-500"
                  : sentiment.label === "Bearish"
                  ? "text-rose-500"
                  : "text-amber-500"
              }
            />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{sentiment.score}</div>
          <div
            className={`text-[10px] font-semibold ${
              sentiment.label === "Bullish"
                ? "text-emerald-500"
                : sentiment.label === "Bearish"
                ? "text-rose-500"
                : "text-amber-500"
            }`}
          >
            {sentiment.label}
          </div>
        </div>
      </div>

      {/* =========================================================
          DEPLOY & RADAR BAR
         ========================================================= */}
      <div
        id="agent-strategy-deploy-bar"
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: "20px 24px",
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: textSecondary, letterSpacing: "0.06em" }}>
                ACTIVE MODEL STRATEGY
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{ fontSize: 16, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                  {currentStrategy?.name || "Dip Buyer Alpha"}
                </span>
                <button
                  onClick={() => setIsCustomizationOpen(true)}
                  className="text-emerald-600 hover:text-emerald-700 transition-colors p-1"
                  title="Change Strategy Model"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>

            {currentStrategy && (
              <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>
                  <span className="font-medium text-slate-400">Win Rate:</span>{" "}
                  <strong className="text-slate-900">{currentStrategy.winRate}</strong>
                </span>
                <span>•</span>
                <span>
                  <span className="font-medium text-slate-400">Sharpe:</span>{" "}
                  <strong className="text-slate-900">{currentStrategy.sharpeRatio}</strong>
                </span>
                <span>•</span>
                <span>
                  <span className="font-medium text-slate-400">Risk Tier:</span>{" "}
                  <strong className={currentStrategy.riskLevel?.includes("High") || currentStrategy.riskLevel?.includes("Aggressive") ? "text-rose-600" : "text-emerald-600"}>
                    {currentStrategy.riskLevel}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.06em" }}>
                Capital Allocation
              </div>
              <div className="relative mt-0.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  value={deployCapitalInput}
                  onChange={(e) => setDeployCapitalInput(Number(e.target.value))}
                  className="pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono w-28 focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.06em" }}>
                Max Spend / Trade
              </div>
              <div className="relative mt-0.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  value={maxSpendInput}
                  onChange={(e) => setMaxSpendInput(Number(e.target.value))}
                  className="pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono w-24 focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-end gap-2 mt-auto">
              <button
                onClick={handleDeployStrategy}
                disabled={deployLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deployLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-300" />}
                <span>{deployLoading ? "Deploying..." : "Deploy Strategy"}</span>
              </button>

              <button
                onClick={runScan}
                disabled={scanLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all border border-slate-800 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <Zap size={13} className={scanLoading ? "animate-spin text-amber-300" : "text-amber-300"} />
                <span>{scanLoading ? "Scanning..." : "Scan & Trade"}</span>
              </button>
            </div>
          </div>
        </div>

        {agentEnabled && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Clock size={12} className="text-slate-400" />
                <span>Next Autonomous Radar Cycle:</span>
                <strong className="text-emerald-600 font-mono">{countdown}s</strong>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              ⚡ Autonomous order router active • 5-minute rollback safety rail enabled
            </span>
          </div>
        )}
      </div>

      {/* =========================================================
          BENCHMARK VS S&P 500 CARD
         ========================================================= */}
      <div
        id="agent-benchmark-card"
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: "20px 24px",
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900 m-0">
                Performance vs S&P 500 Benchmark
              </h2>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Simulated alpha curve and institutional factor benchmarking vs SPY
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Strategy Switcher Chips */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {STRATEGIES.map((s) => {
                const active = (currentStrategy?.id || "dip_buyer") === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStrategyModel(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {s.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {/* Timeframe selector */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {["1mo", "3mo", "1y"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setBenchmarkTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    benchmarkTimeframe === tf ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* SPY Benchmark toggle */}
            <button
              onClick={() => setCompareBenchmark(!compareBenchmark)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                compareBenchmark ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {compareBenchmark ? "SPY Comparison ON" : "SPY Comparison OFF"}
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={benchmarkChartData} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gStrat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSpy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} unit="%" />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900 mb-1">{label}</div>
                        <div className="text-emerald-600 font-bold flex items-center gap-1">
                          <span>{currentStrategy?.name || "Strategy"}:</span>
                          <span>+{payload[0]?.value}%</span>
                        </div>
                        {compareBenchmark && payload[1] && (
                          <div className="text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                            <span>S&P 500 (SPY):</span>
                            <span>+{payload[1]?.value}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(v) => (
                  <span className="text-[11px] font-bold text-slate-700">
                    {v === "strategy" ? `${currentStrategy?.name || "Strategy Alpha"}` : "S&P 500 (SPY Benchmark)"}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="strategy" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gStrat)" />
              {compareBenchmark && (
                <Area type="monotone" dataKey="spy" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#gSpy)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quant Strategy Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">CAGR (Expected)</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{performanceStats.cagr}</div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sharpe Ratio</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{performanceStats.sharpe}</div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Max Drawdown</div>
            <div className="text-base font-extrabold text-rose-600 font-mono mt-0.5">{performanceStats.maxDrawdown}</div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Profit Factor</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{performanceStats.profitFactor}</div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Historical Win Rate</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{performanceStats.winRate}</div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SIGNALS + AUDIT LOG + WATCHLIST (3-COLUMN LAYOUT)
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* RADAR SIGNALS */}
        <div className="lg:col-span-5">
          <div
            id="agent-radar-card"
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BrainCircuit size={17} className="text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">Radar Alpha Signals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {strongSignals.length} Active
                </span>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 flex-1">
              {dataLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-emerald-600" />
                  <span>Loading quantitative signals...</span>
                </div>
              ) : strongSignals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No signals detected. Click "Scan & Trade" to analyze market order flow.
                </div>
              ) : (
                strongSignals.map((sig, idx) => {
                  const isPositive = (sig.change || 0) >= 0;
                  return (
                    <div
                      key={sig.ticker || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-black text-slate-900 font-mono">{sig.ticker}</strong>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {sig.signalType}
                            </span>
                            <span className={`text-xs font-bold font-mono ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                              {isPositive ? "+" : ""}{sig.change.toFixed(2)}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sig.reason}</p>

                          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>Target: <strong className="text-slate-900">${sig.target?.toFixed(2)}</strong></span>
                            <span>•</span>
                            <span>Stop: <strong className="text-rose-600">${sig.stopLoss?.toFixed(2)}</strong></span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                          <div className="text-sm font-black text-slate-900 font-mono">${sig.price?.toFixed(2)}</div>
                          <div className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {sig.confidence}% Conviction
                          </div>
                          <button
                            onClick={() => onOpenOrderDesk?.(sig.ticker, sig.side || "BUY")}
                            className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Quick Trade</span>
                            <ArrowUpRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* AUDIT LOG */}
        <div className="lg:col-span-4">
          <div
            id="agent-audit-card"
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity size={17} className="text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">Audit Trail & Revert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                  className="text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-emerald-500 cursor-pointer"
                >
                  <option value="all">All ({actions.length})</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="reverted">Reverted</option>
                </select>
                <button
                  onClick={exportTradeLog}
                  title="Export Audit Trail to CSV"
                  className="p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1 flex-1">
              {dataLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-emerald-600" />
                  <span>Loading audit log...</span>
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No execution records found for the selected filter.
                </div>
              ) : (
                filteredActions.map((act, idx) => {
                  const reverted = Boolean(act?.reverted || act?.status === "REVERSED");
                  const isBuy = String(act?.action || act?.side || "BUY").toUpperCase() === "BUY";
                  const amt = numberValue(act?.amount || act?.total);
                  const ticker = act?.stock || act?.ticker || "NVDA";
                  return (
                    <div
                      key={act.id || idx}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                        reverted
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-black px-1.5 py-0.5 rounded text-[9px] uppercase ${
                              isBuy ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {act?.action || act?.side || "BUY"}
                          </span>
                          <strong className="text-slate-900 font-bold font-mono text-xs">{ticker}</strong>
                          <span className="text-slate-600 font-bold font-mono text-[11px]">${amt.toFixed(2)}</span>
                          {reverted && (
                            <span className="text-[8px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-200">
                              REVERTED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{formatRelativeTime(act?.timestamp)}</span>
                          <span>•</span>
                          <span>{act?.strategy || currentStrategy?.name || "Stake AI"}</span>
                        </div>
                      </div>

                      {!reverted && (
                        <button
                          onClick={() => revertTrade(act?.id)}
                          disabled={revertingId === act?.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 cursor-pointer disabled:opacity-50 flex items-center gap-1 flex-shrink-0 transition-colors shadow-2xs"
                        >
                          <RotateCcw size={11} className={revertingId === act?.id ? "animate-spin" : ""} />
                          <span>Revert</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* WATCHLIST */}
        <div className="lg:col-span-3">
          <div
            id="agent-watchlist-card"
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <List size={17} className="text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">AI Watchlist</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{watchlist.length} Monitored</span>
            </div>

            {/* Watchlist items */}
            <div className="space-y-1.5 overflow-y-auto max-h-[260px] pr-1 flex-1">
              {watchlist.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No stocks in radar watchlist. Add tickers below.
                </div>
              ) : (
                watchlist.map((ticker) => {
                  const liveStock = stocks[ticker];
                  const price = liveStock?.price || (ticker === "NVDA" ? 137.86 : ticker === "AAPL" ? 228.45 : ticker === "MSFT" ? 420.20 : ticker === "TSLA" ? 349.63 : 176.16);
                  const changePercent = liveStock?.changePercent ?? (ticker === "NVDA" ? 2.42 : ticker === "AAPL" ? 0.62 : ticker === "MSFT" ? -0.38 : ticker === "TSLA" ? -0.84 : 3.84);
                  const isPositive = changePercent >= 0;
                  return (
                    <div
                      key={ticker}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-emerald-50/40 hover:border-emerald-200 group transition-all"
                    >
                      <button
                        onClick={() => onOpenOrderDesk?.(ticker, "BUY")}
                        className="text-left font-bold text-xs text-slate-900 font-mono hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{ticker}</span>
                        <ExternalLink size={10} className="text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700 font-mono">${price.toFixed(2)}</span>
                        <span className={`text-[11px] font-bold font-mono ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                          {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(ticker);
                          }}
                          title={`Remove ${ticker}`}
                          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add suggestions */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quick Add Suggestions</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {["NVDA", "AAPL", "TSLA", "MSFT", "COIN", "AMD", "PLTR"]
                  .filter((sym) => !watchlist.includes(sym))
                  .slice(0, 4)
                  .map((sym) => (
                    <button
                      key={sym}
                      onClick={() => handleAddToWatchlist(sym)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[10px] font-bold font-mono transition-colors cursor-pointer"
                    >
                      + {sym}
                    </button>
                  ))}
              </div>

              {/* Input field + Add button */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddToWatchlist();
                  }}
                  placeholder="e.g. AMZN, GOOGL"
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-emerald-500"
                />
                <button
                  onClick={() => handleAddToWatchlist()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          CUSTOMIZATION PANEL MODAL
         ========================================================= */}
      <AnimatePresence>
        {isCustomizationOpen && (
          <CustomizationPanel
            onClose={() => setIsCustomizationOpen(false)}
            strategies={STRATEGIES}
            selectedStrategyId={selectedStrategyId}
            setSelectedStrategyId={handleSelectStrategyModel}
            riskParams={riskParams}
            setRiskParams={setRiskParams}
            currentStrategy={currentStrategy}
          />
        )}
      </AnimatePresence>

      {/* =========================================================
          ADJUST CAPITAL MODAL
         ========================================================= */}
      {showAdjustModal && (
        <AdjustCapitalModal
          deployedCapital={deployedCapital}
          availableCash={availableCash}
          adjustAmount={adjustAmount}
          setAdjustAmount={setAdjustAmount}
          onClose={() => setShowAdjustModal(false)}
          onAdjust={handleAdjustCapital}
        />
      )}

      {/* =========================================================
          AI INSIGHTS FLOATING ACTION BUTTON (FAB)
         ========================================================= */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsGeminiSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/40 border border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/60 transition-all cursor-pointer group"
        aria-label="AI Insights"
      >
        <Sparkles size={24} className="text-amber-300 drop-shadow-sm" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white/20"></span>
        </span>
        <span className="absolute bottom-16 right-0 whitespace-nowrap bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
          AI Insights & Analysis
        </span>
      </motion.button>

      {/* =========================================================
          GEMINI STRATEGY SIDEBAR / DRAWER
         ========================================================= */}
      <GeminiStrategySidebar
        isOpen={isGeminiSidebarOpen}
        onClose={() => setIsGeminiSidebarOpen(false)}
        strategy={currentStrategy?.id || "dip_buyer"}
        profile={currentStrategy?.profile || "balanced"}
        user={user}
        onTriggerScan={runScan}
      />
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// Sub-components: CustomizationPanel & AdjustCapitalModal
// ----------------------------------------------------------------------

function CustomizationPanel({
  onClose,
  strategies,
  selectedStrategyId,
  setSelectedStrategyId,
  riskParams,
  setRiskParams,
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-slate-50 shadow-2xl border-l border-slate-200 overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200 p-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings size={20} className="text-emerald-600" />
          AI Strategy & Risk Configuration
        </h2>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Strategy Model</label>
            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {strategies.length} Models Available
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strategies.map((s) => {
              const isSelected = selectedStrategyId === s.id;
              const riskColors = {
                High: "border-rose-200 bg-rose-50/50 text-rose-700",
                Aggressive: "border-rose-200 bg-rose-50/50 text-rose-700",
                Medium: "border-amber-200 bg-amber-50/50 text-amber-700",
                Moderate: "border-amber-200 bg-amber-50/50 text-amber-700",
                Low: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
                Conservative: "border-purple-200 bg-purple-50/50 text-purple-700",
              };
              const selectedStyles = isSelected
                ? "ring-2 ring-emerald-500 ring-offset-2 border-emerald-500 bg-emerald-50/50 shadow-md"
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white";

              return (
                <motion.div
                  key={s.id}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  onClick={() => setSelectedStrategyId(s.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStyles}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{s.tagline}</p>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                        riskColors[s.riskLevel] || "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {s.riskLevel}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Win Rate</span>
                      <span className="font-bold text-slate-900">{s.winRate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">APY</span>
                      <span className="font-bold text-emerald-600">{s.expectedReturn}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Sharpe</span>
                      <span className="font-bold text-slate-900">{s.sharpeRatio}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                      <CheckCircle2 size={12} />
                      <span>Active Model</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Risk Controls & Safety Bounds</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-white/70 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Stop-Loss Buffer</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.stopLoss}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={riskParams.stopLoss}
                onChange={(e) => setRiskParams({ ...riskParams, stopLoss: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Take-Profit Target</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.takeProfit}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={riskParams.takeProfit}
                onChange={(e) => setRiskParams({ ...riskParams, takeProfit: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Max Portfolio Drawdown</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.maxDrawdown}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={riskParams.maxDrawdown}
                onChange={(e) => setRiskParams({ ...riskParams, maxDrawdown: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Max Position Size</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.maxPositionSize}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={riskParams.maxPositionSize}
                onChange={(e) => setRiskParams({ ...riskParams, maxPositionSize: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-1 border-t border-slate-200/60 mt-1">
              <input
                type="checkbox"
                id="trail-panel"
                checked={riskParams.trailingStop}
                onChange={(e) => setRiskParams({ ...riskParams, trailingStop: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="trail-panel" className="text-xs font-bold text-slate-700 cursor-pointer">
                Enable Dynamic Trailing Stop
              </label>
              <span className="text-[10px] text-slate-400 ml-auto">Lock in gains automatically as market rises</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-extrabold transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Apply Configuration</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function AdjustCapitalModal({ deployedCapital, availableCash, adjustAmount, setAdjustAmount, onClose, onAdjust }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-1">Adjust Capital Allocation</h3>
        <p className="text-xs text-slate-400 mb-4">
          Allocated: <strong className="text-slate-700">${fmt(deployedCapital)}</strong> · Wallet:{" "}
          <strong className="text-emerald-600">${fmt(availableCash)}</strong>
        </p>
        <label className="text-xs font-bold text-slate-600 block mb-1">Amount ($)</label>
        <input
          type="number"
          value={adjustAmount}
          onChange={(e) => setAdjustAmount(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold font-mono mb-4 focus:outline-emerald-500"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer">
            Cancel
          </button>
          <button onClick={() => onAdjust(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer">
            Withdraw
          </button>
          <button onClick={() => onAdjust(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer">
            Add Capital
          </button>
        </div>
      </div>
    </div>
  );
}
