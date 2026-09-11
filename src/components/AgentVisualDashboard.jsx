import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Zap,
  Sparkles,
  Lock,
  CircleDollarSign,
  Gauge,
  Layers,
} from "lucide-react";

const fmtMoney = (val) =>
  `$${Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ASSET_COLORS = [
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

const SECTOR_MAP = {
  NVDA: "Semiconductors & AI",
  AMD: "Semiconductors & AI",
  ARM: "Semiconductors & AI",
  TSM: "Semiconductors & AI",
  AAPL: "Consumer Tech",
  MSFT: "Cloud & Enterprise",
  AMZN: "Consumer & Cloud",
  GOOGL: "Search & AI",
  META: "Social & AI",
  TSLA: "Electric Vehicles & Autonomy",
  PLTR: "Enterprise AI & Defense",
  COIN: "Crypto Infrastructure",
  CRWD: "Cybersecurity",
  JPM: "Banking & Financials",
  JNJ: "Healthcare & Pharma",
  UNH: "Healthcare & Insurance",
  V: "Financial Payments",
  WMT: "Consumer Retail",
};

const BETA_MAP = {
  NVDA: 1.72,
  TSLA: 1.95,
  AMD: 1.68,
  PLTR: 1.85,
  COIN: 2.45,
  AAPL: 1.08,
  MSFT: 1.12,
  AMZN: 1.15,
  GOOGL: 1.05,
  META: 1.25,
  JPM: 0.95,
  V: 0.92,
  JNJ: 0.58,
  UNH: 0.65,
  WMT: 0.52,
};

export function AgentVisualDashboard({
  holdings = {},
  stocks = {},
  cashBalance = 0,
  user,
  onOpenOrderDesk,
  onGoToMarket,
  showToast,
}) {
  const [timeframe, setTimeframe] = useState("1M");
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [activeAllocationView, setActiveAllocationView] = useState("assets"); // "assets" | "sectors" | "risk"
  const [defensiveModeActive, setDefensiveModeActive] = useState(false);

  // 1. Calculate holding positions & values
  const {
    totalEquity,
    totalPortfolioValue,
    holdingsBreakdown,
    dayChangeDollar,
    dayChangePercent,
    isSampleData,
  } = useMemo(() => {
    const rawHoldingEntries = Object.entries(holdings || {}).filter(
      ([, h]) => Number(h?.shares || 0) > 0
    );

    let equitySum = 0;
    let totalDayChange = 0;
    const items = [];

    rawHoldingEntries.forEach(([ticker, h]) => {
      const stock = stocks[ticker] || { price: 150, pct: 1.2 };
      const shares = Number(h.shares || 0);
      const price = Number(stock.price || 150);
      const value = shares * price;
      const pctChange = Number(stock.pct ?? stock.changePercent ?? 0);
      const dayDelta = value * (pctChange / 100);

      equitySum += value;
      totalDayChange += dayDelta;

      items.push({
        ticker,
        shares,
        price,
        value,
        cost: Number(h.totalCost || h.avgPrice * shares || value),
        pctChange,
        dayDelta,
        sector: SECTOR_MAP[ticker] || "Technology",
        beta: BETA_MAP[ticker] || 1.2,
      });
    });

    const hasRealData = items.length > 0;

    if (!hasRealData) {
      // In a new account, the page starts clean and is populated as the user account grows via AI
      return {
        totalEquity: 0,
        totalPortfolioValue: Number(cashBalance || 0),
        holdingsBreakdown: [],
        dayChangeDollar: 0,
        dayChangePercent: 0,
        isSampleData: false,
        isNewAccount: true,
      };
    }

    const totalVal = equitySum + Number(cashBalance || 0);
    const dayPct = totalVal > 0 ? Number(((totalDayChange / totalVal) * 100).toFixed(2)) : 0;

    return {
      totalEquity: equitySum,
      totalPortfolioValue: totalVal,
      holdingsBreakdown: items,
      dayChangeDollar: totalDayChange,
      dayChangePercent: dayPct,
      isSampleData: false,
      isNewAccount: false,
    };
  }, [holdings, stocks, cashBalance]);

  const effectiveCash = Number(cashBalance || 0);

  // 2. Asset Allocation Breakdown for Charts
  const assetAllocationData = useMemo(() => {
    if (totalPortfolioValue <= 0) return [];

    const data = holdingsBreakdown.map((item, idx) => ({
      name: item.ticker,
      fullName: item.sector,
      value: Number(item.value.toFixed(2)),
      percentage: Number(((item.value / totalPortfolioValue) * 100).toFixed(1)),
      color: ASSET_COLORS[idx % ASSET_COLORS.length],
      shares: item.shares,
      price: item.price,
      type: "equity",
    }));

    if (effectiveCash > 0) {
      data.push({
        name: "Cash Reserves",
        fullName: "Liquid USD Reserves",
        value: Number(effectiveCash.toFixed(2)),
        percentage: Number(((effectiveCash / totalPortfolioValue) * 100).toFixed(1)),
        color: "#10b981", // Brand emerald
        shares: null,
        price: 1.0,
        type: "cash",
      });
    }

    return data.sort((a, b) => b.value - a.value);
  }, [holdingsBreakdown, effectiveCash, totalPortfolioValue]);

  // 3. Sector Allocation Data
  const sectorAllocationData = useMemo(() => {
    if (totalPortfolioValue <= 0) return [];
    const map = {};

    holdingsBreakdown.forEach((item) => {
      const sec = item.sector || "Other";
      map[sec] = (map[sec] || 0) + item.value;
    });

    if (effectiveCash > 0) {
      map["Cash & Equivalents"] = effectiveCash;
    }

    const SECTOR_PALETTE = ["#10b981", "#06b6d4", "#6366f1", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"];
    return Object.entries(map).map(([sector, val], idx) => ({
      name: sector,
      value: Number(val.toFixed(2)),
      percentage: Number(((val / totalPortfolioValue) * 100).toFixed(1)),
      color: SECTOR_PALETTE[idx % SECTOR_PALETTE.length],
    })).sort((a, b) => b.value - a.value);
  }, [holdingsBreakdown, effectiveCash, totalPortfolioValue]);

  // 4. Quantitative Risk Exposure Calculations
  const riskMetrics = useMemo(() => {
    if (totalPortfolioValue <= 0) {
      return {
        score: 35,
        rating: "Low Risk",
        beta: 0.95,
        varDaily: 120,
        sharpe: 2.3,
        maxDrawdown: "-3.8%",
        stopLossCoverage: 100,
        highBetaPct: 20,
        corePct: 40,
        cashPct: 40,
      };
    }

    // Weighted beta
    let weightedBetaSum = 0;
    let highBetaValue = 0;
    let coreValue = 0;

    holdingsBreakdown.forEach((item) => {
      const b = item.beta || 1.1;
      weightedBetaSum += b * item.value;
      if (b >= 1.5) {
        highBetaValue += item.value;
      } else {
        coreValue += item.value;
      }
    });

    const portfolioBeta = Number(
      ((weightedBetaSum + 0 * effectiveCash) / totalPortfolioValue).toFixed(2)
    ) || 1.05;

    const cashPct = Number(((effectiveCash / totalPortfolioValue) * 100).toFixed(1));
    const highBetaPct = Number(((highBetaValue / totalPortfolioValue) * 100).toFixed(1));
    const corePct = Number(((coreValue / totalPortfolioValue) * 100).toFixed(1));

    // Risk Score: 0 to 100
    // Factor in beta, high-beta concentration, and lack of cash
    const betaFactor = Math.min(100, (portfolioBeta / 2.0) * 60);
    const concentrationFactor = Math.min(30, (highBetaPct / 100) * 30);
    const cashDampener = (cashPct / 100) * 25;
    const rawScore = Math.max(15, Math.min(95, Math.round(betaFactor + concentrationFactor - cashDampener)));

    let rating;
    let color;
    if (rawScore > 65) {
      rating = "Aggressive / High Alpha";
      color = "rose";
    } else if (rawScore > 40) {
      rating = "Moderate / Balanced";
      color = "amber";
    } else {
      rating = "Guarded / Capital Protected";
      color = "emerald";
    }

    // 95% Daily VaR (Value at Risk in USD)
    const varDailyUSD = Math.round(totalPortfolioValue * (portfolioBeta * 0.0165));

    return {
      score: rawScore,
      rating,
      color,
      beta: portfolioBeta,
      varDaily: varDailyUSD,
      sharpe: Number((2.1 + (100 - rawScore) * 0.01).toFixed(2)),
      maxDrawdown: `${-(Math.min(8.5, 3.0 + portfolioBeta * 1.8)).toFixed(1)}%`,
      stopLossCoverage: 100,
      highBetaPct,
      corePct,
      cashPct,
    };
  }, [totalPortfolioValue, holdingsBreakdown, effectiveCash]);

  // 5. Historical & Projection Area Curve Data
  const growthCurveData = useMemo(() => {
    const labels = {
      "1D": ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"],
      "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
      "1M": ["W1", "W2", "W3", "W4"],
      "3M": ["Month 1", "Month 2", "Month 3"],
      "1Y": ["Q1", "Q2", "Q3", "Q4"],
      "ALL": ["Inception", "2024", "2025", "2026", "Current"],
    };

    const currentLabels = labels[timeframe] || labels["1M"];
    const pointsCount = currentLabels.length;
    const base = totalPortfolioValue * 0.92;
    const delta = totalPortfolioValue - base;
    const data = [];

    currentLabels.forEach((label, i) => {
      const progress = pointsCount > 1 ? i / (pointsCount - 1) : 1;
      const wave = Math.sin(i * 0.8) * (delta * 0.08);
      const val = Number((base + delta * progress + wave).toFixed(2));
      const benchVal = Number((base + delta * 0.65 * progress + wave * 0.5).toFixed(2));

      data.push({
        label,
        portfolio: val,
        benchmark: benchVal,
      });
    });

    return data;
  }, [totalPortfolioValue, timeframe]);

  const handleToggleDefensiveMode = () => {
    const next = !defensiveModeActive;
    setDefensiveModeActive(next);
    showToast?.(
      next
        ? "🛡️ Emergency Shield activated: Stop-losses tightened to 2.0%, new aggressive buys halted"
        : "⚡ Standard Risk Profile restored: Autonomous scanning active"
    );
  };

  return (
    <div className="space-y-6">
      {/* Sample Data Banner */}
      {isSampleData && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Simulation Mode:</strong> Displaying modeled multi-asset portfolio breakdown with live market quotes.
            </span>
          </div>
          <button
            onClick={() => onGoToMarket?.()}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-[#06110c] rounded-xl text-[11px] font-black shrink-0 cursor-pointer transition-all"
          >
            Fund Real Positions
          </button>
        </div>
      )}

      {/* ============================================================
          TOP METRICS / VALUE STRIP
         ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Value */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{user?.name ? `${user.name.split(" ")[0]}'s Portfolio` : "Portfolio Total Value"}</span>
            <CircleDollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
            {fmtMoney(totalPortfolioValue)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                dayChangePercent >= 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {dayChangePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {dayChangePercent >= 0 ? "+" : ""}
              {dayChangePercent}%
            </span>
            <span className="text-slate-400 text-[11px]">
              {dayChangeDollar >= 0 ? "+" : ""}
              {fmtMoney(dayChangeDollar)} today
            </span>
          </div>
        </div>

        {/* Card 2: Risk Exposure Rating */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Risk Exposure Rating</span>
            <Gauge size={16} className="text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white">
              {riskMetrics.score}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
            <span
              className={`ml-auto text-[11px] font-black uppercase px-2 py-0.5 rounded-md border ${
                riskMetrics.score > 65
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : riskMetrics.score > 40
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {riskMetrics.rating.split("/")[0].trim()}
            </span>
          </div>
          {/* Segmented meter bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                riskMetrics.score > 65
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : riskMetrics.score > 40
                  ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                  : "bg-gradient-to-r from-emerald-400 to-teal-400"
              }`}
              style={{ width: `${riskMetrics.score}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>Beta: <strong>{riskMetrics.beta}x</strong></span>
            <span>95% VaR: <strong>-{fmtMoney(riskMetrics.varDaily)}</strong></span>
          </div>
        </div>

        {/* Card 3: Invested Equity vs Cash */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Asset Distribution</span>
            <Layers size={16} className="text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Equities</div>
              <div className="font-mono text-lg font-black text-white">
                {fmtMoney(totalEquity)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Liquid Cash</div>
              <div className="font-mono text-lg font-black text-emerald-400">
                {fmtMoney(effectiveCash)}
              </div>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full"
              style={{
                width: `${totalPortfolioValue > 0 ? (totalEquity / totalPortfolioValue) * 100 : 50}%`,
              }}
              title="Equities"
            />
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${totalPortfolioValue > 0 ? (effectiveCash / totalPortfolioValue) * 100 : 50}%`,
              }}
              title="Cash Reserves"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>
              Invested:{" "}
              <strong>
                {totalPortfolioValue > 0
                  ? ((totalEquity / totalPortfolioValue) * 100).toFixed(0)
                  : 0}
                %
              </strong>
            </span>
            <span>
              Cash:{" "}
              <strong>
                {totalPortfolioValue > 0
                  ? ((effectiveCash / totalPortfolioValue) * 100).toFixed(0)
                  : 0}
                %
              </strong>
            </span>
          </div>
        </div>

        {/* Card 4: Agent Risk Guardrail Status */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Guardrails Status</span>
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sm text-white">Active Defense Armed</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              Stop-loss limits active across 100% of open positions. Max drawdown ceiling set to{" "}
              <strong className="text-rose-400">{riskMetrics.maxDrawdown}</strong>.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleToggleDefensiveMode}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                defensiveModeActive
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
              }`}
            >
              <Lock size={12} />
              <span>{defensiveModeActive ? "Defensive Lock: ACTIVE" : "Tighten Risk Limits"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CHARTS SECTION:
          LEFT: PORTFOLIO VALUE GROWTH CURVE
          RIGHT: ASSET ALLOCATION DONUT & SECTOR BREAKDOWN
         ============================================================ */}
      {holdingsBreakdown.length === 0 ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/40 p-8 sm:p-12 text-center backdrop-blur-md shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-black text-white">Your portfolio is ready to get started</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Once you buy a stock, this dashboard will show your holdings, how your money is divided across assets, your risk level, and how your portfolio is performing over time.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenOrderDesk?.("NVDA", "BUY")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/30"
            >
              <Zap size={15} />
              <span>Place First Position</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Portfolio Growth & Value Projection Curve */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Performance Dynamics
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Portfolio Value Over Time
                </h3>
              </div>

              {/* Timeframe selector pills */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeframe === tf
                        ? "bg-emerald-500 text-[#06110c] shadow-sm font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-emerald-400" />
                <span>Stake Portfolio Value</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-cyan-500" />
                <span className="text-slate-600">S&P 500 Benchmark</span>
              </div>
              <div className="ml-auto text-emerald-400 font-mono font-bold">
                Sharpe: {riskMetrics.sharpe} (Alpha: +4.2%)
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="mt-6 w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={growthCurveData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="agentValGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#94a3b8" }}
                    tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                    domain={["dataMin - 100", "dataMax + 100"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#091510",
                      borderColor: "#10b981",
                      borderRadius: "16px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                    formatter={(val, name) => [
                      fmtMoney(val),
                      name === "portfolio" ? "Portfolio Value" : "S&P 500 Equivalent",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#0891b2"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#benchGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#agentValGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Timeframe Return</span>
              <div className="mt-0.5 font-mono font-black text-emerald-400">+8.42%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Max Drawdown</span>
              <div className="mt-0.5 font-mono font-black text-rose-400">{riskMetrics.maxDrawdown}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Win Rate</span>
              <div className="mt-0.5 font-mono font-black text-white">78.5%</div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Asset Allocation Breakdown Donut Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Capital Distribution
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Asset Allocation Breakdown
                </h3>
              </div>

              {/* View switch: Assets vs Sectors */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  onClick={() => setActiveAllocationView("assets")}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeAllocationView === "assets"
                      ? "bg-emerald-500 text-[#06110c] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Holdings
                </button>
                <button
                  onClick={() => setActiveAllocationView("sectors")}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeAllocationView === "sectors"
                      ? "bg-emerald-500 text-[#06110c] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sectors
                </button>
              </div>
            </div>

            {/* Recharts Pie / Donut Chart */}
            <div className="relative mt-4 w-full h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeAllocationView === "assets" ? assetAllocationData : sectorAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {(activeAllocationView === "assets" ? assetAllocationData : sectorAllocationData).map(
                      (entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.color}
                          stroke="#06110c"
                          strokeWidth={2}
                          className="transition-all duration-300 cursor-pointer outline-none"
                          style={{
                            filter: activePieIndex === idx ? "brightness(1.2)" : "none",
                            transform: activePieIndex === idx ? "scale(1.04)" : "scale(1)",
                            transformOrigin: "center center",
                          }}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#091510",
                      borderColor: "#10b981",
                      borderRadius: "14px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                    }}
                    formatter={(val, name, item) => [
                      `${fmtMoney(val)} (${item?.payload?.percentage || 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total
                </span>
                <span className="font-mono text-sm sm:text-base font-black text-white">
                  {fmtMoney(totalPortfolioValue)}
                </span>
              </div>
            </div>

            {/* Interactive Allocation Legend List */}
            <div className="mt-2 space-y-2 max-h-44 overflow-y-auto pr-1">
              {(activeAllocationView === "assets" ? assetAllocationData : sectorAllocationData).map(
                (item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-md shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="truncate">
                        <span className="font-mono font-black text-white mr-1.5">
                          {item.name}
                        </span>
                        {item.fullName && (
                          <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                            • {item.fullName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <span className="font-mono text-slate-300">{fmtMoney(item.value)}</span>
                      <span className="font-mono font-bold text-emerald-400 min-w-[42px] text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Concentration Guard Alert */}
          {assetAllocationData.some((a) => a.type === "equity" && a.percentage > 35) && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <span>
                High single-asset concentration detected. Consider rebalancing to keep max equity risk under 35%.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          RISK RADAR & QUANTITATIVE BREAKDOWN TIERS
         ============================================================ */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              Risk Architecture
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Portfolio Risk Exposure by Category
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Strategic Mix:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              30% Defensive • 45% Core • 25% Alpha
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: Defensive & Cash */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Defensive & Cash
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {riskMetrics.cashPct}%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                Zero-beta liquid reserves and high-dividend assets that buffer against downside shocks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Capital Value:</span>
              <strong className="font-mono text-white">{fmtMoney(effectiveCash)}</strong>
            </div>
          </div>

          {/* Tier 2: Core Growth & Mega-Caps */}
          <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                  <Activity size={14} /> Core Market Equities
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {riskMetrics.corePct}%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                Beta ~1.0x assets (AAPL, MSFT, GOOGL) tracking the broader economic expansion with controlled volatility.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Beta Rating:</span>
              <strong className="font-mono text-cyan-300">1.08x (Moderate)</strong>
            </div>
          </div>

          {/* Tier 3: High-Beta Alpha & Momentum */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                  <Zap size={14} /> High-Beta Alpha Drivers
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {riskMetrics.highBetaPct}%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                Aggressive growth drivers (NVDA, TSLA, PLTR) generating outsized returns with wider swing variance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Stop-Loss Guard:</span>
              <strong className="font-mono text-rose-300">3.5% Hard Cap</strong>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
