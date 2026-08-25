import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Bot, BrainCircuit, Clock, DollarSign, Pause, Play,
  RefreshCw, RotateCcw, Sparkles, Wallet, Zap, CheckCircle2,
  BarChart2, Shield, Sliders, TrendingUp, Gauge, List, Eye,
  Download, Filter, Settings, X, ChevronRight, Edit,
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
function numberValue(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function dateValue(v) { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
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
  if (!contentType.includes("application/json")) throw new Error("Non‑JSON response.");
  try { return JSON.parse(raw); } catch { throw new Error("Invalid JSON."); }
}

// ----------------------------------------------------------------------
// Custom hooks
// ----------------------------------------------------------------------
function useAgentData(userEmail) {
  const [signals, setSignals] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sigData, actData] = await Promise.all([
        requestJSON(`/api/agent/signals?userId=${encodeURIComponent(userEmail)}`).catch(() => ({ signals: [] })),
        requestJSON(`/api/agent/actions?userId=${encodeURIComponent(userEmail)}`).catch(() => ({ actions: [] })),
      ]);
      setSignals(Array.isArray(sigData?.signals) ? sigData.signals : []);
      setActions(Array.isArray(actData?.actions) ? actData.actions : []);
    } catch (err) { console.warn("Agent data load error:", err); }
    setLoading(false);
  }, [userEmail]);

  useEffect(() => { loadData(); }, [loadData]);

  return { signals, actions, loading, refetch: loadData };
}

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export function AgentTab({
  agentEnabled, onToggleAgent, agentStrategy, onSelectStrategy,
  agentMaxSpend, onChangeMaxSpend, cashBalance, holdings = {},
  stocks = {}, stockMetaList = [], user, onRefreshUserData,
  showToast,
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

  // ----- UI state -----
  const [selectedStrategyId, setSelectedStrategyId] = useState(
    agentStrategy || user?.agentStrategy || STRATEGIES[0]?.id || null
  );
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
  const { signals, actions, loading: dataLoading, refetch: refreshData } = useAgentData(user?.email || "trader@stake.com");

  // ----- Computed -----
  const currentStrategy = useMemo(() => {
    return STRATEGIES.find(s => s.id === selectedStrategyId) || STRATEGIES[0] || null;
  }, [selectedStrategyId]);

  const availableCash = numberValue(cashBalance);
  const deployedCapital = numberValue(user?.agentDeployedCapital);

  // Signals with safe defaults
  const strongSignals = useMemo(() => {
    if (signals.length > 0) {
      return signals
        .filter(s => numberValue(s?.confidence) >= 50)
        .sort((a, b) => numberValue(b?.confidence) - numberValue(a?.confidence))
        .map(s => ({
          ticker: s.ticker || "UNKNOWN",
          price: s.price ?? 0,
          change: s.change ?? 0,
          signalType: s.signalType || s.type || "Signal",
          reason: s.reason || "No additional details.",
          confidence: s.confidence ?? 0,
          target: s.target ?? s.price * 1.08 ?? 0,
        }));
    }
    // Fallback mock signals
    const mockSignals = [
      { ticker: "NVDA", price: 137.86, change: 2.42, type: "Breakout Momentum", reason: "Volume breakout confirmed (+2.42%). Order flow shows strong continuation." },
      { ticker: "TSLA", price: 349.63, change: -0.84, type: "Mean-Reversion", reason: "Consolidation near key 50-EMA support. Risk-to-reward ratio 3.2:1." },
      { ticker: "GOOGL", price: 349.38, change: -0.57, type: "Mean-Reversion", reason: "Consolidation near key 50-EMA support. Risk-to-reward ratio 3.2:1." },
      { ticker: "META", price: 563.75, change: 1.12, type: "Mean-Reversion", reason: "Consolidation near key 50-EMA support. Risk-to-reward ratio 3.2:1." },
      { ticker: "COIN", price: 176.16, change: 3.84, type: "Breakout Momentum", reason: "Volume breakout confirmed (+3.84%). Order flow shows strong continuation." },
    ];
    return mockSignals.map((sig, idx) => ({
      ...sig,
      signalType: sig.type,
      confidence: 88 - idx * 2,
      target: sig.price * (1 + (sig.change > 0 ? 0.08 : -0.04)),
    }));
  }, [signals]);

  // Benchmark data (synthetic)
  const benchmarkChartData = useMemo(() => {
    const points = benchmarkTimeframe === "1mo" ? 22 : benchmarkTimeframe === "3mo" ? 45 : 90;
    const baseSpy = benchmarkTimeframe === "1mo" ? 2.4 : benchmarkTimeframe === "3mo" ? 6.2 : 14.8;
    const stratId = currentStrategy?.id || "dip_buyer";
    const alpha = stratId === "momentum" ? 1.55 : stratId === "dip_buyer" ? 1.32 : 1.15;
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
        strategy: Number(stratC.toFixed(2)),
        spy: Number(spyC.toFixed(2)),
      });
    }
    return data;
  }, [benchmarkTimeframe, currentStrategy]);

  // ---- Performance stats (mock) ----
  const performanceStats = useMemo(() => {
    const winRate = parseFloat(currentStrategy?.winRate || "70") / 100;
    const avgReturn = parseFloat(currentStrategy?.expectedReturn || "12") / 100;
    const sharpe = parseFloat(currentStrategy?.sharpeRatio || "2.1");
    const maxDD = parseFloat(currentStrategy?.maxDrawdown?.replace("%","") || "5");
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

  // ---- AI sentiment (mock) ----
  const sentiment = useMemo(() => {
    const confidence = strongSignals[0]?.confidence || 0;
    const base = 66;
    const score = Math.min(92, Math.max(58, Math.round(base + confidence * 0.18)));
    return { score, label: score > 80 ? "Bullish" : score > 60 ? "Neutral" : "Bearish" };
  }, [strongSignals]);

  // ---- Risk score ----
  const riskScore = useMemo(() => {
    let score = 70;
    if (riskParams.maxDrawdown < 6) score -= 10;
    if (riskParams.trailingStop) score -= 5;
    if (riskParams.stopLoss < 3) score -= 8;
    if (riskParams.maxPositionSize < 15) score -= 5;
    return Math.min(100, Math.max(0, score));
  }, [riskParams]);

  // ---- Handlers (unchanged) ----
  const runScan = useCallback(async () => {
    setScanLoading(true);
    try {
      await scanAndExecuteStrategy({
        email: user?.email,
        strategy: agentStrategy || selectedStrategyId,
        maxSpend: agentMaxSpend || maxSpendInput,
      });
      showToast?.("Radar scan completed.");
      refreshData();
      onRefreshUserData?.();
    } catch (err) { showToast?.(err.message); }
    setScanLoading(false);
  }, [user?.email, agentStrategy, selectedStrategyId, agentMaxSpend, maxSpendInput, showToast, refreshData, onRefreshUserData]);

  const scanFunctionRef = useRef(runScan);
  useEffect(() => { scanFunctionRef.current = runScan; }, [runScan]);

  useEffect(() => {
    if (!agentEnabled) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { scanFunctionRef.current?.(); return 180; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [agentEnabled]);

  const handleTogglePause = async () => {
    try {
      if (agentEnabled) {
        await pauseAgentStrategy({ email: user?.email });
        onToggleAgent?.(false);
      } else {
        await resumeAgentStrategy({ email: user?.email });
        onToggleAgent?.(true);
      }
      showToast?.(agentEnabled ? "Agent paused." : "Agent resumed.");
      onRefreshUserData?.();
    } catch (err) { showToast?.(err.message); }
  };

  const handleDeployStrategy = async () => {
    if (!selectedStrategyId) { showToast?.("Select a strategy first."); return; }
    setDeployLoading(true);
    try {
      await deployAgentStrategy({
        email: user?.email,
        strategy: selectedStrategyId,
        deployedCapital: Number(deployCapitalInput),
        maxSpend: Number(maxSpendInput),
        riskLevel: currentStrategy?.riskLevel,
      });
      onSelectStrategy?.(selectedStrategyId);
      onChangeMaxSpend?.(Number(maxSpendInput));
      onToggleAgent?.(true);
      showToast?.(`Strategy deployed with $${fmt(deployCapitalInput)}.`);
      refreshData();
      onRefreshUserData?.();
    } catch (err) { showToast?.(err.message); }
    setDeployLoading(false);
  };

  const revertTrade = async (actionId) => {
    if (!actionId || revertingId) return;
    setRevertingId(actionId);
    try {
      const data = await requestJSON("/api/agent/revert-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email, email: user?.email, actionId }),
      });
      showToast?.(data?.message || "Trade reverted.");
      refreshData();
      onRefreshUserData?.();
    } catch (err) { showToast?.(err.message); }
    setRevertingId(null);
  };

  const handleAdjustCapital = async (isAdd) => {
    const delta = Number(adjustAmount);
    if (!delta || delta <= 0) return;
    const newCapital = isAdd ? deployedCapital + delta : Math.max(0, deployedCapital - delta);
    try {
      await adjustAgentCapital({ email: user?.email, deployedCapital: newCapital, maxSpend: agentMaxSpend });
      showToast?.(isAdd ? `Added $${fmt(delta)}` : `Withdrew $${fmt(delta)}`);
      setShowAdjustModal(false);
      onRefreshUserData?.();
    } catch (err) { showToast?.(err.message); }
  };

  const exportTradeLog = () => {
    const csv = actions.map(a => `${a.timestamp},${a.action},${a.stock},${a.amount}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trade_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredActions = useMemo(() => {
    if (tradeFilter === "all") return actions;
    return actions.filter(a => a.action?.toUpperCase() === tradeFilter.toUpperCase());
  }, [actions, tradeFilter]);

  // ---- Watchlist handlers ----
  const addToWatchlist = (ticker) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
    }
  };
  const removeFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter(t => t !== ticker));
  };

  // ---- Light theme constants (matching HomeDashboard) ----
  const bgCard = "#ffffff";
  const borderCol = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const bgRow = "#f8fafc";

  // ---- Render ----
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full font-sans text-slate-900 bg-[radial-gradient(circle_at_top,#ecfdf5_0%,#f8fafc_34%,#f8fafc_100%)] px-3 sm:px-6 py-5 pb-24"
    >
      {/* HEADER - Light, now includes Pause/Start button */}
      <div
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
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(16,185,129,0.12)",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                Stake AI
              </h1>
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: agentEnabled ? "rgba(16,185,129,0.12)" : "#f1f5f9",
                  color: agentEnabled ? "#059669" : textSecondary,
                  border: `1px solid ${agentEnabled ? "rgba(16,185,129,0.25)" : borderCol}`,
                }}
              >
                {agentEnabled ? "● Live" : "● Paused"}
              </span>
              {currentStrategy && (
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 6,
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
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Pause/Start button moved to the top */}
          <button
            onClick={handleTogglePause}
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: `1px solid ${agentEnabled ? "#f59e0b" : "#10b981"}`,
              background: agentEnabled ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: agentEnabled ? "#b45309" : "#059669",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = agentEnabled ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = agentEnabled ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)";
            }}
          >
            {agentEnabled ? <Pause size={14} /> : <Play size={14} />}
            <span>{agentEnabled ? "Pause" : "Start"}</span>
          </button>

          <button
            onClick={() => setIsCustomizationOpen(true)}
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: `1px solid ${borderCol}`,
              background: bgRow,
              color: textPrimary,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Settings size={14} />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS - unchanged */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Signal</span>
            <BrainCircuit size={16} className="text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">
            {agentEnabled ? (strongSignals.length > 0 ? `${strongSignals[0].confidence || 85}%` : "85%") : "--"}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">High conviction</div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Trades</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{actions.length}</div>
          <div className="text-[10px] text-slate-400">{actions.filter(a => a.reverted).length} reverted</div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Deployed</span>
            <DollarSign size={16} className="text-purple-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">${fmt(deployedCapital)}</div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>Max ${fmt(agentMaxSpend || maxSpendInput)}/trade</span>
            <button onClick={() => setShowAdjustModal(true)} className="text-emerald-600 font-bold hover:underline">Adjust</button>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cash</span>
            <Wallet size={16} className="text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-emerald-600 font-mono">${fmt(availableCash)}</div>
          <div className="text-[10px] text-slate-400">Ready for deployment</div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk</span>
            <Gauge size={16} className="text-rose-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{riskScore}</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${riskScore}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{riskScore < 50 ? "Elevated" : riskScore < 75 ? "Moderate" : "Controlled"}</div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sentiment</span>
            <TrendingUp size={16} className={sentiment.label === "Bullish" ? "text-emerald-500" : sentiment.label === "Bearish" ? "text-rose-500" : "text-amber-500"} />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 font-mono">{sentiment.score}</div>
          <div className={`text-[10px] font-semibold ${sentiment.label === "Bullish" ? "text-emerald-500" : sentiment.label === "Bearish" ? "text-rose-500" : "text-amber-500"}`}>{sentiment.label}</div>
        </div>
      </div>

      {/* DEPLOY BAR - Removed Pause button, kept scan controls */}
      <div
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: "20px 24px",
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: "0.06em" }}>
                SELECTED STRATEGY
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                  {currentStrategy?.name || "None"}
                </span>
                <button
                  onClick={() => setIsCustomizationOpen(true)}
                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                  title="Change strategy"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            {currentStrategy && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span><span className="font-medium text-slate-400">Win:</span> <span className="font-bold text-slate-900">{currentStrategy.winRate}</span></span>
                <span><span className="font-medium text-slate-400">Sharpe:</span> <span className="font-bold text-slate-900">{currentStrategy.sharpeRatio}</span></span>
                <span><span className="font-medium text-slate-400">Risk:</span> <span className={`font-bold ${currentStrategy.riskLevel === "High" ? "text-rose-600" : currentStrategy.riskLevel === "Medium" ? "text-amber-600" : "text-emerald-600"}`}>{currentStrategy.riskLevel}</span></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.06em" }}>Capital</div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input type="number" value={deployCapitalInput} onChange={e => setDeployCapitalInput(Number(e.target.value))} className="pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono w-28 focus:outline-emerald-500" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.06em" }}>Max/trade</div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input type="number" value={maxSpendInput} onChange={e => setMaxSpendInput(Number(e.target.value))} className="pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono w-24 focus:outline-emerald-500" />
              </div>
            </div>
            <button onClick={handleDeployStrategy} disabled={deployLoading} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
              {deployLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-300" />}
              <span>{deployLoading ? "Deploying..." : "Deploy"}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 my-3"></div>

        {/* Only scan controls remain here */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {agentEnabled && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <Clock size={12} className="text-slate-400" />
                <span>Next scan:</span>
                <strong className="text-emerald-600 font-mono">{countdown}s</strong>
              </div>
            )}
            <button
              onClick={runScan}
              disabled={scanLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all border border-slate-800 disabled:opacity-50 shadow-sm"
            >
              <Zap size={13} className={scanLoading ? "animate-spin text-amber-300" : "text-amber-300"} />
              <span>{scanLoading ? "Scanning..." : "Scan & Trade"}</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-400">
            <span>⚡ Autonomous execution engine</span>
          </div>
        </div>
      </div>

      {/* BENCHMARK CHART - Card style */}
      <div
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: "20px 24px",
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Benchmark</span>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <BarChart2 size={16} className="text-emerald-600" />
              <span>Performance vs S&P 500</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {["1mo", "3mo", "1y"].map(tf => <button key={tf} onClick={() => setBenchmarkTimeframe(tf)} className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${benchmarkTimeframe === tf ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>{tf.toUpperCase()}</button>)}
            </div>
            <button onClick={() => setCompareBenchmark(!compareBenchmark)} className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${compareBenchmark ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{compareBenchmark ? "SPY ON" : "SPY OFF"}</button>
          </div>
        </div>
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={benchmarkChartData} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gStrat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="gSpy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} unit="%" />
              <RechartsTooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-[11px]">
                    <div className="font-bold text-slate-900 mb-0.5">{label}</div>
                    <div className="text-emerald-600 font-bold">Strategy: +{payload[0]?.value}%</div>
                    {compareBenchmark && payload[1] && <div className="text-blue-600 font-semibold">SPY: +{payload[1]?.value}%</div>}
                  </div>;
                }
                return null;
              }} />
              <Legend verticalAlign="top" height={28} formatter={v => <span className="text-[10px] font-bold text-slate-700">{v === "strategy" ? `${currentStrategy?.name || "Strategy"}` : "S&P 500"}</span>} />
              <Area type="monotone" dataKey="strategy" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gStrat)" />
              {compareBenchmark && <Area type="monotone" dataKey="spy" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#gSpy)" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SIGNALS + AUDIT + WATCHLIST - Light cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-5">
          <div
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Radar</span>
                <span className="text-sm font-bold text-slate-900">Signals</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{strongSignals.length} active</span>
            </div>
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {dataLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading...</div>
              ) : strongSignals.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No signals</div>
              ) : (
                strongSignals.slice(0, 5).map((sig, idx) => (
                  <div key={sig.ticker || idx} className="p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900 font-mono">{sig.ticker}</strong>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            {sig.signalType}
                          </span>
                          <span className={`text-[10px] font-bold ${sig.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {sig.change >= 0 ? "+" : ""}{sig.change.toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{sig.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-slate-900 font-mono">${sig.price.toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-emerald-600">{sig.confidence}% confidence</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Audit</span>
                <span className="text-sm font-bold text-slate-900">Log</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select value={tradeFilter} onChange={e => setTradeFilter(e.target.value)} className="text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-emerald-500">
                  <option value="all">All</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <button onClick={exportTradeLog} className="p-1 rounded-lg hover:bg-slate-100">
                  <Download size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {dataLoading ? <div className="py-8 text-center text-slate-400 text-xs">Loading...</div> : filteredActions.length === 0 ? <div className="py-8 text-center text-slate-400 text-xs">No executions</div> : filteredActions.slice(0, 8).map((act, idx) => {
                const reverted = Boolean(act?.reverted);
                const isBuy = String(act?.action || "BUY").toUpperCase() === "BUY";
                const amt = numberValue(act?.amount || act?.total);
                const ticker = act?.stock || act?.ticker || "NVDA";
                return <div key={act.id || idx} className={`p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${reverted ? "bg-slate-50 border-slate-200 opacity-60" : "bg-slate-50/60 border-slate-200"}`}>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className={`font-black px-1.5 py-0.5 rounded text-[8px] uppercase ${isBuy ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{act?.action || "BUY"}</span><strong className="text-slate-900 font-bold font-mono text-xs">{ticker}</strong><span className="text-slate-400 font-medium font-mono text-[10px]">${amt.toFixed(0)}</span>{reverted && <span className="text-[8px] font-bold text-slate-400 px-1 rounded bg-slate-200">REVERTED</span>}</div><div className="text-[9px] text-slate-400 flex items-center gap-1.5"><span>{formatRelativeTime(act?.timestamp)}</span><span>•</span><span>{act?.strategy || currentStrategy?.name || "Stake AI"}</span></div></div>
                  {!reverted && <button onClick={() => revertTrade(act?.id)} disabled={revertingId === act?.id} className="px-2 py-1 rounded-lg text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer disabled:opacity-50 flex items-center gap-0.5 flex-shrink-0 transition-colors"><RotateCcw size={11} className={revertingId === act?.id ? "animate-spin" : ""} /><span>Revert</span></button>}
                </div>;
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div
            style={{
              background: bgCard,
              borderRadius: 22,
              padding: "20px 24px",
              border: `1px solid ${borderCol}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              height: "100%",
            }}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <List size={16} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Watchlist</span>
              <Eye size={14} className="text-slate-400 ml-auto" />
            </div>
            <div className="space-y-1.5">
              {watchlist.map(ticker => {
                const price = stocks[ticker]?.price || (ticker === "NVDA" ? 137.86 : ticker === "AAPL" ? 228.45 : ticker === "MSFT" ? 420.20 : ticker === "TSLA" ? 349.63 : 176.16);
                const changeMap = { NVDA: 2.42, AAPL: 0.62, MSFT: -0.38, TSLA: -0.84, COIN: 3.84 };
                const change = (changeMap[ticker] ?? 0.45).toFixed(2);
                const isPositive = Number(change) >= 0;
                return (
                  <div key={ticker} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                    <span className="font-bold text-sm text-slate-900 font-mono">{ticker}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600">${price.toFixed(2)}</span>
                      <span className={`text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPositive ? "+" : ""}{change}%
                      </span>
                      <button onClick={() => removeFromWatchlist(ticker)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-1">
              <input
                type="text"
                value={""}
                onChange={(e) => { const val = e.target.value.toUpperCase(); if (val && !watchlist.includes(val)) { addToWatchlist(val); } }}
                placeholder="Add ticker"
                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-emerald-500"
              />
              <button onClick={() => {}} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMIZATION SIDE PANEL - Light theme */}
      <AnimatePresence>
        {isCustomizationOpen && (
          <CustomizationPanel
            onClose={() => setIsCustomizationOpen(false)}
            strategies={STRATEGIES}
            selectedStrategyId={selectedStrategyId}
            setSelectedStrategyId={setSelectedStrategyId}
            riskParams={riskParams}
            setRiskParams={setRiskParams}
            currentStrategy={currentStrategy}
          />
        )}
      </AnimatePresence>

      {/* ADJUST CAPITAL MODAL - Light */}
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

      {/* AI INSIGHTS FAB - Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsGeminiSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/40 border border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/60 transition-all group"
        aria-label="AI Insights"
      >
        <Sparkles size={24} className="text-amber-300 drop-shadow-sm" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white/20"></span>
        </span>
        <span className="absolute bottom-16 right-0 whitespace-nowrap bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
          AI Insights
        </span>
      </motion.button>

      <GeminiStrategySidebar
        isOpen={isGeminiSidebarOpen}
        onClose={() => setIsGeminiSidebarOpen(false)}
        strategy={selectedStrategyId}
        user={user}
        onTriggerScan={runScan}
      />
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// Sub-components for Customization Panel and Adjust Modal (unchanged)
// ----------------------------------------------------------------------

function CustomizationPanel({ onClose, strategies, selectedStrategyId, setSelectedStrategyId, riskParams, setRiskParams, currentStrategy }) {
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
          AI Customization
        </h2>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Strategy Model</label>
            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {strategies.length} available
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strategies.map((s) => {
              const isSelected = selectedStrategyId === s.id;
              const riskColors = {
                High: "border-rose-200 bg-rose-50/50 text-rose-700",
                Medium: "border-amber-200 bg-amber-50/50 text-amber-700",
                Low: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
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
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${riskColors[s.riskLevel] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
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
                      <span>Active Selection</span>
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
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Risk Controls</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-white/50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Stop-Loss</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.stopLoss}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={riskParams.stopLoss}
                onChange={(e) => setRiskParams({...riskParams, stopLoss: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Take-Profit</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.takeProfit}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={riskParams.takeProfit}
                onChange={(e) => setRiskParams({...riskParams, takeProfit: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Max Drawdown</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.maxDrawdown}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={riskParams.maxDrawdown}
                onChange={(e) => setRiskParams({...riskParams, maxDrawdown: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-600">Position Size</label>
                <span className="font-mono font-bold text-slate-900">{riskParams.maxPositionSize}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={riskParams.maxPositionSize}
                onChange={(e) => setRiskParams({...riskParams, maxPositionSize: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600 mt-1"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-1 border-t border-slate-200/60 mt-1">
              <input
                type="checkbox"
                id="trail-panel"
                checked={riskParams.trailingStop}
                onChange={(e) => setRiskParams({...riskParams, trailingStop: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="trail-panel" className="text-xs font-bold text-slate-700">Enable Trailing Stop</label>
              <span className="text-[10px] text-slate-400 ml-auto">Lock in gains as price rises</span>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-extrabold transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
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
        <h3 className="text-base font-bold text-slate-900 mb-1">Adjust Capital</h3>
        <p className="text-xs text-slate-400 mb-4">Deployed: <strong className="text-slate-700">${fmt(deployedCapital)}</strong> · Wallet: <strong className="text-emerald-600">${fmt(availableCash)}</strong></p>
        <label className="text-xs font-bold text-slate-600 block mb-1">Amount ($)</label>
        <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold font-mono mb-4 focus:outline-emerald-500" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button onClick={() => onAdjust(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100">Withdraw</button>
          <button onClick={() => onAdjust(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs">Add</button>
        </div>
      </div>
    </div>
  );
}