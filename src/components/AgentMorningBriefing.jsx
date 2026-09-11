import { useState, useEffect, useCallback, useId } from "react";
import Markdown from "react-markdown";
import {
  Sunrise,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Activity,
  Layers,
  AlertCircle,
} from "lucide-react";
import { fetchMorningBriefing } from "../api";

const fmtMoney = (val) =>
  `$${Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function AgentMorningBriefing({
  user,
  holdings: propHoldings,
  stocks,
  showToast,
  onOpenOrderDesk,
}) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("analysis"); // "analysis" | "holdings"

  const widgetId = useId();
  const userEmail = user?.email || "trader@stake.com";

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMorningBriefing(userEmail);
      if (data?.success && data?.briefing) {
        setBriefing(data.briefing);
      } else {
        throw new Error(data?.message || "Unable to generate morning briefing");
      }
    } catch (err) {
      console.warn("Failed to load morning briefing:", err);
      setError(err?.message || "Failed to load morning briefing.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  // Handle Text-to-Speech audio briefing
  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      showToast?.("Audio playback is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narrative = briefing?.aiAnalysis || briefing?.executiveSummary;
    if (!narrative) return;

    // Clean markdown symbols for cleaner audio narration
    const cleanSpeech = narrative
      .replace(/[#*`_~[\]()>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(
      `Good morning ${user?.name || "Trader"}. Here is your Stake AI Morning Briefing. ${cleanSpeech}`
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    showToast?.("Streaming automated audio morning briefing...");
  };

  // Stop speech when unmounted
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    const textToCopy = `Stake AI Automated Morning Briefing (${briefing?.date || "Today"})\n\nMarket Bias: ${briefing?.marketBias || "Neutral"}\n\nExecutive Summary:\n${briefing?.executiveSummary || ""}\n\nFull Quantitative Analysis:\n${briefing?.aiAnalysis || ""}`;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    showToast?.("Morning briefing copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2200);
  };

  const metrics = briefing?.metrics || {};
  const benchmarks = briefing?.benchmarks || [];
  const holdingsList = briefing?.holdings || [];
  const isPositiveDay = (metrics.dayChangeDollars ?? 0) >= 0;

  return (
    <section
      id={`morning-briefing-widget-${widgetId}`}
      className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all duration-300"
    >
      {/* Decorative ambient morning sunrise glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/10 via-amber-500/5 to-transparent blur-3xl" />

      {/* ============================================================
          TOP HEADER & CONTROLS
         ============================================================ */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-emerald-500/20 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10">
            <Sunrise className="h-6 w-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                <Sparkles className="h-2.5 w-2.5" />
                Automated Morning Briefing
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                <Activity className="h-2.5 w-2.5" />
                24H Performance Radar
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {briefing?.date || "Daily Pre-Market"}
              </span>
            </div>

            <h2 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Holdings & 24h Market Intelligence
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* Audio Readout */}
          <button
            id={`briefing-audio-btn-${widgetId}`}
            type="button"
            onClick={toggleSpeech}
            disabled={loading || !briefing}
            title={isSpeaking ? "Stop Voice Briefing" : "Listen to Morning Briefing"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isSpeaking
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-white/10"
            }`}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
            <span>{isSpeaking ? "Stop Audio" : "Listen"}</span>
          </button>

          {/* Copy Briefing */}
          <button
            id={`briefing-copy-btn-${widgetId}`}
            type="button"
            onClick={handleCopy}
            disabled={loading || !briefing}
            title="Copy Morning Briefing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-white/10"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{isCopied ? "Copied" : "Copy"}</span>
          </button>

          {/* Refresh Button */}
          <button
            id={`briefing-refresh-btn-${widgetId}`}
            type="button"
            onClick={loadBriefing}
            disabled={loading}
            title="Refresh Quotes & Regenerate Briefing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all cursor-pointer border border-emerald-400/40 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Analyzing..." : "Refresh"}</span>
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            id={`briefing-toggle-btn-${widgetId}`}
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand Briefing" : "Collapse Briefing"}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all cursor-pointer border border-white/10"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !briefing && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <Sparkles className="absolute h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Synthesizing 24-Hour Morning Briefing...</p>
            <p className="text-xs text-slate-400 mt-1">Aggregating live portfolio holdings and multi-index market performance.</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="text-xs font-medium text-rose-200">{error}</span>
          </div>
          <button
            onClick={loadBriefing}
            className="px-3 py-1 text-xs font-bold text-rose-300 hover:text-rose-100 underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Content Area (Expandable) */}
      {!isCollapsed && briefing && (
        <div className="relative z-10 mt-5 space-y-5">
          {/* ============================================================
              METRIC CARDS: 24H DELTA & MARKET REGIME
             ============================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. 24h Portfolio Net Delta */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                {isPositiveDay ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                )}
                24H Portfolio Net
              </span>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                    isPositiveDay ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositiveDay ? "+" : "-"}
                  {fmtMoney(Math.abs(metrics.dayChangeDollars || 0))}
                </span>
                <span
                  className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                    isPositiveDay
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {isPositiveDay ? "+" : ""}
                  {Number(metrics.dayChangePercent || 0).toFixed(2)}%
                </span>
              </div>
              <p className="mt-1 text-[10.5px] text-slate-400">Previous 24h holdings delta</p>
            </div>

            {/* 2. Total Portfolio Equity */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Portfolio Equity
              </span>
              <div className="mt-2">
                <span className="text-lg sm:text-xl font-black font-mono tracking-tight text-white">
                  {fmtMoney(metrics.totalEquity)}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] text-slate-400">
                {metrics.holdingsCount || 0} active position{metrics.holdingsCount === 1 ? "" : "s"} • Cash: {fmtMoney(metrics.cash)}
              </p>
            </div>

            {/* 3. Market Bias */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                24H Market Bias
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    briefing.marketBias?.toLowerCase().includes("bull")
                      ? "bg-emerald-400 animate-ping"
                      : briefing.marketBias?.toLowerCase().includes("defensive") || briefing.marketBias?.toLowerCase().includes("bear")
                      ? "bg-rose-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="text-sm sm:text-base font-black text-white">
                  {briefing.marketBias || "Neutral"}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] text-slate-400">Overnight benchmark average</p>
            </div>

            {/* 4. Top 24h Performer */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Top 24H Mover
              </span>
              <div className="mt-2">
                {metrics.bestPerformer ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                      {metrics.bestPerformer.ticker}
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      {metrics.bestPerformer.changePercent >= 0 ? "+" : ""}
                      {metrics.bestPerformer.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">100% Cash / No positions</span>
                )}
              </div>
              <p className="mt-1 text-[10.5px] text-slate-400">
                {metrics.bestPerformer
                  ? `24h gain: +${fmtMoney(Math.abs(metrics.bestPerformer.dayGain || 0))}`
                  : "All capital protected in cash"}
              </p>
            </div>
          </div>

          {/* ============================================================
              24-HOUR BENCHMARK TAPE
             ============================================================ */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3 overflow-x-auto">
            <div className="shrink-0 flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-r border-white/10 pr-3">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>24H Benchmarks:</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {benchmarks.map((b) => {
                const isUp = (b.changePercent || 0) >= 0;
                return (
                  <div
                    key={b.symbol}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs"
                  >
                    <span className="font-mono font-bold text-white">{b.symbol}</span>
                    <span className="text-slate-300 font-mono text-[11px]">${b.price?.toFixed(2)}</span>
                    <span
                      className={`font-mono font-black text-[11px] flex items-center gap-0.5 ${
                        isUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {Number(b.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              SUB-NAV: AI ANALYSIS vs. HOLDINGS BREAKDOWN
             ============================================================ */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveView("analysis")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === "analysis"
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Executive AI Briefing
            </button>
            <button
              type="button"
              onClick={() => setActiveView("holdings")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "holdings"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Holdings 24H Performance Table
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                {holdingsList.length}
              </span>
            </button>

            <span className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:inline">
              Engine: <strong className="text-slate-300">{briefing.source || "Gemini 3.8 Flash"}</strong>
            </span>
          </div>

          {/* ============================================================
              VIEW 1: AI QUANTITATIVE BRIEFING NARRATIVE
             ============================================================ */}
          {activeView === "analysis" && (
            <div className="space-y-4">
              {/* Executive Summary Callout */}
              {briefing.executiveSummary && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-xs sm:text-sm leading-relaxed">
                  <div className="text-amber-300 font-bold uppercase tracking-wider text-[10.5px] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Executive Briefing Synopsis
                  </div>
                  {briefing.executiveSummary}
                </div>
              )}

              {/* Full Markdown Narrative */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-white/10 text-slate-200 text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-1.5 prose-strong:text-amber-300 prose-ul:my-2 prose-li:my-0.5">
                <Markdown>{briefing.aiAnalysis}</Markdown>
              </div>
            </div>
          )}

          {/* ============================================================
              VIEW 2: HOLDINGS 24-HOUR PERFORMANCE TABLE
             ============================================================ */}
          {activeView === "holdings" && (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              {holdingsList.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Asset</th>
                      <th className="p-3.5 text-right">Shares</th>
                      <th className="p-3.5 text-right">Price</th>
                      <th className="p-3.5 text-right">24H Change</th>
                      <th className="p-3.5 text-right">24H Net ($)</th>
                      <th className="p-3.5 text-right">Position Value</th>
                      <th className="p-3.5 text-right">Allocation</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {holdingsList.map((h) => {
                      const isUp = (h.changePercent || 0) >= 0;
                      return (
                        <tr
                          key={h.ticker}
                          className="hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">{h.ticker}</span>
                              <span className="text-slate-400 font-sans text-[11px] truncate max-w-[120px]">
                                {h.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right text-slate-300 font-bold">{h.shares}</td>
                          <td className="p-3.5 text-right text-white font-bold">${h.price?.toFixed(2)}</td>
                          <td className="p-3.5 text-right">
                            <span
                              className={`font-black ${
                                isUp ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isUp ? "+" : ""}
                              {h.changePercent?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <span
                              className={`font-black ${
                                (h.dayDollarChange || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {(h.dayDollarChange || 0) >= 0 ? "+$" : "-$"}
                              {Math.abs(h.dayDollarChange || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-white">{fmtMoney(h.value)}</td>
                          <td className="p-3.5 text-right text-slate-300">
                            {Number(h.allocationPercent || 0).toFixed(1)}%
                          </td>
                          <td className="p-3.5 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                const stockData = stocks?.[h.ticker] || {
                                  ticker: h.ticker,
                                  symbol: h.ticker,
                                  price: h.price,
                                  name: h.name,
                                };
                                onOpenOrderDesk?.(stockData);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-all"
                            >
                              <span>Trade</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm font-bold text-white">No active holdings currently found in portfolio.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your portfolio is currently 100% in USD cash reserves. Review the Signal Radar or Autonomous Strategy scan to deploy capital.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
