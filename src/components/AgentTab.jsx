import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Clock3,
  Gauge,
  ListPlus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Settings,
  PieChart as PieIcon,
  LineChart,
} from "lucide-react";
import {
  deployAgentStrategy,
  pauseAgentStrategy,
  resumeAgentStrategy,
  updateAgentWatchlist,
  confirmAgentTrade,
} from "../api";
import { STRATEGIES } from "../strategies";
import { GeminiStrategySidebar } from "./GeminiStrategySidebar";
import { AgentVisualDashboard } from "./AgentVisualDashboard";
import { AgentTriggerEngine } from "./AgentTriggerEngine";
import { AgentTradeConfirmationModal } from "./AgentTradeConfirmationModal";

const API_URL = import.meta.env.VITE_API_URL || "";

const SECTOR_PRESETS = [
  { label: "AI & Chips", tickers: ["NVDA", "AMD", "ARM", "TSM"] },
  { label: "Mega Caps", tickers: ["AAPL", "MSFT", "AMZN", "GOOGL", "META"] },
  { label: "High Growth", tickers: ["TSLA", "PLTR", "COIN", "CRWD"] },
  { label: "Blue Chips", tickers: ["JNJ", "UNH", "V", "JPM", "WMT"] },
];

async function fetchJsonSafe(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("API fetch error:", err?.message || err);
    return null;
  }
}
const fmtMoney = (v) =>
  `$${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function computeInitialBacktest(strategyKey, ticker, days, initialCapital) {
  const strat = STRATEGIES.find((s) => s.id === strategyKey) || STRATEGIES[0];
  const winRateNum = parseFloat(strat.winRate) || 75;
  const returnMultiplier = ((parseFloat(strat.expectedReturn) || 15) / 100) * (days / 365);
  const stratReturn = Number((returnMultiplier * 100).toFixed(1));
  const benchReturn = Number((stratReturn * 0.65).toFixed(1));
  const finalCapital = Number((initialCapital * (1 + stratReturn / 100)).toFixed(2));
  const totalTrades = Math.floor((days / 30) * 8 + 4);

  const curve = [];
  const stepDays = Math.max(1, Math.floor(days / 12));
  for (let d = 0; d <= days; d += stepDays) {
    const progress = d / days;
    const jitter = (Math.sin(d) * 0.015) * initialCapital;
    const currentVal = initialCapital + (finalCapital - initialCapital) * progress + jitter;
    curve.push({
      day: `D+${d}`,
      value: Number(currentVal.toFixed(2)),
      benchmark: Number((initialCapital * (1 + (benchReturn / 100) * progress)).toFixed(2)),
    });
  }

  return {
    strategy: strat.name,
    ticker,
    days,
    initialCapital,
    finalCapital,
    strategyReturnPct: stratReturn,
    benchmarkReturnPct: benchReturn,
    alphaPct: Number((stratReturn - benchReturn).toFixed(1)),
    winRate: `${winRateNum}%`,
    sharpeRatio: strat.sharpeRatio || 2.4,
    maxDrawdown: strat.maxDrawdown || "-4.2%",
    totalTrades,
    equityCurve: curve,
  };
}

export function AgentTab({
  agentEnabled,
  onToggleAgent,
  onSelectStrategy,
  onChangeMaxSpend,
  agentMaxSpend = 500,
  cashBalance = 0,
  holdings = {},
  stocks = {},
  stockMetaList = [],
  user,
  onRefreshUserData,
  showToast,
  onOpenOrderDesk,
  onGoToMarket,
}) {
  const targetEmail = user?.email || "guestTrader67@stake.com";

  // Strategy configuration state
  const [strategyId, setStrategyId] = useState(user?.agentStrategy || null);
  const [allocation, setAllocation] = useState(String(user?.agentDeployedCapital ?? 0));
  const [maxSpend, setMaxSpend] = useState(String(user?.agentMaxSpend || agentMaxSpend || 500));
  const [riskLevel, setRiskLevel] = useState(user?.riskLevel || "Balanced");
  const [stopLossPct, setStopLossPct] = useState("3.5");
  const [takeProfitPct, setTakeProfitPct] = useState("6.0");

  // Universe Watchlist
  const [watchlist, setWatchlist] = useState([]);
  const [newTickerInput, setNewTickerInput] = useState("");

  // Live Signals & Executed Activity
  const [signals, setSignals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [stakeAiOpen, setStakeAiOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [strategyFlow, setStrategyFlow] = useState(user?.agentStrategy ? "summary" : "picker");

  // High-Value Trade Mandatory Oversight State (> $1,000 threshold)
  const [pendingConfirmationTrade, setPendingConfirmationTrade] = useState(null);
  const [isExecutingConfirmedTrade, setIsExecutingConfirmedTrade] = useState(false);

  // Backtest Simulator State
  const [btStrategy, setBtStrategy] = useState("dip_buyer");
  const [btTicker, setBtTicker] = useState("NVDA");
  const [btDays, setBtDays] = useState(90);
  const [btCapital] = useState(10000);
  const [btRunning, setBtRunning] = useState(false);
  const [btResult, setBtResult] = useState(null);
  const [forecastPrompt, setForecastPrompt] = useState("");
  const [forecastResult, setForecastResult] = useState("");
  const [forecastRunning, setForecastRunning] = useState(false);

  const selectedStrategy = useMemo(
    () => STRATEGIES.find((s) => s.id === strategyId) || null,
    [strategyId]
  );

  const totalPositionsCount = Object.values(holdings || {}).filter(
    (h) => Number(h?.shares || 0) > 0
  ).length;

  const deployedCap = Number(user?.agentDeployedCapital ?? allocation ?? 0);
  const unallocatedCash = Math.max(0, Number(cashBalance || 0) - deployedCap);

  const generateLocalSignals = useCallback((list) => {
    const defaultSignals = list.map((sym) => {
      const stock = stocks[sym] || { price: 150.0, changePercent: 1.5, name: sym };
      const isDip = (stock.changePercent ?? 0) < -0.8;
      const isMom = (stock.changePercent ?? 0) > 1.8;
      return {
        id: `sig-${sym}-${Date.now()}`,
        ticker: sym,
        price: stock.price || 150.0,
        changePercent: stock.changePercent || 0,
        signalType: isDip ? "DIP_BUY_ZONE" : isMom ? "MOMENTUM_SURGE" : "ACCUMULATE",
        side: "BUY",
        confidence: Math.floor(74 + Math.random() * 22),
        rsi: isDip ? "34.5" : isMom ? "68.2" : "51.8",
        reason: isDip
          ? `Intraday pullback (${stock.changePercent}%). Testing key support floor.`
          : isMom
          ? `Volume surge detected (+${stock.changePercent}%). Breakout momentum confirmation.`
          : `Consolidating in statistical mean-reversion corridor.`,
        timestamp: Date.now(),
      };
    });
    setSignals(defaultSignals);
  }, [stocks]);

  // Load signals & activity from API
  const refreshAgentFeed = useCallback(async () => {
    try {
      const encoded = encodeURIComponent(targetEmail);
      const [sigData, actData] = await Promise.all([
        fetchJsonSafe(`${API_URL}/api/agent/signals?userId=${encoded}`),
        fetchJsonSafe(`${API_URL}/api/agent/actions?userId=${encoded}`),
      ]);

      if (sigData?.signals?.length) {
        setSignals(sigData.signals);
      } else {
        generateLocalSignals(watchlist.length ? watchlist : Object.keys(stocks).slice(0, 10));
      }

      if (actData?.actions) {
        setActivity(actData.actions);
      }
    } catch (e) {
      console.warn("Signal refresh error:", e);
      generateLocalSignals(watchlist.length ? watchlist : Object.keys(stocks).slice(0, 10));
    }
  }, [targetEmail, watchlist, stocks, generateLocalSignals]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const encoded = encodeURIComponent(targetEmail);
        const [sigData, actData] = await Promise.all([
          fetchJsonSafe(`${API_URL}/api/agent/signals?userId=${encoded}`),
          fetchJsonSafe(`${API_URL}/api/agent/actions?userId=${encoded}`),
        ]);

        if (!active) return;

        if (sigData?.signals?.length) {
          setSignals(sigData.signals);
        } else {
          generateLocalSignals(watchlist.length ? watchlist : Object.keys(stocks).slice(0, 10));
        }

        if (actData?.actions) {
          setActivity(actData.actions);
        }
      } catch (e) {
        if (active) {
          console.warn("Signal refresh error:", e);
          generateLocalSignals(watchlist.length ? watchlist : Object.keys(stocks).slice(0, 10));
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [targetEmail, watchlist, stocks, generateLocalSignals]);

  // Run Backtest Simulator
  const handleRunBacktest = async () => {
    setBtRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/agent/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: btStrategy,
          ticker: btTicker,
          days: btDays,
          initialCapital: btCapital,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setBtResult(json.result);
          setBtRunning(false);
          return;
        }
      }

      setBtResult(null);
      showToast?.("Historical price data is unavailable for this backtest.");
    } catch (err) {
      console.warn("Historical backtest error:", err);
      setBtResult(null);
      showToast?.("Unable to load historical price data. Try again later.");
    } finally {
      setBtRunning(false);
    }
  };

  const handleForecast = async () => {
    const ticker = btTicker.trim().toUpperCase();
    if (!ticker) {
      showToast?.("Enter a stock symbol first.");
      return;
    }
    setForecastRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/agent/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          years: btDays >= 365 ? Math.round(btDays / 365) : 1,
          question: forecastPrompt,
        }),
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The AI outlook service returned an invalid response.");
      }
      if (!response.ok || !data.success) throw new Error(data.message);
      setForecastResult(data.forecast);
    } catch (error) {
      showToast?.(error.message || "Unable to generate the AI outlook.");
    } finally {
      setForecastRunning(false);
    }
  };

  // Toggle Master Agent Status
  const handleToggleAgent = async () => {
    if (!agentEnabled && !strategyId) {
      setActiveSubTab("rules");
      setStrategyFlow("picker");
      showToast?.("Choose a strategy before activating the engine.");
      return;
    }

    const nextState = !agentEnabled;
    try {
      if (nextState) {
        await resumeAgentStrategy(targetEmail);
      } else {
        await pauseAgentStrategy(targetEmail);
      }
    } catch (e) {
      console.warn("Toggle agent fallback:", e);
    }
    onToggleAgent?.(nextState);
    showToast?.(
      nextState
        ? "⚡ Stake Autonomous Agent is now ACTIVE and scanning"
        : "⏸️ Stake Autonomous Agent paused"
    );
  };

  const runAutonomousScan = useCallback(async () => {
    if (!agentEnabled || !strategyId) return;
    const response = await fetchJsonSafe(`${API_URL}/api/agent/scan-and-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: targetEmail,
        strategy: strategyId,
        maxSpend: Number(maxSpend) || agentMaxSpend,
      }),
    });

    if (response?.requiresConfirmation) {
      setPendingConfirmationTrade(response.pendingTrade);
      return;
    }

    if (response?.success) {
      await onRefreshUserData?.();
      await refreshAgentFeed();
    }
  }, [
    agentEnabled,
    strategyId,
    targetEmail,
    maxSpend,
    agentMaxSpend,
    onRefreshUserData,
    refreshAgentFeed,
  ]);

  useEffect(() => {
    if (!agentEnabled || !strategyId) return undefined;
    const intervalId = window.setInterval(() => {
      runAutonomousScan().catch((error) => {
        console.warn("Autonomous strategy scan error:", error);
      });
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, [agentEnabled, strategyId, runAutonomousScan]);

  // Deploy Strategy & Save Rules
  const handleDeployStrategy = async () => {
    if (!strategyId) {
      showToast?.("Please select an execution strategy.");
      return;
    }
    const allocationValue = Number(allocation);
    if (!Number.isFinite(allocationValue) || allocationValue <= 0) {
      showToast?.("Enter an allocated capital amount before arming a strategy.");
      return;
    }

    setLoading(true);
    try {
      await deployAgentStrategy({
        email: targetEmail,
        userId: targetEmail,
        strategy: strategyId,
        strategyId,
        deployedCapital: allocationValue,
        capitalAllocation: allocationValue,
        maxSpend: Number(maxSpend) || 500,
        maxSpendPerTrade: Number(maxSpend) || 500,
        riskLevel,
        stopLossPct: Number(stopLossPct) || 3.5,
        takeProfitPct: Number(takeProfitPct) || 6.0,
      });

      onSelectStrategy?.(strategyId);
      onChangeMaxSpend?.(Number(maxSpend) || 500);
      onToggleAgent?.(true);

      if (onRefreshUserData) await onRefreshUserData();
      await refreshAgentFeed();

      showToast?.(`✅ ${selectedStrategy?.name || "Strategy"} successfully deployed and armed.`);
      setStrategyFlow("summary");
    } catch (err) {
      console.warn("Deploy error:", err);
      showToast?.(err.message || "Unable to deploy strategy.");
    } finally {
      setLoading(false);
    }
  };

  // Scan the configured universe for recommendations. Execution remains
  // limited to the selected strategy budget and the explicit order desk.
  const handleScanAndExecute = async () => {
    setScanLoading(true);
    try {
      await refreshAgentFeed();
      showToast?.("Signal Radar refreshed with the best available opportunities. No budget was used.");
    } catch (err) {
      console.warn("Scan error:", err);
      showToast?.(err.message || "Unable to refresh Signal Radar.");
    } finally {
      setScanLoading(false);
    }
  };

  // Authorize & Execute Confirmed High-Value Agent Trade
  const handleConfirmTradeExecution = async (tradeToExecute) => {
    if (!tradeToExecute) return;
    setIsExecutingConfirmedTrade(true);
    try {
      const res = await confirmAgentTrade({
        email: targetEmail,
        userId: targetEmail,
        ticker: tradeToExecute.ticker,
        side: tradeToExecute.side,
        shares: tradeToExecute.shares,
        price: tradeToExecute.price,
        orderType: tradeToExecute.orderType || "MKT",
        strategy: tradeToExecute.strategy,
        reason: tradeToExecute.reason,
      });

      if (res.success) {
        showToast?.(`✅ High-value trade authorized & executed: ${tradeToExecute.shares}x ${tradeToExecute.ticker} ($${Number(tradeToExecute.total).toLocaleString()})`);
        setPendingConfirmationTrade(null);
        if (onRefreshUserData) await onRefreshUserData();
        await refreshAgentFeed();
      } else {
        showToast?.(res.message || "Failed to execute authorized trade.");
      }
    } catch (err) {
      console.error("Authorize trade error:", err);
      showToast?.("Communication error executing authorized order.");
    } finally {
      setIsExecutingConfirmedTrade(false);
    }
  };

  // Revert recent trade
  const handleRevertTrade = async (actionId) => {
    try {
      await fetch(`${API_URL}/api/agent/revert-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, actionId }),
      });
      showToast?.("Trade reversed in ledger.");
      if (onRefreshUserData) await onRefreshUserData();
      await refreshAgentFeed();
    } catch (e) {
      console.warn("Revert trade error:", e);
      showToast?.("Revert request logged.");
    }
  };

  // Watchlist Management
  const handleAddTicker = async (tickerToAdd) => {
    const sym = (tickerToAdd || newTickerInput).trim().toUpperCase();
    if (!sym) return;
    if (!watchlist.includes(sym)) {
      const updated = [...watchlist, sym].slice(0, 15);
      setWatchlist(updated);
      setNewTickerInput("");
      try {
        await updateAgentWatchlist({ email: targetEmail, watchlist: updated });
      } catch (err) {
        console.warn("Watchlist update error:", err);
      }
      showToast?.(`Added ${sym} to agent universe.`);
    }
  };

  const handleRemoveTicker = async (sym) => {
    const updated = watchlist.filter((item) => item !== sym);
    setWatchlist(updated);
    try {
      await updateAgentWatchlist({ email: targetEmail, watchlist: updated });
    } catch (err) {
      console.warn("Watchlist remove error:", err);
    }
  };

  const handleApplyPreset = async (preset) => {
    const combined = Array.from(new Set([...watchlist, ...preset.tickers])).slice(0, 15);
    setWatchlist(combined);
    try {
      await updateAgentWatchlist({ email: targetEmail, watchlist: combined });
    } catch (err) {
      console.warn("Preset apply error:", err);
    }
    showToast?.(`Loaded ${preset.label} into universe.`);
  };


  return (
    <div className="stake-agent-workspace min-h-screen bg-[#06110c] text-white px-3 sm:px-6 py-6 pb-28 font-sans max-w-7xl mx-auto space-y-6">
      {/* ============================================================
          TOP HERO / COMMAND CENTER
         ============================================================ */}
      <section className="stake-agent-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1f14] via-[#06110c] to-[#030907] text-white p-6 sm:p-8 shadow-2xl border border-emerald-500/20">
        {/* Animated background gradients */}
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -left-24 -bottom-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,153,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {agentEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Scanning
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white m-0 leading-tight">
              AI Trade.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Algorithmic Execution & Market Intelligence.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl">
              Deploy quantitative strategies with real-time signal detection, automated execution, and intelligent risk guardrails. In a new account, this desk starts clean and dynamically populates as AI executes.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="agent-master-toggle-btn"
              type="button"
              onClick={handleToggleAgent}
              className={`stake-agent-primary-action inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md border ${
                agentEnabled
                  ? "stake-agent-pause-action bg-rose-600 hover:bg-rose-700 border-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
              }`}
            >
              {agentEnabled ? <Pause size={15} /> : <Play size={15} />}
              <span>{agentEnabled ? "Pause Engine" : "Activate Engine"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("rules");
                setStrategyFlow("picker");
              }}
              aria-label="Open strategies and risk settings"
              title="Strategies & Risk"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-slate-900/70 text-emerald-300 transition-all hover:bg-emerald-500/15 hover:text-emerald-200 cursor-pointer"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="relative mt-8 pt-6 border-t border-emerald-500/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="group bg-slate-900/40 p-4 rounded-2xl border border-emerald-500/15 backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
              <Activity size={12} />
              Engine Status
            </div>
            <div className="mt-2 font-black text-sm sm:text-base flex items-center gap-2 text-white">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  agentEnabled ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                }`}
              />
              <span>{agentEnabled ? "Live & Armed" : "Paused"}</span>
            </div>
          </div>

          <div className="group bg-slate-900/40 p-4 rounded-2xl border border-emerald-500/15 backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
              <CircleDollarSign size={12} />
              Allocated Capital
            </div>
            <div className="mt-2 font-mono font-black text-sm sm:text-base text-emerald-400">
              {fmtMoney(deployedCap)}
            </div>
          </div>

          <div className="group bg-slate-900/40 p-4 rounded-2xl border border-emerald-500/15 backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
              <ShieldCheck size={12} />
              Available Cash
            </div>
            <div className="mt-2 font-mono font-black text-sm sm:text-base text-slate-200">
              {fmtMoney(cashBalance)}
            </div>
          </div>

          <div className="group bg-slate-900/40 p-4 rounded-2xl border border-emerald-500/15 backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
              <TrendingUp size={12} />
              Open Positions
            </div>
            <div className="mt-2 font-mono font-black text-sm sm:text-base text-white">
              {totalPositionsCount} Asset{totalPositionsCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          NAVIGATION SUB-TABS
         ============================================================ */}
      <div className="stake-agent-tabs flex items-center gap-2 border-b border-emerald-500/15 pb-3 overflow-x-auto">
        {[
          { id: "overview", label: "Visual Dashboard & Risk", icon: PieIcon },
          { id: "radar", label: "Signal Radar", icon: Activity },
          { id: "backtest", label: "Simulator", icon: LineChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                active
                  ? "stake-agent-tab-active bg-emerald-600 text-white border-emerald-700 shadow-md"
                  : "bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================
          SUB-TAB 0: VISUAL DASHBOARD & RISK EXPOSURE
         ============================================================ */}
      {activeSubTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <AgentVisualDashboard
            holdings={holdings}
            stocks={stocks}
            stockMetaList={stockMetaList}
            cashBalance={cashBalance}
            user={user}
            agentMaxSpend={agentMaxSpend}
            onOpenOrderDesk={onOpenOrderDesk}
            onGoToMarket={onGoToMarket}
            showToast={showToast}
          />

        </div>
      )}

      {/* ============================================================
          SUB-TAB 1: SIGNAL RADAR & LIVE OPPORTUNITY STREAM
         ============================================================ */}
      {activeSubTab === "radar" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Live Signal Feed */}
            <div className="rounded-3xl border border-emerald-500/15 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400">
                    Live Algorithmic Radar
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Best Opportunities Outside Agent Budget
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Recommendations only. Signal Radar never spends the strategy allocation; use the Order Desk if you want to place a separate manual trade.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScanAndExecute}
                    disabled={scanLoading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#06110c] text-xs font-black cursor-pointer transition-all shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-emerald-400/30"
                  >
                    <RefreshCw size={13} className={scanLoading ? "animate-spin" : ""} />
                    <span>{scanLoading ? "Finding Opportunities..." : "Find Best Opportunities"}</span>
                  </button>
                </div>
              </div>

              {/* Signals Grid */}
              <div className="mt-5 space-y-3.5">
                {signals.length > 0 ? (
                  signals.map((sig) => {
                    const isDip = sig.signalType === "DIP_BUY_ZONE";
                    const isMom = sig.signalType === "MOMENTUM_SURGE";
                    const stock = stocks[sig.ticker] || { price: sig.price || 150 };
                    const curPrice = stock.price || sig.price || 150;
                    const changePct = stock.changePercent ?? sig.changePercent ?? 1.2;
                    const isUp = changePct >= 0;

                    return (
                      <div
                        key={sig.id || sig.ticker}
                        className="p-4 rounded-2xl border border-emerald-500/15 bg-slate-900/60 hover:bg-slate-900/80 hover:border-emerald-500/30 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border ${
                              isDip
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : isMom
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {sig.ticker.slice(0, 3)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-black text-white">
                                {sig.ticker}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-300">
                                {fmtMoney(curPrice)}
                              </span>
                              <span
                                className={`text-[11px] font-bold ${
                                  isUp ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {isUp ? "+" : ""}
                                {Number(changePct).toFixed(2)}%
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                                  isDip
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    : isMom
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                {sig.signalType || "ACCUMULATE"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {sig.reason}
                            </p>

                            <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                              <span>Confidence: <strong className="text-slate-200">{sig.confidence || 82}%</strong></span>
                              <span>RSI: <strong className="font-mono text-slate-200">{sig.rsi || "48.2"}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => onOpenOrderDesk?.(sig.ticker, sig.side || "BUY")}
                            className="p-2 rounded-xl border border-emerald-500/15 hover:bg-slate-900/80 text-emerald-400 cursor-pointer transition-all backdrop-blur-md"
                            title="Open in Order Desk"
                          >
                            <ArrowUpRight size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-emerald-500/15 bg-slate-900/40 backdrop-blur-md">
                    <TrendingUp size={28} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-300">No signals detected yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click 'Scan Market Now' to trigger strategy evaluation across your watchlist.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Watchlist Universe Manager */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-500/15 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
                  <div>
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400">
                      Universe Control
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Target Watchlist
                    </h3>
                  </div>
                  <ListPlus className="text-emerald-400" size={20} />
                </div>

                {/* Quick Presets */}
                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Sector Presets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTOR_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleApplyPreset(preset)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/60 hover:bg-slate-900/80 text-emerald-400 border border-emerald-500/15 cursor-pointer transition-all backdrop-blur-md"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Tickers Chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {watchlist.map((sym) => {
                    const st = stocks[sym] || { price: 150 };
                    return (
                      <span
                        key={sym}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-emerald-500/15 font-mono text-xs font-black text-slate-200 shadow-sm backdrop-blur-md"
                      >
                        <span>{sym}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {fmtMoney(st.price || 150)}
                        </span>
                        <button
                          onClick={() => handleRemoveTicker(sym)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Add Custom Ticker Input */}
                <div className="mt-5 flex gap-2">
                  <input
                    value={newTickerInput}
                    onChange={(e) => setNewTickerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                    placeholder="Add ticker (e.g. NVDA, TSLA)"
                    className="min-w-0 flex-1 rounded-xl border border-emerald-500/15 bg-slate-900/60 px-3.5 py-2 text-xs font-bold uppercase text-white placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-emerald-500 backdrop-blur-md"
                  />
                  <button
                    onClick={() => handleAddTicker()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#06110c] rounded-xl text-xs font-black cursor-pointer transition-all shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-emerald-400/30"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Stake AI Quick Prompt Assistant */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-[#06110c] flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                  <h4 className="text-sm font-extrabold text-white m-0">Stake AI Intelligence</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Ask Gemini 2.5 Flash to evaluate your portfolio diversification, suggest parameter tweaks, or analyze price action.
                </p>
                <button
                  onClick={() => setStakeAiOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06110c] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-emerald-400/30"
                >
                  <Sparkles size={13} className="text-[#06110c]" />
                  <span>Open Stake AI Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Activity Audit Ledger */}
          <div className="rounded-3xl border border-emerald-500/15 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400">
                  Execution Audit Ledger
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Recent Autonomous Orders
                </h3>
              </div>
              <Clock3 className="text-emerald-400" size={20} />
            </div>

            {activity.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activity.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/15 flex items-center justify-between gap-3 shadow-sm backdrop-blur-md hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 border ${
                          item.side === "SELL" || item.action === "SELL"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {item.side || item.action || "BUY"}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-black text-white">
                          {item.ticker} • {item.shares} shs
                        </div>
                        <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                          {fmtMoney(item.total || item.amount || item.price * item.shares)} •{" "}
                          {item.status || "FILLED"}
                        </div>
                      </div>
                    </div>

                    {item.status !== "REVERSED" && (
                      <button
                        onClick={() => handleRevertTrade(item.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer transition-all border border-emerald-500/15 backdrop-blur-md"
                        title="Revert trade in sandbox"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 p-6 rounded-2xl border border-dashed border-emerald-500/15 bg-slate-900/40 text-center backdrop-blur-md">
                <CircleDollarSign className="mx-auto text-slate-500 mb-1" size={24} />
                <p className="text-xs font-bold text-slate-300">No autonomous executions logged yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Arm your strategy or click 'Scan Market Now' to trigger trades.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SUB-TAB 2: STRATEGY BACKTEST SIMULATOR
         ============================================================ */}
      {activeSubTab === "backtest" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  Historical Performance
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Historical Strategy Backtester
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Review actual historical daily prices for the selected stock over the chosen period. This does not change your portfolio or agent budget.
                </p>
              </div>

              {/* Simulation Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={btStrategy}
                  onChange={(e) => setBtStrategy(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <input
                  value={btTicker}
                  onChange={(e) => setBtTicker(e.target.value.toUpperCase())}
                  placeholder="Any ticker"
                  aria-label="Stock ticker"
                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={btDays}
                  onChange={(e) => setBtDays(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>1 Year</option>
                </select>

                <button
                  onClick={handleRunBacktest}
                  disabled={btRunning}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={btRunning ? "animate-spin" : ""} />
                  <span>{btRunning ? "Loading History..." : "Run Historical Backtest"}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">AI multi-year outlook</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Ask Gemini about any ticker you imported or enter a new symbol. This is an AI scenario, not a guaranteed price.
                  </p>
                </div>
                <textarea
                  value={forecastPrompt}
                  onChange={(event) => setForecastPrompt(event.target.value)}
                  placeholder="What could drive this stock over the next 3–5 years?"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 resize-y"
                />
                <button
                  type="button"
                  onClick={handleForecast}
                  disabled={forecastRunning}
                  className="self-start rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
                >
                  {forecastRunning ? "Generating outlook..." : `Generate ${btTicker || "stock"} outlook`}
                </button>
                {forecastResult && (
                  <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                    {forecastResult}
                  </div>
                )}
              </div>
            </div>

            {/* Backtest Results Display */}
            {btResult && (
              <div className="mt-6 space-y-6">
                {/* Result KPI Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                    <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wide">
                      Strategy Net Return
                    </div>
                    <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-emerald-700">
                      +{btResult.strategyReturnPct}%
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      Alpha vs Hold: +{btResult.alphaPct}%
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                      Win Rate
                    </div>
                    <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-slate-900">
                      {btResult.winRate}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Total Trades: {btResult.totalTrades}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                      Sharpe Ratio
                    </div>
                    <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-slate-900">
                      {btResult.sharpeRatio}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Risk-Adjusted Alpha
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                      Max Drawdown
                    </div>
                    <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-rose-600">
                      {btResult.maxDrawdown}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Capital Protection Guard
                    </div>
                  </div>
                </div>

                {/* Visual SVG Equity Curve Chart */}
                <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 m-0">
                        Equity Growth Curve vs Benchmark ({btResult.ticker})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Initial Capital: {fmtMoney(btResult.initialCapital)} → Final Capital:{" "}
                        {fmtMoney(btResult.finalCapital)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                        Strategy ({btResult.strategy})
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-3 h-1 bg-slate-400 rounded-full" />
                        Buy & Hold
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Rendering */}
                  {btResult.equityCurve && btResult.equityCurve.length > 1 && (
                    <div className="w-full h-44 sm:h-52 relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 600 160"
                        preserveAspectRatio="none"
                      >
                        {/* Grid lines */}
                        <line x1="0" y1="40" x2="600" y2="40" stroke="#e2e8f0" strokeDasharray="4" />
                        <line x1="0" y1="80" x2="600" y2="80" stroke="#e2e8f0" strokeDasharray="4" />
                        <line x1="0" y1="120" x2="600" y2="120" stroke="#e2e8f0" strokeDasharray="4" />

                        {/* Strategy Line */}
                        {(() => {
                          const pts = btResult.equityCurve;
                          const minVal = Math.min(...pts.map((p) => Math.min(p.value, p.benchmark))) * 0.98;
                          const maxVal = Math.max(...pts.map((p) => Math.max(p.value, p.benchmark))) * 1.02;
                          const range = maxVal - minVal || 1;

                          const stratCoords = pts.map((p, idx) => {
                            const x = (idx / (pts.length - 1)) * 600;
                            const y = 160 - ((p.value - minVal) / range) * 140 - 10;
                            return `${x},${y}`;
                          }).join(" ");

                          const benchCoords = pts.map((p, idx) => {
                            const x = (idx / (pts.length - 1)) * 600;
                            const y = 160 - ((p.benchmark - minVal) / range) * 140 - 10;
                            return `${x},${y}`;
                          }).join(" ");

                          return (
                            <>
                              <polyline
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="3 3"
                                points={benchCoords}
                              />
                              <polyline
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={stratCoords}
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SUB-TAB 3: STRATEGY & GUARDRAILS CONFIGURATION
         ============================================================ */}
      {activeSubTab === "rules" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Strategy Selectors */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Execution Algorithm
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    Select Strategy Profile
                  </h2>
                </div>
                <ShieldCheck className="text-emerald-500" size={22} />
              </div>

              {strategyFlow === "picker" && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 animate-in slide-in-from-left-4 duration-300">
                  {STRATEGIES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setStrategyId(item.id);
                        setAllocation(String(item.allocationPreset));
                        setMaxSpend(String(item.maxSpendPreset));
                        setRiskLevel(item.profile === "conservative" ? "Conservative" : item.profile === "growth" ? "Growth" : "Balanced");
                        setStrategyFlow("risk");
                      }}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{item.name}</span>
                          <ArrowUpRight size={15} className="text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.simpleDescription || item.description}
                        </p>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Signal strength</span>
                            <span className="text-emerald-700">{item.signalIntensity}%</span>
                          </div>
                          <div
                            className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200"
                            role="meter"
                            aria-label={`${item.name} signal strength`}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow={item.signalIntensity}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all"
                              style={{ width: `${item.signalIntensity}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] font-bold text-slate-600">
                        <span>APY: <strong className="text-emerald-700">{item.expectedReturn}</strong></span>
                        <span>Win: <strong className="text-slate-800">{item.winRate}</strong></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {strategyFlow === "risk" && (
              <div className="mt-5 animate-in slide-in-from-right-6 duration-300">
                <button onClick={() => setStrategyFlow("picker")} className="text-xs font-bold text-slate-500 hover:text-emerald-700 cursor-pointer mb-5">← Choose a different strategy</button>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Selected strategy</p>
                  <p className="mt-1 text-base font-black text-slate-900">{selectedStrategy?.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{selectedStrategy?.tagline}</p>
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">Quantitative Risk Parameters</h4>
                <p className="text-xs text-slate-500 mb-4">Set a hard spending ceiling, automatic stop-losses, and a five-minute window to revert any order the agent placed.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-1">
                      Allocated Capital ($)
                    </label>
                    <input
                      type="number"
                      value={allocation}
                      onChange={(e) => setAllocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-1">
                      Max Spend Per Order ($)
                    </label>
                    <input
                      type="number"
                      value={maxSpend}
                      onChange={(e) => setMaxSpend(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-1">
                      Risk Profile
                    </label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Growth">Growth / High Alpha</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-1">
                      Stop-Loss Limit (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={stopLossPct}
                      onChange={(e) => setStopLossPct(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-1">
                      Take-Profit Target (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={takeProfitPct}
                      onChange={(e) => setTakeProfitPct(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                  <RotateCcw size={17} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div><p className="text-xs font-black text-slate-900">Five-minute order reversal</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Every agent order remains available to reverse for five minutes after placement.</p></div>
                </div>

                <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 flex items-start gap-3">
                  <ShieldAlert size={17} className="mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900">Mandatory High-Value Trade Oversight</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                        &gt; $1,000 Threshold
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      All agent-initiated orders exceeding $1,000 require manual human approval via the mandatory confirmation dialog before execution.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end">
                  <button
                    onClick={handleDeployStrategy}
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-xs flex items-center gap-2"
                  >
                    <Zap size={14} />
                    <span>{loading ? "Saving..." : "Save Strategy"}</span>
                  </button>
                </div>
              </div>
              )}

              {strategyFlow === "summary" && (
                <div className="mt-5 animate-in slide-in-from-right-6 duration-300">
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Current strategy</p><h3 className="mt-1 text-xl font-black text-slate-900">{selectedStrategy?.name || "No strategy selected"}</h3><p className="mt-1 text-xs text-slate-600">{selectedStrategy?.tagline || "Choose a strategy to begin."}</p></div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white"><Check size={12} /> SAVED</span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-white border border-emerald-100 p-3"><p className="text-slate-500">Spend ceiling</p><strong className="mt-1 block text-slate-900">{fmtMoney(maxSpend)} / order</strong></div>
                      <div className="rounded-xl bg-white border border-emerald-100 p-3"><p className="text-slate-500">Stop-loss</p><strong className="mt-1 block text-slate-900">{stopLossPct}% automatic</strong></div>
                    </div>
                  </div>
                  <button onClick={() => setStrategyFlow("risk")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-black text-white transition-all cursor-pointer"><SlidersHorizontal size={14} /> Edit strategy</button>
                </div>
              )}
            </div>

            {/* Capital Allocation & Drawdown Defense */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Guardrails
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    Drawdown Protection
                  </h3>
                </div>
                <Gauge className="text-amber-500" size={22} />
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Strategy Allocation</span>
                  <strong className="font-mono text-sm text-slate-900">{fmtMoney(allocation)}</strong>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Unallocated Reserves</span>
                  <strong className="font-mono text-sm text-emerald-600">{fmtMoney(unallocatedCash)}</strong>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Order Spend Ceiling</span>
                  <strong className="font-mono text-sm text-slate-900">{fmtMoney(maxSpend)} / fill</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-700" />
                  Automated Circuit Breaker
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  If total intraday portfolio delta drops by more than {stopLossPct}%, the engine halts new automated orders until manual review.
                </p>
              </div>
            </div>
          </div>

          <AgentTriggerEngine
            stocks={stocks}
            showToast={showToast}
            onOpenOrderDesk={onOpenOrderDesk}
          />
        </div>
      )}

      {/* Embedded Gemini Strategy Sidebar Drawer */}
      <GeminiStrategySidebar
        isOpen={stakeAiOpen}
        onClose={() => setStakeAiOpen(false)}
        user={user}
        onRefreshUserData={onRefreshUserData}
      />

      {/* Mandatory Confirmation Modal for High-Value Agent Trades (> $1,000) */}
      <AgentTradeConfirmationModal
        isOpen={Boolean(pendingConfirmationTrade)}
        onClose={() => setPendingConfirmationTrade(null)}
        onConfirm={handleConfirmTradeExecution}
        trade={pendingConfirmationTrade}
        cashBalance={Number(cashBalance ?? user?.cash ?? 0)}
        isExecuting={isExecutingConfirmedTrade}
      />
    </div>
  );
}
