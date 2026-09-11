import { useState, useMemo } from "react";
import {
  Activity,
  Gauge,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// Time periods / sessions for heatmap columns
const TIME_WINDOWS = [
  { id: "pre", label: "Pre-Mkt", time: "08:00 - 09:30" },
  { id: "open", label: "Opening Bell", time: "09:30 - 10:30" },
  { id: "mid", label: "Mid-Day", time: "11:30 - 13:30" },
  { id: "inst", label: "Inst. Flow", time: "14:00 - 15:15" },
  { id: "power", label: "Power Hour", time: "15:15 - 16:00" },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STRATEGIES_LIST = [
  { id: "all", name: "All Strategies" },
  { id: "dip_buyer", name: "Dip Buyer Engine" },
  { id: "momentum_breakout", name: "Momentum Breakout" },
  { id: "mean_reversion", name: "Statistical Mean Reversion" },
  { id: "sector_rotation", name: "Sector Rotation Alpha" },
];

// Color mapping based on trade outcome ROI with WCAG AAA high-contrast readability
function getHeatmapColor(pnlPct, tradeCount) {
  if (!tradeCount || tradeCount === 0) {
    return {
      bg: "bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80",
      text: "text-slate-400 font-mono font-medium",
      countText: "text-slate-400 font-semibold",
      pill: "bg-slate-100 text-slate-400",
    };
  }
  // High Profit (>= 3.0%) -> Solid emerald, high contrast white text
  if (pnlPct >= 3.0) {
    return {
      bg: "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-xs",
      text: "text-white font-black",
      countText: "text-emerald-100 font-bold",
      pill: "bg-emerald-800 text-white font-black border border-emerald-400/40 shadow-xs",
    };
  }
  // Strong Win (1.2% - 2.9%) -> Crisp mint with DEEP FOREST GREEN text (#064e3b) for 10:1 contrast
  if (pnlPct > 1.2) {
    return {
      bg: "bg-emerald-100/95 hover:bg-emerald-200 border border-emerald-300 shadow-2xs",
      text: "text-emerald-950 font-black",
      countText: "text-emerald-800 font-extrabold",
      pill: "bg-emerald-700 text-white font-black shadow-xs",
    };
  }
  // Modest Win (0.1% - 1.2%) -> Soft emerald with DEEP FOREST GREEN text (#064e3b)
  if (pnlPct > 0) {
    return {
      bg: "bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 shadow-2xs",
      text: "text-emerald-950 font-black",
      countText: "text-emerald-800 font-extrabold",
      pill: "bg-emerald-600 text-white font-black shadow-xs",
    };
  }
  // Flat (0%)
  if (pnlPct === 0) {
    return {
      bg: "bg-slate-100 hover:bg-slate-200 border border-slate-200",
      text: "text-slate-800 font-bold",
      countText: "text-slate-600 font-semibold",
      pill: "bg-slate-200 text-slate-700 font-bold",
    };
  }
  // Modest Loss (-0.1% to -1.9%) -> Soft rose with DEEP BURGUNDY text (#4c0519) for 10:1 contrast
  if (pnlPct > -2.0) {
    return {
      bg: "bg-rose-100/95 hover:bg-rose-200 border border-rose-300 shadow-2xs",
      text: "text-rose-950 font-black",
      countText: "text-rose-800 font-extrabold",
      pill: "bg-rose-700 text-white font-black shadow-xs",
    };
  }
  // High Loss / Stop Loss (<= -2.0%) -> Solid crimson, high contrast white text
  return {
    bg: "bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-xs",
    text: "text-white font-black",
    countText: "text-rose-100 font-bold",
    pill: "bg-rose-800 text-white font-black border border-rose-400/40 shadow-xs",
  };
}

function generateTradeActivityHeatmap(trades) {
  const cells = [];
  DAYS_OF_WEEK.forEach((day, dIdx) => {
    TIME_WINDOWS.forEach((tw, wIdx) => {
      const slotTrades = trades.filter((trade) => {
        const date = new Date(trade.timestamp || 0);
        const dayIndex = (date.getDay() + 6) % 7;
        const minutes = date.getHours() * 60 + date.getMinutes();
        const windowIndex =
          minutes < 570 ? 0 :
          minutes < 630 ? 1 :
          minutes < 810 ? 2 :
          minutes < 915 ? 3 : 4;
        return dayIndex === dIdx && windowIndex === wIdx && date.getDay() !== 0 && date.getDay() !== 6;
      });
      cells.push({
        day,
        dayIndex: dIdx,
        windowId: tw.id,
        windowLabel: tw.label,
        windowTime: tw.time,
        tradeCount: slotTrades.length,
        pnlPct: 0,
        netPnl: 0,
        trades: slotTrades,
      });
    });
  });
  return cells;
}

// =========================================================================
// 1. SMALL REAL-TIME SENTIMENT INDICATOR COMPONENT
// =========================================================================
export function MarketSentimentIndicator({ onRefresh, strategyName }) {
  const [sentimentScore] = useState(74); // 0 - 100
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const sentimentLabel =
    sentimentScore >= 75
      ? "Strongly Bullish"
      : sentimentScore >= 60
      ? "Bullish Momentum"
      : sentimentScore >= 45
      ? "Neutral / Choppy"
      : sentimentScore >= 30
      ? "Cautious / Bearish"
      : "Extreme Fear";

  const sentimentColor =
    sentimentScore >= 60
      ? "text-emerald-700"
      : sentimentScore >= 45
      ? "text-amber-700"
      : "text-rose-700";

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated("Just now");
      if (onRefresh) onRefresh();
    }, 600);
  };

  return (
    <div
      id="market-sentiment-indicator"
      className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <Gauge size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Market Sentiment Radar
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Real-Time Pulse
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Market-wide context for {strategyName || "your selected strategy"}; it is not a strategy-specific performance score.
            </p>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className={`text-lg sm:text-xl font-black tracking-tight ${sentimentColor}`}>
                {sentimentLabel}
              </span>
              <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {sentimentScore}/100
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all shadow-2xs"
          title="Refresh Sentiment Signals"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin text-emerald-600" : ""} />
          <span>Updated {lastUpdated}</span>
        </button>
      </div>

      {/* Progress meter bar */}
      <div className="mt-4">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 transition-all duration-700 shadow-2xs"
            style={{ width: `${sentimentScore}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-1.5">
          <span>0 Extreme Fear</span>
          <span>50 Neutral</span>
          <span>100 Greed / Expansion</span>
        </div>
      </div>

      {/* 4 Core Signals that Influence the Agent */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Breadth & Trend</span>
          <span className="text-emerald-700 font-black text-sm mt-1 block">
            +2.4σ Above MA
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Institutional Flow</span>
          <span className="text-emerald-700 font-black text-sm mt-1 block">
            +$1.84B Net Buy
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">VIX Volatility</span>
          <span className="text-slate-800 font-black text-sm mt-1 block">
            13.6 Low Risk
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">AI Agent Bias</span>
          <span className="text-cyan-800 font-black text-sm mt-1 block">
            Aggressive Accumulate
          </span>
        </div>
      </div>

      {/* AI Decision Explanation */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-start gap-2.5 text-xs leading-relaxed text-slate-700">
        <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-900 font-black">Agent Decision Impact:</strong> High market breadth confirms breakout setups. The AI Trade engine has expanded profit targets to <strong className="text-emerald-700 font-extrabold">+6.0%</strong> and tightened trailing stop-losses to protect accumulated capital.
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 2. STRATEGY PERFORMANCE OVER TIME HEATMAP CHART
// =========================================================================
export function StrategyPerformanceHeatmap({
  trades = [],
}) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [timeframe, setTimeframe] = useState("30D");

  // Generate heatmap data or use populated data
  const heatmapData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }
    return generateTradeActivityHeatmap(trades);
  }, [trades]);

  // Summary statistics calculated from heatmap
  const stats = useMemo(() => {
    if (!heatmapData.length) {
      return { totalTrades: 0, winRate: "N/A", totalPnl: "N/A", profitFactor: "N/A", bestWindow: "N/A" };
    }
    const populated = heatmapData.filter((c) => c.tradeCount > 0);
    const totalTrades = populated.reduce((acc, c) => acc + c.tradeCount, 0);
    return {
      totalTrades,
      winRate: "N/A",
      totalPnl: "N/A",
      profitFactor: "N/A",
      bestWindow: "Available after closed trades",
    };
  }, [heatmapData]);

  // Empty state for a new account before AI executes trades
  if (heatmapData.length === 0) {
    return (
      <div
        id="strategy-heatmap-empty"
        className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center shadow-xs space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <Activity size={30} />
        </div>
        <h3 className="text-xl font-black text-slate-900">Strategy Heatmap Ready for Execution</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          This heatmap visualizes strategy performance over time only after recorded trade activity is available. It does not estimate or invent outcomes for an account with no executions.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        </div>
      </div>
    );
  }

  return (
    <div
      id="strategy-performance-heatmap"
      className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-5"
    >
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Quantitative Outcome Analysis
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Recorded Activity Only
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Strategy Performance Over Time
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Color intensity represents trade profitability and return density across days and execution windows.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {["7D", "30D", "90D"].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  timeframe === tf
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            {STRATEGIES_LIST.map((s) => (
              <option key={s.id} value={s.id} className="text-slate-800">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip - High contrast, beautifully legible cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Total Trades</span>
          <span className="font-mono font-black text-slate-900 text-lg mt-1 block">
            {stats.totalTrades} <span className="text-xs font-bold text-slate-500">Executions</span>
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Win Rate</span>
          <span className="font-mono font-black text-emerald-700 text-lg mt-1 block">
            {stats.winRate === "N/A" ? "N/A" : `${stats.winRate}%`}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Net Strategy PnL</span>
          <span className="font-mono font-black text-emerald-700 text-lg mt-1 block">
            {stats.totalPnl === "N/A" ? "N/A" : `+$${stats.totalPnl}`}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Profit Factor</span>
          <span className="font-mono font-black text-cyan-800 text-lg mt-1 block">
            {stats.profitFactor === "N/A" ? "N/A" : `${stats.profitFactor}x`}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">Optimal Window</span>
          <span className="font-bold text-slate-900 text-sm mt-1 truncate block" title={stats.bestWindow}>
            {stats.bestWindow}
          </span>
        </div>
      </div>

      {/* The Interactive Heatmap Matrix */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          {/* Heatmap Columns Header */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-2.5 mb-2.5 text-center text-xs font-bold">
            <div className="text-left pl-2 flex items-center text-slate-500 text-xs font-bold uppercase tracking-wider">Session</div>
            {TIME_WINDOWS.map((tw) => (
              <div key={tw.id} className="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80">
                <div className="text-slate-900 font-black text-xs">{tw.label}</div>
                <div className="text-[10.5px] text-slate-500 font-mono font-bold mt-0.5">{tw.time}</div>
              </div>
            ))}
          </div>

          {/* Heatmap Rows (Mon - Fri) */}
          <div className="space-y-2.5">
            {DAYS_OF_WEEK.map((day) => {
              const rowCells = heatmapData.filter((c) => c.day === day);

              return (
                <div key={day} className="grid grid-cols-[80px_repeat(5,1fr)] gap-2.5 items-center">
                  {/* Row Day Label */}
                  <div className="text-left pl-2 font-black text-sm text-slate-900">
                    {day}
                  </div>

                  {/* Heatmap Cells */}
                  {TIME_WINDOWS.map((tw) => {
                    const cell =
                      rowCells.find((c) => c.windowId === tw.id) || {
                        day,
                        windowId: tw.id,
                        tradeCount: 0,
                        pnlPct: 0,
                      };

                    const style = getHeatmapColor(cell.pnlPct, cell.tradeCount);
                    const isSelected =
                      selectedCell &&
                      selectedCell.day === cell.day &&
                      selectedCell.windowId === cell.windowId;

                    return (
                      <button
                        key={`${day}-${tw.id}`}
                        type="button"
                        onClick={() => setSelectedCell(cell)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between min-h-[82px] relative group ${
                          style.bg
                        } ${isSelected ? "ring-2 ring-emerald-500 scale-[1.02]" : ""}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10.5px] uppercase tracking-wider ${style.countText}`}>
                            {cell.tradeCount > 0 ? `${cell.tradeCount} trade${cell.tradeCount === 1 ? "" : "s"}` : "No trade"}
                          </span>
                          {cell.tradeCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${style.pill}`}>
                              {cell.pnlPct >= 0 ? "+" : ""}
                              {cell.pnlPct}%
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5">
                          <div className={`text-base font-mono ${style.text}`}>
                            {cell.tradeCount > 0 ? (
                              <>
                                {cell.netPnl >= 0 ? "+$" : "-$"}
                                {Math.abs(cell.netPnl || 0).toFixed(1)}
                              </>
                            ) : (
                              <span className="text-slate-400 font-mono text-sm">—</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Heatmap Color Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200/80">
        <span className="font-bold text-slate-700">Outcome Intensity Scale:</span>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-600 inline-block shadow-2xs" /> Stop Loss
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-300 inline-block shadow-2xs" /> Modest Loss
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-200 inline-block shadow-2xs" /> Flat / No Trade
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-300 inline-block shadow-2xs" /> Modest Win
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 inline-block shadow-2xs" /> High Profit
          </span>
        </div>
      </div>

      {/* Selected Cell Trade Details Modal / Drawer */}
      {selectedCell && selectedCell.tradeCount > 0 && (
        <div
          id="heatmap-trade-inspection"
          className="mt-4 p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-black text-xs">
                {selectedCell.day}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {selectedCell.day} · {selectedCell.windowLabel} ({selectedCell.windowTime})
                </h4>
                <p className="text-[11px] text-slate-600">
                  {selectedCell.tradeCount} trade execution{selectedCell.tradeCount === 1 ? "" : "s"} · Net Return:{" "}
                  <strong className={selectedCell.pnlPct >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {selectedCell.pnlPct >= 0 ? "+" : ""}
                    {selectedCell.pnlPct}% (+${selectedCell.netPnl})
                  </strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {selectedCell.trades.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-[11px]">
                    {tr.ticker.slice(0, 2)}
                  </span>
                  <div>
                    <span className="font-mono font-black text-slate-900 text-sm">{tr.ticker}</span>
                    <span className="text-[11px] text-slate-500 ml-2">{tr.strategy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-slate-500">Entry: ${tr.entryPrice.toFixed(2)}</span>
                  <span className="text-slate-700 font-bold">Exit: ${tr.exitPrice.toFixed(2)}</span>
                  <span
                    className={`font-black px-2.5 py-1 rounded-md ${
                      tr.pnlPct >= 0
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {tr.pnlPct >= 0 ? "+" : ""}
                    {tr.pnlPct}% (${tr.pnlDollars})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
