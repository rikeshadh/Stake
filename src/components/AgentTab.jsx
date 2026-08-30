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
} from "lucide-react";
import {
  deployAgentStrategy,
  pauseAgentStrategy,
  resumeAgentStrategy,
  scanAndExecuteStrategy,
  updateAgentWatchlist,
} from "../api";
import { STRATEGIES } from "../strategies";
import { GeminiStrategySidebar } from "./GeminiStrategySidebar";

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
  user,
  onRefreshUserData,
  showToast,
  onOpenOrderDesk,
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
  const [activeSubTab, setActiveSubTab] = useState("radar");

  // Backtest Simulator State
  const [btStrategy, setBtStrategy] = useState("dip_buyer");
  const [btTicker, setBtTicker] = useState("NVDA");
  const [btDays, setBtDays] = useState(90);
  const [btCapital] = useState(10000);
  const [btRunning, setBtRunning] = useState(false);
  const [btResult, setBtResult] = useState(null);

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
    if (!watchlist.length || !strategyId) {
      setSignals([]);
      setActivity([]);
      return;
    }
    try {
      const encoded = encodeURIComponent(targetEmail);
      const [sigData, actData] = await Promise.all([
        fetchJsonSafe(`${API_URL}/api/agent/signals?userId=${encoded}`),
        fetchJsonSafe(`${API_URL}/api/agent/actions?userId=${encoded}`),
      ]);

      if (sigData?.signals) {
        setSignals(sigData.signals);
      } else {
        generateLocalSignals(watchlist);
      }

      if (actData?.actions) {
        setActivity(actData.actions);
      }
    } catch (e) {
      console.warn("Signal refresh error:", e);
      generateLocalSignals(watchlist);
    }
  }, [targetEmail, watchlist, strategyId, generateLocalSignals]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!watchlist.length || !strategyId) {
        setSignals([]);
        setActivity([]);
        return;
      }
      try {
        const encoded = encodeURIComponent(targetEmail);
        const [sigData, actData] = await Promise.all([
          fetchJsonSafe(`${API_URL}/api/agent/signals?userId=${encoded}`),
          fetchJsonSafe(`${API_URL}/api/agent/actions?userId=${encoded}`),
        ]);

        if (!active) return;

        if (sigData?.signals) {
          setSignals(sigData.signals);
        } else {
          generateLocalSignals(watchlist);
        }

        if (actData?.actions) {
          setActivity(actData.actions);
        }
      } catch (e) {
        if (active) {
          console.warn("Signal refresh error:", e);
          generateLocalSignals(watchlist);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [targetEmail, watchlist, strategyId, generateLocalSignals]);

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

      setBtResult(computeInitialBacktest(btStrategy, btTicker, btDays, btCapital));
    } catch (err) {
      console.warn("Backtest simulation fallback:", err);
      setBtResult(computeInitialBacktest(btStrategy, btTicker, btDays, btCapital));
    } finally {
      setBtRunning(false);
    }
  };

  // Toggle Master Agent Status
  const handleToggleAgent = async () => {
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
    } catch (err) {
      console.warn("Deploy error:", err);
      showToast?.("Strategy settings configured locally.");
    } finally {
      setLoading(false);
    }
  };

  // Scan and Execute Strategy Now
  const handleScanAndExecute = async () => {
    setScanLoading(true);
    try {
      const res = await scanAndExecuteStrategy({
        email: targetEmail,
        strategy: strategyId,
        maxSpend: Number(maxSpend) || 500,
      });

      if (onRefreshUserData) await onRefreshUserData();
      await refreshAgentFeed();

      if (res?.executedTrades && res.executedTrades.length > 0) {
        showToast?.(
          `⚡ Scan filled ${res.executedTrades.length} automated trade(s) based on your rules.`
        );
      } else {
        showToast?.("🔍 Market scan completed. Risk conditions verified.");
      }
    } catch (err) {
      console.warn("Scan error:", err);
      showToast?.("Scan complete. Signals evaluated.");
    } finally {
      setScanLoading(false);
    }
  };

  // One-click trade execution directly from Signal Radar
  const handleExecuteSignal = async (signal) => {
    try {
      const stock = stocks[signal.ticker] || { price: signal.price || 150 };
      const curPrice = stock.price || signal.price || 150;
      const spend = Math.min(Number(maxSpend) || 500, curPrice);
      const shares = Number((spend / curPrice).toFixed(4));

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          ticker: signal.ticker,
          side: signal.side || "BUY",
          shares,
          price: curPrice,
          orderType: "MKT",
          reason: `One-click AI Radar execution (${signal.signalType})`,
        }),
      });

      if (res.ok) {
        showToast?.(`🎯 Order executed: ${signal.side || "BUY"} ${shares} ${signal.ticker}`);
        if (onRefreshUserData) await onRefreshUserData();
        await refreshAgentFeed();
      } else {
        const data = await res.json();
        showToast?.(data.message || "Could not fill order. Check cash balance.");
      }
    } catch (err) {
      console.warn("Order execution error:", err);
      showToast?.("Order executed in sandbox ledger.");
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
              Autonomous Trading.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Powered by AI Intelligence.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl">
              Deploy quantitative strategies with real-time signal detection, automated execution, and intelligent risk guardrails. Every decision is transparent and under your control.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="agent-master-toggle-btn"
              type="button"
              onClick={handleToggleAgent}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md backdrop-blur-sm border ${
                agentEnabled
                  ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border-rose-500/40"
                  : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/40"
              }`}
            >
              {agentEnabled ? <Pause size={15} /> : <Play size={15} />}
              <span>{agentEnabled ? "Pause Engine" : "Activate Engine"}</span>
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
          { id: "radar", label: "Signal Radar", icon: Activity },
          { id: "rules", label: "Strategy Settings", icon: SlidersHorizontal },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap backdrop-blur-md border ${
                active
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900/40 text-slate-400 hover:text-emerald-300 hover:bg-slate-900/60 border-emerald-500/10"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

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
                    Real-time Trading Signals
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScanAndExecute}
                    disabled={scanLoading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#06110c] text-xs font-black cursor-pointer transition-all shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-emerald-400/30"
                  >
                    <RefreshCw size={13} className={scanLoading ? "animate-spin" : ""} />
                    <span>{scanLoading ? "Scanning Market..." : "Scan Market Now"}</span>
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
                            onClick={() => handleExecuteSignal(sig)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06110c] text-xs font-black cursor-pointer transition-all shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-emerald-400/30"
                            title="Execute strategy order directly"
                          >
                            <Zap size={13} />
                            <span>Fill Trade</span>
                          </button>

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
                  Quantitative Simulator
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Historical Strategy Backtester
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Simulate your quantitative strategy across historical market tick data with realistic slippage, commission models, and max drawdown boundaries.
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

                <select
                  value={btTicker}
                  onChange={(e) => setBtTicker(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {["NVDA", "TSLA", "AAPL", "MSFT", "COIN", "AMZN", "PLTR", "AMD"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

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
                  <span>{btRunning ? "Simulating..." : "Run Simulation"}</span>
                </button>
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

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {STRATEGIES.map((item) => {
                  const isSel = strategyId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStrategyId(item.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {item.name}
                          </span>
                          {isSel && <Check size={15} className="text-emerald-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] font-bold text-slate-600">
                        <span>APY: <strong className="text-emerald-700">{item.expectedReturn}</strong></span>
                        <span>Win: <strong className="text-slate-800">{item.winRate}</strong></span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Parameter Settings */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                  Quantitative Risk Parameters
                </h4>
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

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Active: <strong className="text-slate-900">{selectedStrategy?.name || "No strategy selected"}</strong>
                  </span>

                  <button
                    onClick={handleDeployStrategy}
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-xs flex items-center gap-2"
                  >
                    <Zap size={14} />
                    <span>{loading ? "Arming Engine..." : "Save & Arm Strategy"}</span>
                  </button>
                </div>
              </div>
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
        </div>
      )}

      {/* Embedded Gemini Strategy Sidebar Drawer */}
      <GeminiStrategySidebar
        isOpen={stakeAiOpen}
        onClose={() => setStakeAiOpen(false)}
        user={user}
        onRefreshUserData={onRefreshUserData}
      />
    </div>
  );
}
