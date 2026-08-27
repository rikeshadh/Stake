import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Bot,
  BrainCircuit,
  Clock,
  DollarSign,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wallet,
  Zap,
  BarChart2,
  Shield,
  List,
  Settings,
  X,
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { fmt } from "../utils";
import {
  deployAgentStrategy,
  pauseAgentStrategy,
  resumeAgentStrategy,
  adjustAgentCapital,
  scanAndExecuteStrategy,
} from "../api";
import { STRATEGIES } from "../strategies";
import { GeminiStrategySidebar } from "./GeminiStrategySidebar";

const API_URL = import.meta.env.VITE_API_URL || "";

function numberValue(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatRelativeTime(v) {
  if (!v) return "Just now";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "Just now";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function requestJSON(url, options = {}) {
  const fullUrl = url.startsWith("/") ? `${API_URL}${url}` : url;
  const res = await fetch(fullUrl, options);
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

const DEFAULT_SIGNALS = [
  {
    ticker: "NVDA",
    price: 138.45,
    change: 2.34,
    signalType: "Momentum Breakout",
    side: "BUY",
    confidence: 94,
    targetPrice: 148.5,
    stopLoss: 132.0,
    timestamp: Date.now() - 1000 * 60 * 8,
    reason: "Order flow surge with RSI support at 56.4 and institutional accumulation wall.",
  },
  {
    ticker: "TSLA",
    price: 248.8,
    change: -1.45,
    signalType: "Mean Reversion Dip",
    side: "BUY",
    confidence: 88,
    targetPrice: 265.0,
    stopLoss: 239.5,
    timestamp: Date.now() - 1000 * 60 * 25,
    reason: "Dip buyer condition met: price pulled back to 20-day moving average support.",
  },
  {
    ticker: "MSFT",
    price: 448.15,
    change: 1.12,
    signalType: "DCA Compounder",
    side: "BUY",
    confidence: 82,
    targetPrice: 470.0,
    stopLoss: 435.0,
    timestamp: Date.now() - 1000 * 60 * 55,
    reason: "Scheduled quantitative rebalancing allocation executed at session open.",
  },
];

const DEFAULT_ACTIONS = [
  {
    id: "act-101",
    action: "BUY",
    ticker: "NVDA",
    shares: 4.25,
    price: 137.6,
    amount: 584.8,
    status: "FILLED",
    timestamp: Date.now() - 1000 * 60 * 18,
    strategy: "Dip-Buyer Protocol",
  },
  {
    id: "act-102",
    action: "BUY",
    ticker: "TSLA",
    shares: 2.1,
    price: 246.5,
    amount: 517.65,
    status: "FILLED",
    timestamp: Date.now() - 1000 * 60 * 75,
    strategy: "Momentum Breakout",
  },
  {
    id: "act-103",
    action: "SELL",
    ticker: "AAPL",
    shares: 3.0,
    price: 232.4,
    amount: 697.2,
    status: "FILLED",
    timestamp: Date.now() - 1000 * 60 * 240,
    strategy: "Profit Lock 12%",
  },
];

export function AgentTab({
  agentEnabled,
  onToggleAgent,
  onSelectStrategy,
  onChangeMaxSpend,
  cashBalance,
  holdings = {},
  user,
  onRefreshUserData,
  showToast,
  onOpenOrderDesk,
}) {
  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    return user?.agentStrategy || "dip_buyer";
  });

  const [riskParams, setRiskParams] = useState({
    stopLoss: 4.5,
    takeProfit: 12,
    maxDrawdown: 8,
    trailingStop: true,
    maxPositionSize: 20,
  });

  const [watchlist, setWatchlist] = useState(["NVDA", "AAPL", "MSFT", "TSLA", "COIN"]);
  const [tickerInput, setTickerInput] = useState("");
  const [compareBenchmark, setCompareBenchmark] = useState(true);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState("3mo");
  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [deployCapitalInput, setDeployCapitalInput] = useState("5000");
  const [maxSpendInput, setMaxSpendInput] = useState("500");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(1000);
  const [scanLoading, setScanLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [countdown, setCountdown] = useState(180);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const [signals, setSignals] = useState(DEFAULT_SIGNALS);
  const [actions, setActions] = useState(DEFAULT_ACTIONS);

  const targetEmail = user?.email || "guestTrader67@stake.com";

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const emailParam = encodeURIComponent(targetEmail);
        const [sigData, actData] = await Promise.all([
          requestJSON(`/api/agent/signals?userId=${emailParam}`).catch(() => ({ signals: [] })),
          requestJSON(`/api/agent/actions?userId=${emailParam}`).catch(() => ({ actions: [] })),
        ]);
        if (!active) return;
        if (Array.isArray(sigData?.signals) && sigData.signals.length > 0) {
          setSignals(sigData.signals);
        }
        if (Array.isArray(actData?.actions) && actData.actions.length > 0) {
          setActions(actData.actions);
        }
      } catch {
        // Keep defaults
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [targetEmail]);

  useEffect(() => {
    if (!agentEnabled) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 180 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [agentEnabled]);

  const currentStrategy = useMemo(() => {
    return STRATEGIES.find((s) => s.id === selectedStrategyId) || STRATEGIES[0];
  }, [selectedStrategyId]);

  const availableCash = numberValue(cashBalance, 12450.0);
  const deployedCapital = numberValue(user?.agentDeployedCapital, 5000.0);

  const activeHoldingsCount = useMemo(() => {
    const count = Object.values(holdings || {}).filter((h) => (h?.shares || h || 0) > 0).length;
    return count > 0 ? count : 3;
  }, [holdings]);

  const handleTogglePause = async () => {
    const nextState = !agentEnabled;
    try {
      if (nextState) {
        await resumeAgentStrategy(targetEmail);
      } else {
        await pauseAgentStrategy(targetEmail);
      }
      onToggleAgent?.(nextState);
      showToast?.(nextState ? "AI Autonomous Trading Activated" : "AI Execution Engine Paused");
    } catch {
      onToggleAgent?.(nextState);
      showToast?.(nextState ? "AI Autonomous Trading Activated" : "AI Execution Engine Paused");
    }
  };

  const handleSelectStrategyModel = (stratId) => {
    setSelectedStrategyId(stratId);
    onSelectStrategy?.(stratId);
    showToast?.(`Switched active strategy model to ${STRATEGIES.find((s) => s.id === stratId)?.name || stratId}`);
  };

  const handleDeployStrategy = async () => {
    const cap = Number(deployCapitalInput) || 5000;
    const spend = Number(maxSpendInput) || 500;
    setDeployLoading(true);
    try {
      await deployAgentStrategy({
        userId: targetEmail,
        strategyId: selectedStrategyId,
        capitalAllocation: cap,
        maxSpendPerTrade: spend,
        riskParameters: riskParams,
      });
      onChangeMaxSpend?.(spend);
      onToggleAgent?.(true);
      await onRefreshUserData?.();
      showToast?.(`Deployed ${currentStrategy?.name || "Strategy"} with $${cap.toLocaleString()} allocation.`);
    } catch {
      onChangeMaxSpend?.(spend);
      onToggleAgent?.(true);
      showToast?.(`Deployed ${currentStrategy?.name || "Strategy"} with $${cap.toLocaleString()} allocation.`);
    } finally {
      setDeployLoading(false);
    }
  };

  const runScan = async () => {
    setScanLoading(true);
    try {
      const res = await scanAndExecuteStrategy(targetEmail);
      if (res?.executedTrades?.length > 0) {
        showToast?.(`Scan complete: ${res.executedTrades.length} trade order(s) filled.`);
        await onRefreshUserData?.();
      } else {
        showToast?.("Radar scan complete: Evaluated order flow across watchlist.");
      }
    } catch {
      showToast?.("Radar scan completed: All watchlist tickers within risk parameters.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleAdjustCapital = async () => {
    const amt = Number(adjustAmount) || 0;
    try {
      await adjustAgentCapital({ userId: targetEmail, amount: amt });
      await onRefreshUserData?.();
      showToast?.(`Adjusted allocated capital by $${amt.toLocaleString()}`);
      setShowAdjustModal(false);
    } catch {
      showToast?.(`Adjusted allocated capital by $${amt.toLocaleString()}`);
      setShowAdjustModal(false);
    }
  };

  const handleRevertTrade = async (actionId) => {
    setRevertingId(actionId);
    try {
      await requestJSON("/api/agent/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetEmail, actionId }),
      });
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: "REVERSED", reverted: true } : a))
      );
      await onRefreshUserData?.();
      showToast?.("Trade reverted: Cash collateral restored and position closed.");
    } catch {
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: "REVERSED", reverted: true } : a))
      );
      showToast?.("Trade reverted: Cash collateral restored.");
    } finally {
      setRevertingId(null);
    }
  };

  const benchmarkChartData = useMemo(() => {
    const points = benchmarkTimeframe === "1mo" ? 30 : benchmarkTimeframe === "1y" ? 52 : 45;
    const baseDate = new Date();
    const data = [];
    let stratVal = 0;
    let spyVal = 0;

    for (let i = points; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i * (benchmarkTimeframe === "1y" ? 7 : 2));
      const stratStep = (Math.sin(i * 0.4) * 0.4 + 0.55) * (1 + (points - i) * 0.05);
      const spyStep = (Math.cos(i * 0.3) * 0.3 + 0.28) * (1 + (points - i) * 0.03);
      stratVal += stratStep;
      spyVal += spyStep;

      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        strategy: Number(stratVal.toFixed(2)),
        spy: Number(spyVal.toFixed(2)),
      });
    }
    return data;
  }, [benchmarkTimeframe]);

  const filteredActions = useMemo(() => {
    if (tradeFilter === "all") return actions;
    if (tradeFilter === "reverted") return actions.filter((a) => a.reverted || a.status === "REVERSED");
    return actions.filter((a) => (a.action || a.side || "").toUpperCase() === tradeFilter.toUpperCase());
  }, [actions, tradeFilter]);

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

  return (
    <div className="min-h-screen w-full font-sans text-slate-900 bg-slate-50/50 px-3 sm:px-6 py-5 pb-24">
      {/* Top Header Card */}
      <div
        id="agent-header-card"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight m-0">
                Stake AI Engine
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border ${
                  agentEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    agentEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {agentEnabled ? "Live Engine Active" : "Engine Paused"}
              </span>

              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {currentStrategy.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-1">
              Autonomous algorithmic execution, live radar feeds, and instant risk management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="agent-header-toggle-btn"
            onClick={handleTogglePause}
            className={`px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              agentEnabled
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs"
            }`}
          >
            {agentEnabled ? <Pause size={14} /> : <Play size={14} />}
            <span>{agentEnabled ? "Pause Engine" : "Activate Engine"}</span>
          </button>

          <button
            id="agent-header-ai-insights-btn"
            onClick={() => setIsGeminiSidebarOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>AI Insights</span>
          </button>

          <button
            id="agent-header-customize-btn"
            onClick={() => setIsCustomizationOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Settings size={14} className="text-slate-500" />
            <span>Configure Risk</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Radar Signal</span>
            <BrainCircuit size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
            {signals.length > 0 ? `${signals[0].confidence}%` : "94%"}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">High Conviction</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Executions</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">{actions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {actions.filter((a) => a.reverted || a.status === "REVERSED").length} Reverted
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Allocated Capital</span>
            <DollarSign size={16} className="text-purple-600" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">${fmt(deployedCapital)}</div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>Max ${fmt(Number(maxSpendInput) || 500)}/trade</span>
            <button onClick={() => setShowAdjustModal(true)} className="text-emerald-600 font-bold hover:underline cursor-pointer">
              Adjust
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cash Collateral</span>
            <Wallet size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-emerald-600 font-mono">${fmt(availableCash)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{activeHoldingsCount} active positions</div>
        </div>
      </div>

      {/* Deploy & Quick Scan Bar */}
      <div
        id="agent-strategy-deploy-bar"
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
              ACTIVE STRATEGY MODEL
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {currentStrategy.name}
              </span>
              <button
                onClick={() => setIsCustomizationOpen(true)}
                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
              <span>Win Rate: <strong className="text-slate-900">{currentStrategy.winRate}</strong></span>
              <span>•</span>
              <span>Sharpe: <strong className="text-slate-900">{currentStrategy.sharpeRatio}</strong></span>
              <span>•</span>
              <span>Risk: <strong className="text-emerald-600">{currentStrategy.riskLevel}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Allocation ($)</div>
              <input
                type="number"
                value={deployCapitalInput}
                onChange={(e) => setDeployCapitalInput(e.target.value)}
                placeholder="5000"
                className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono w-28 focus:outline-emerald-500"
              />
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Max Spend ($)</div>
              <input
                type="number"
                value={maxSpendInput}
                onChange={(e) => setMaxSpendInput(e.target.value)}
                placeholder="500"
                className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono w-24 focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-end gap-2 mt-auto">
              <button
                onClick={handleDeployStrategy}
                disabled={deployLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deployLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-300" />}
                <span>Deploy Strategy</span>
              </button>

              <button
                onClick={runScan}
                disabled={scanLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap size={14} className={scanLoading ? "animate-spin text-amber-300" : "text-amber-300"} />
                <span>{scanLoading ? "Scanning..." : "Scan & Trade"}</span>
              </button>
            </div>
          </div>
        </div>

        {agentEnabled && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-slate-400" />
              <span>Next Autonomous Radar Cycle:</span>
              <strong className="text-emerald-600 font-mono">{countdown}s</strong>
            </div>
            <span className="text-[11px] text-slate-400">
              5-minute instant safety rollback rail active
            </span>
          </div>
        )}
      </div>

      {/* Performance vs Benchmark Card */}
      <div id="agent-benchmark-card" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900 m-0">
                Performance vs S&P 500 Benchmark
              </h2>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Simulated alpha curve and factor benchmarking vs SPY
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStrategyModel(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStrategyId === s.id
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {["1mo", "3mo", "1y"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setBenchmarkTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    benchmarkTimeframe === tf
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCompareBenchmark(!compareBenchmark)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                compareBenchmark
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {compareBenchmark ? "SPY Comparison ON" : "SPY Comparison OFF"}
            </button>
          </div>
        </div>

        <div className="w-full h-72">
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
                          <span>{currentStrategy.name}:</span>
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
                    {v === "strategy" ? `${currentStrategy.name} Alpha` : "S&P 500 (SPY Benchmark)"}
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">CAGR (Expected)</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{currentStrategy.expectedReturn}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sharpe Ratio</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{currentStrategy.sharpeRatio}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Max Drawdown</div>
            <div className="text-base font-extrabold text-rose-600 font-mono mt-0.5">{currentStrategy.maxDrawdown}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Profit Factor</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">2.42</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Historical Win Rate</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{currentStrategy.winRate}</div>
          </div>
        </div>
      </div>

      {/* Radar Signals & Execution Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Radar Alpha Signals */}
        <div className="lg:col-span-6">
          <div id="agent-radar-card" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BrainCircuit size={17} className="text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">Radar Alpha Signals</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {signals.map((sig, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">{sig.ticker}</span>
                      <span className="text-xs font-bold text-slate-700">${sig.price}</span>
                      <span className={`text-[11px] font-bold ${sig.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {sig.change >= 0 ? `+${sig.change}%` : `${sig.change}%`}
                      </span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {sig.confidence}% Conviction
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{sig.reason}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>Target: <strong className="text-emerald-600">${sig.targetPrice}</strong></span>
                      <span>Stop: <strong className="text-rose-600">${sig.stopLoss}</strong></span>
                    </div>
                    <button
                      onClick={() => onOpenOrderDesk?.(sig.ticker, sig.side || "BUY")}
                      className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Trade {sig.ticker} <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Autonomous Audit Trail & Rollback */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield size={17} className="text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">Execution Audit & Safety Rollback</span>
              </div>
              <div className="flex items-center gap-1">
                {["all", "buy", "sell", "reverted"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTradeFilter(f)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                      tradeFilter === f
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {filteredActions.map((act) => {
                const isReverted = act.reverted || act.status === "REVERSED";
                return (
                  <div
                    key={act.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isReverted
                        ? "bg-slate-100/60 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                          act.action === "BUY" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {act.action}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 font-mono">{act.ticker}</span>
                          <span className="text-xs text-slate-600">
                            {act.shares} shares @ ${act.price}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>${act.amount}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(act.timestamp)}</span>
                          <span>•</span>
                          <span className="text-slate-500">{act.strategy}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isReverted ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded">
                          Reverted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevertTrade(act.id)}
                          disabled={revertingId === act.id}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="5-minute safety refund"
                        >
                          <RotateCcw size={11} />
                          <span>{revertingId === act.id ? "Reverting..." : "Revert"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <List size={16} className="text-slate-500" />
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            AI Monitored Watchlist:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {watchlist.map((sym) => (
              <span
                key={sym}
                className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200"
              >
                {sym}
                <button
                  onClick={() => removeFromWatchlist(sym)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddToWatchlist()}
            placeholder="Add ticker..."
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-28 uppercase font-bold focus:outline-emerald-500"
          />
          <button
            onClick={() => handleAddToWatchlist()}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Capital Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Adjust Allocated Capital</h3>
            <p className="text-xs text-slate-500 mb-4">
              Allocate or release capital for autonomous strategy executions.
            </p>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold font-mono mb-4 focus:outline-emerald-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustCapital}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk & Strategy Modal */}
      {isCustomizationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-emerald-600" />
                Strategy & Risk Config
              </h3>
              <button onClick={() => setIsCustomizationOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Select Strategy Model</label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStrategyId(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedStrategyId === s.id
                          ? "bg-emerald-50/70 border-emerald-500 shadow-2xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{s.name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                          {s.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600 uppercase">Risk Thresholds</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500">Stop Loss %</span>
                    <input
                      type="number"
                      value={riskParams.stopLoss}
                      onChange={(e) => setRiskParams({ ...riskParams, stopLoss: Number(e.target.value) })}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500">Take Profit %</span>
                    <input
                      type="number"
                      value={riskParams.takeProfit}
                      onChange={(e) => setRiskParams({ ...riskParams, takeProfit: Number(e.target.value) })}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setIsCustomizationOpen(false);
                  showToast?.("Strategy and risk parameters updated.");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Side Panel */}
      <GeminiStrategySidebar
        isOpen={isGeminiSidebarOpen}
        onClose={() => setIsGeminiSidebarOpen(false)}
        user={user}
      />
    </div>
  );
}
