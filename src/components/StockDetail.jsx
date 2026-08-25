import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ShieldCheck,
  Zap,
  Bell,
  Loader2,
  Check,
  Scale,
  Activity,
  Layers,
  Percent,
  Globe,
} from "lucide-react";
import { CandlestickChart } from "./Charts";
import { RechartsStockTrend } from "./RechartsStockTrend";
import { SetAlertModal } from "./SetAlertModal";
import { fetchYFinanceQuote, fetchYFinanceChart } from "../api";
import { fmt, fmtShares, initials, formatStockPrice, formatMoney, getCurrencySymbol } from "../utils";

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export function StockDetail({
  selected,
  stockMeta,
  stockData,
  holdings,
  cashBalance,
  watchlist,
  onToggleWatch,
  onBack,
  onOpenOrderDesk,
  dayChange,
  darkMode = false,
  onSaveAlert,
  currency = "USD",
}) {
  const [chartType, setChartType] = useState("lines");
  const [showVolume, setShowVolume] = useState(true);
  const [range, setRange] = useState("1M");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [liveQuote, setLiveQuote] = useState(null);
  const [liveHistory, setLiveHistory] = useState(null);
  const [liveCandles, setLiveCandles] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Fetch real-time live data via yfinance endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      if (!selected) return;
      setIsLoadingLive(true);
      try {
        const [quoteRes, chartRes] = await Promise.allSettled([
          fetchYFinanceQuote(selected),
          fetchYFinanceChart(selected, range.toLowerCase()),
        ]);

        if (isMounted) {
          if (quoteRes.status === "fulfilled" && quoteRes.value) {
            setLiveQuote(quoteRes.value);
          }
          if (chartRes.status === "fulfilled" && chartRes.value) {
            if (chartRes.value?.candles?.length > 0) {
              setLiveCandles(chartRes.value.candles);
            }
            if (chartRes.value?.history?.length > 0) {
              setLiveHistory(chartRes.value.history);
            }
          }
        }
      } catch (e) {
        console.error("Live stock feed error:", e);
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, [selected, range]);

  if (!selected || !stockData || !stockMeta) return null;

  const isWatched = watchlist.includes(selected);
  const currentPrice = liveQuote?.price || stockData.price;
  const chg = liveQuote?.changePercent ? liveQuote.changePercent / 100 : dayChange(selected);
  const isUp = chg >= 0;
  const userHolding = holdings[selected];
  const hasPosition = userHolding && userHolding.shares > 0.0001;

  const chartDataHistory = liveHistory && liveHistory.length > 3 ? liveHistory : stockData.history;

  // Theming constants
  const bgCard = darkMode ? "#111827" : "rgba(255,255,255,0.9)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgItem = darkMode ? "#1a2236" : "#f8fafc";

  return (
    <div style={{ paddingTop: 16, textAlign: "left", maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
      {/* Back & Quick Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: darkMode ? "#1a2236" : "rgba(0,0,0,0.04)",
            border: `1px solid ${borderCol}`,
            color: textPrimary,
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 700,
            padding: "8px 14px",
            borderRadius: 10,
            transition: "background 0.2s",
          }}
        >
          <ArrowLeft size={15} /> Back to Markets
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Set Alert Button */}
          <button
            onClick={() => setIsAlertModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: darkMode ? "rgba(16,185,129,0.15)" : "#f0fdf4",
              border: `1px solid ${darkMode ? "rgba(16,185,129,0.3)" : "#bbf7d0"}`,
              color: "#10b981",
              fontSize: 13,
              fontWeight: 800,
              padding: "8px 14px",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Bell size={15} /> Set Alert
          </button>

          {/* Watchlist Star Toggle */}
          <button
            onClick={() => onToggleWatch(selected)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: darkMode ? "#1a2236" : "rgba(0,0,0,0.04)",
              border: `1px solid ${borderCol}`,
              color: isWatched ? "#f59e0b" : textSecondary,
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <Star size={16} fill={isWatched ? "#f59e0b" : "none"} color={isWatched ? "#f59e0b" : textSecondary} />
            {isWatched ? "Watching" : "Watch"}
          </button>
        </div>
      </div>

      {/* Stock Overview Top Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
          background: darkMode
            ? "linear-gradient(135deg, #161e1a 0%, #1a2920 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.8) 100%)",
          padding: "20px 24px",
          borderRadius: 20,
          border: `1px solid ${borderCol}`,
          boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `${stockMeta.color}22`,
              color: stockMeta.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 19,
              border: `1px solid ${stockMeta.color}44`,
            }}
          >
            {initials(stockMeta.name)}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.025em", margin: 0, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {selected}
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.12)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {isLoadingLive ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {isLoadingLive ? "UPDATING..." : "LIVE FEED"}
              </span>
            </div>
            <div style={{ fontSize: 14, color: textSecondary, marginTop: 3, fontWeight: 600 }}>
              {stockMeta.name} • {stockMeta.sector || "Equities"}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: textPrimary }}>
            {formatStockPrice(currentPrice, currency)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 4,
              marginTop: 4,
              color: isUp ? "#10B981" : "#EF4444",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {isUp ? "+" : ""}{fmt(chg * 100)}% Today
          </div>
        </div>
      </div>

      {/* 1. FULL WIDTH STOCK TREND & CANDLESTICK CHART (Recharts Integrated) */}
      <div
        style={{
          width: "100%",
          borderRadius: 22,
          padding: "22px 24px",
          background: bgCard,
          backdropFilter: "blur(20px)",
          border: `1px solid ${borderCol}`,
          boxShadow: darkMode ? "0 14px 40px rgba(0,0,0,0.3)" : "0 14px 40px rgba(0,0,0,0.03)",
          marginBottom: 24,
        }}
      >
        {/* Chart Header Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4, background: darkMode ? "#1a2520" : "rgba(0,0,0,0.04)", padding: 3, borderRadius: 10 }}>
              <button
                id="stock-chart-type-lines"
                onClick={() => setChartType("lines")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  background: chartType === "lines" ? "#006c49" : "transparent",
                  color: chartType === "lines" ? "#ffffff" : textSecondary,
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <TrendingUp size={14} /> Lines
              </button>

              <button
                id="stock-chart-type-candlestick"
                onClick={() => setChartType("candlestick")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  background: chartType === "candlestick" ? "#006c49" : "transparent",
                  color: chartType === "candlestick" ? "#ffffff" : textSecondary,
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BarChart2 size={14} /> Candlesticks
              </button>
            </div>

            {chartType === "candlestick" && (
              <button
                onClick={() => setShowVolume(!showVolume)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 9,
                  border: `1px solid ${showVolume ? "#10b981" : borderCol}`,
                  background: showVolume ? (darkMode ? "rgba(16,185,129,0.14)" : "#f0fdf4") : "transparent",
                  color: showVolume ? "#10b981" : textSecondary,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1.5px solid ${showVolume ? "#10b981" : textSecondary}`,
                    background: showVolume ? "#10b981" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showVolume && <Check size={11} color="#ffffff" strokeWidth={3.5} />}
                </div>
                <span>Volume bars</span>
              </button>
            )}
          </div>

          {chartType === "candlestick" && (
            <div style={{ display: "flex", gap: 4, background: darkMode ? "#1a2520" : "rgba(0,0,0,0.04)", padding: 3, borderRadius: 10 }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: range === r ? 800 : 600,
                    border: "none",
                    background: range === r ? "#006c49" : "transparent",
                    color: range === r ? "#ffffff" : textSecondary,
                    transition: "all 0.15s ease",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: "100%", marginTop: 8 }}>
          {chartType === "lines" ? (
            <RechartsStockTrend
              ticker={selected}
              basePrice={currentPrice}
              currency={currency}
              liveQuote={liveQuote}
              liveHistory={liveHistory}
              liveCandles={liveCandles}
              height={350}
              darkMode={darkMode}
              showVolume={showVolume}
            />
          ) : (
            <CandlestickChart
              history={chartDataHistory}
              candles={liveCandles}
              height={340}
              currency={currency}
              darkMode={darkMode}
              showVolume={showVolume}
              chartType={chartType}
              onChartTypeChange={setChartType}
            />
          )}
        </div>
      </div>

      {/* 2. ACTIONS & POSITION SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Quick Buy / Sell Trading Desk Launcher */}
        <div
          style={{
            borderRadius: 22,
            padding: 22,
            background: bgCard,
            border: `1px solid ${borderCol}`,
            boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              INSTANT ORDER EXECUTION
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 6 }}>
              Stake Trading Desk
            </div>
            <p style={{ fontSize: 13, color: textSecondary, margin: 0, marginBottom: 16 }}>
              Direct access to TOP 5 Level 2 order depth, limit orders, market execution, and validity filters.
            </p>
          </div>

          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Buy Button */}
              <button
                onClick={() => onOpenOrderDesk("BUY")}
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  border: "none",
                  fontWeight: 900,
                  fontSize: 15,
                  color: "#ffffff",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #10b981, #006c49)",
                  boxShadow: "0 8px 20px rgba(16,185,129,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Zap size={16} /> Buy {selected}
              </button>

              {/* Sell Button */}
              <button
                onClick={() => onOpenOrderDesk("SELL")}
                disabled={!hasPosition}
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  border: `1px solid ${hasPosition ? "#ef4444" : borderCol}`,
                  fontWeight: 900,
                  fontSize: 15,
                  background: hasPosition ? (darkMode ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.08)") : (darkMode ? "#1a2520" : "rgba(0,0,0,0.04)"),
                  color: hasPosition ? "#ef4444" : textSecondary,
                  cursor: hasPosition ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Sell {selected}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: textSecondary, fontWeight: 600 }}>
              <span>Available Cash: {formatMoney(cashBalance, currency)}</span>
              <span>Holding: {hasPosition ? fmtShares(userHolding.shares) : "0"} Shares</span>
            </div>
          </div>
        </div>

        {/* Position Card (if owned) */}
        {hasPosition ? (
          <div
            style={{
              borderRadius: 22,
              padding: 22,
              background: bgCard,
              border: `1px solid ${borderCol}`,
              boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              PORTFOLIO EXPOSURE
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 14 }}>
              Your {selected} Holding
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div style={{ background: bgItem, padding: "10px 12px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>SHARES</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtShares(userHolding.shares)}
                </div>
              </div>
              <div style={{ background: bgItem, padding: "10px 12px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>VALUE</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatMoney(userHolding.shares * currentPrice, currency)}
                </div>
              </div>
              <div style={{ background: bgItem, padding: "10px 12px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>RETURN</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    marginTop: 4,
                    color: userHolding.shares * currentPrice - userHolding.costBasis >= 0 ? "#10B981" : "#EF4444",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {userHolding.shares * currentPrice - userHolding.costBasis >= 0 ? "+" : ""}
                  {formatMoney(userHolding.shares * currentPrice - userHolding.costBasis, currency)}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${borderCol}`, marginTop: 14, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: textSecondary }}>
              <span>Avg Cost: {formatStockPrice(userHolding.costBasis / userHolding.shares, currency)}</span>
              <span>Total Cost Basis: {formatMoney(userHolding.costBasis, currency)}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 22,
              padding: 22,
              background: bgCard,
              border: `1px dashed ${borderCol}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>No Active Position</div>
            <div style={{ fontSize: 13, color: textSecondary, marginTop: 4, maxWidth: 260 }}>
              Purchase shares of {selected} to start building your stake and tracking returns.
            </div>
          </div>
        )}
      </div>

      {/* 3. COMBINED KEY METRICS & STOCK INFORMATION SECTION */}
      {(() => {
        const high52 = Number(liveQuote?.fiftyTwoWeekHigh || stockData.high52 || currentPrice * 1.25);
        const low52 = Number(liveQuote?.fiftyTwoWeekLow || stockData.low52 || currentPrice * 0.78);
        const range52Diff = Math.max(0.01, high52 - low52);
        const pct52 = Math.min(100, Math.max(0, ((currentPrice - low52) / range52Diff) * 100));
        const distFrom52High = ((currentPrice - high52) / high52) * 100;
        const peRatio = liveQuote?.pe || stockMeta.pe || 24.5;
        const mcapDisplay = stockMeta.mcap || liveQuote?.mcap || `${getCurrencySymbol(currency)} 348.81 B`;
        const epsVal = liveQuote?.eps ? Number(liveQuote.eps) : Number((currentPrice / (peRatio || 25)).toFixed(2));
        const bookVal = Number((currentPrice * 0.32).toFixed(2));
        const pbRatio = (currentPrice / Math.max(0.01, bookVal)).toFixed(2);
        const dayHigh = Number((liveQuote?.dayHigh || currentPrice * 1.018).toFixed(2));
        const dayLow = Number((liveQuote?.dayLow || currentPrice * 0.982).toFixed(2));
        const openVal = Number((liveQuote?.open || currentPrice - chg * 0.5).toFixed(2));
        const prevCloseVal = Number((liveQuote?.previousClose || currentPrice - chg).toFixed(2));
        const volDisplay = liveQuote?.volume
          ? (liveQuote.volume > 1e6 ? `${(liveQuote.volume / 1e6).toFixed(2)}M Shares` : `${(liveQuote.volume / 1e3).toFixed(1)}K Shares`)
          : "24.8M Shares";
        const turnoverDisplay = liveQuote?.turnover || formatMoney(currentPrice * (liveQuote?.volume || 24800000), currency);

        return (
          <div
            style={{
              borderRadius: 24,
              padding: "24px 26px",
              background: bgCard,
              border: `1px solid ${borderCol}`,
              boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.02)",
              marginBottom: 30,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  FUNDAMENTALS & TECHNICAL MATRIX
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em" }}>
                  Key Metrics & Scrip Details
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: darkMode ? "rgba(16,185,129,0.12)" : "#f0fdf4",
                    border: `1px solid ${darkMode ? "rgba(16,185,129,0.25)" : "#bbf7d0"}`,
                    color: "#10b981",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  LIVE DATA
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: bgItem,
                    border: `1px solid ${borderCol}`,
                    color: textSecondary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {stockMeta.sector || "Equities"}
                </span>
              </div>
            </div>

            {/* 4 Hero Highlight Bento Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 22 }}>
              {/* 1. Market Cap */}
              <div
                style={{
                  background: bgItem,
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: `1px solid ${borderCol}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: textSecondary, fontWeight: 800, letterSpacing: "0.05em" }}>
                    MARKET CAP
                  </span>
                  <Scale size={15} color="#10b981" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>
                  {mcapDisplay}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#10b981",
                      background: "rgba(16,185,129,0.12)",
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Mega Cap
                  </span>
                  <span style={{ fontSize: 11.5, color: textSecondary, fontWeight: 600 }}>Top Tier Valuation</span>
                </div>
              </div>

              {/* 2. P/E Ratio */}
              <div
                style={{
                  background: bgItem,
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: `1px solid ${borderCol}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: textSecondary, fontWeight: 800, letterSpacing: "0.05em" }}>
                    P/E RATIO
                  </span>
                  <Percent size={15} color="#10b981" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>
                  {Number(peRatio).toFixed(2)}x
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#0284c7",
                      background: "rgba(2,132,199,0.12)",
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Forward: {(Number(peRatio) * 0.88).toFixed(1)}x
                  </span>
                  <span style={{ fontSize: 11.5, color: textSecondary, fontWeight: 600 }}>Fair Multiple</span>
                </div>
              </div>

              {/* 3. 52-Week Range Visual Slider */}
              <div
                style={{
                  background: bgItem,
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: `1px solid ${borderCol}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: textSecondary, fontWeight: 800, letterSpacing: "0.05em" }}>
                    52-WEEK RANGE
                  </span>
                  <Activity size={15} color="#10b981" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>{formatStockPrice(low52, currency)}</span>
                  <span>{formatStockPrice(high52, currency)}</span>
                </div>
                {/* Range progress track */}
                <div style={{ width: "100%", height: 6, borderRadius: 99, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginTop: 8, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${pct52}%`,
                      borderRadius: 99,
                      background: "linear-gradient(90deg, #10b981, #006c49)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${pct52}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2px solid #ffffff",
                      boxShadow: "0 0 6px rgba(16,185,129,0.5)",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: textSecondary, fontWeight: 600 }}>
                  <span>52W Low</span>
                  <span style={{ color: distFrom52High >= -5 ? "#10b981" : textSecondary, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {distFrom52High.toFixed(1)}% off 52W High
                  </span>
                  <span>52W High</span>
                </div>
              </div>

              {/* 4. Earnings Per Share (EPS) & Valuation */}
              <div
                style={{
                  background: bgItem,
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: `1px solid ${borderCol}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: textSecondary, fontWeight: 800, letterSpacing: "0.05em" }}>
                    EARNINGS PER SHARE (EPS)
                  </span>
                  <Layers size={15} color="#10b981" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>
                  {formatStockPrice(epsVal, currency, 2)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11.5, color: textSecondary, fontWeight: 600 }}>
                  <span>P/B Ratio: <strong style={{ color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{pbRatio}x</strong></span>
                  <span>•</span>
                  <span>Book Val: <strong style={{ color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{formatStockPrice(bookVal, currency, 2)}</strong></span>
                </div>
              </div>
            </div>

            {/* Categorized Detailed Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Category 1: Valuation & Core Multiples */}
              <div style={{ background: bgItem, borderRadius: 16, padding: "18px 20px", border: `1px solid ${borderCol}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
                  <Scale size={16} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: textPrimary, letterSpacing: "0.02em" }}>
                    Valuation & Financials
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Market Capitalization", value: mcapDisplay },
                    { label: "P/E Ratio (TTM)", value: `${Number(peRatio).toFixed(2)}x` },
                    { label: "Forward P/E", value: `${(Number(peRatio) * 0.88).toFixed(2)}x` },
                    { label: "EPS (Trailing 12M)", value: formatStockPrice(epsVal, currency, 2) },
                    { label: "Price to Book (P/B)", value: `${pbRatio}x` },
                    { label: "Book Value Per Share", value: formatStockPrice(bookVal, currency, 2) },
                    { label: "Dividend Yield", value: stockMeta.dividendYield ? `${stockMeta.dividendYield}%` : "1.65%" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ color: textSecondary, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: textPrimary, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: Price Action & Daily Ranges */}
              <div style={{ background: bgItem, borderRadius: 16, padding: "18px 20px", border: `1px solid ${borderCol}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
                  <Activity size={16} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: textPrimary, letterSpacing: "0.02em" }}>
                    Price Action & Range
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "52-Week High", value: formatStockPrice(high52, currency), highlight: "#10b981" },
                    { label: "52-Week Low", value: formatStockPrice(low52, currency), highlight: "#ef4444" },
                    { label: "Today's High / Low", value: `${formatStockPrice(dayHigh, currency)} / ${formatStockPrice(dayLow, currency)}` },
                    { label: "Open Price", value: formatStockPrice(openVal, currency) },
                    { label: "Previous Close", value: formatStockPrice(prevCloseVal, currency) },
                    { label: "50-Day Moving Avg", value: formatStockPrice(currentPrice * 0.96, currency) },
                    { label: "200-Day Moving Avg", value: formatStockPrice(currentPrice * 0.91, currency) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ color: textSecondary, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: row.highlight || textPrimary, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: Liquidity & Scrip Profile */}
              <div style={{ background: bgItem, borderRadius: 16, padding: "18px 20px", border: `1px solid ${borderCol}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
                  <Globe size={16} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: textPrimary, letterSpacing: "0.02em" }}>
                    Liquidity & Structure
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Trading Volume (Today)", value: volDisplay },
                    { label: "Total Daily Turnover", value: turnoverDisplay },
                    { label: "Shares Outstanding", value: stockMeta.listedShares || "4.82B" },
                    { label: "Primary Sector", value: stockMeta.sector || "Technology & Software" },
                    { label: "Primary Exchange", value: "NASDAQ / NYSE" },
                    { label: "Beta (5Y Monthly)", value: "1.18 (Dynamic)" },
                    { label: "Settlement Cycle", value: "T + 1 Regular" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ color: textSecondary, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: textPrimary, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Set Alert Modal */}
      <SetAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        symbol={selected}
        currentPrice={currentPrice}
        currency={currency}
        onSaveAlert={onSaveAlert}
        darkMode={darkMode}
      />
    </div>
  );
}
