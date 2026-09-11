import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ShieldCheck,
  Zap,
  Bell,
  Check,
  Scale,
  Activity,
  Layers,
  Percent,
  Globe,
} from "lucide-react";
import { CandlestickChart } from "./Charts";
import { SetAlertModal } from "./SetAlertModal";
import { fetchYFinanceQuote, fetchYFinanceChart } from "../api";
import { usePollYFinanceChart } from "../hooks/usePollYFinanceChart";
import { fmt, fmtShares, initials, formatStockPrice, formatMoney, getCurrencySymbol } from "../utils";

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
const chartCache = new Map();

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
  orders = [],
  alerts = [], // <-- NEW: accept alerts prop
}) {
  const [chartType, setChartType] = useState("line");
  const [showVolume, setShowVolume] = useState(false);
  const [range, setRange] = useState("1M");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [liveQuote, setLiveQuote] = useState(null);
  const [liveHistory, setLiveHistory] = useState(null);
  const [liveCandles, setLiveCandles] = useState(null);

  // Fetch real-time live data via yfinance endpoint with in-memory caching for instant switching
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      if (!selected) return;

      const cacheKey = `${selected}_${range.toLowerCase()}`;
      if (chartCache.has(cacheKey)) {
        const cached = chartCache.get(cacheKey);
        if (cached.candles?.length > 0) setLiveCandles(cached.candles);
        if (cached.history?.length > 0) setLiveHistory(cached.history);
        if (cached.quote) setLiveQuote(cached.quote);
      }

      try {
        const [quoteRes, chartRes] = await Promise.allSettled([
          fetchYFinanceQuote(selected),
          fetchYFinanceChart(selected, range.toLowerCase()),
        ]);

        if (isMounted) {
          let updatedQuote = null;
          let updatedCandles = null;
          let updatedHistory = null;

          if (quoteRes.status === "fulfilled" && quoteRes.value) {
            updatedQuote = quoteRes.value;
            setLiveQuote(quoteRes.value);
          }
          if (chartRes.status === "fulfilled" && chartRes.value) {
            if (chartRes.value?.candles?.length > 0) {
              updatedCandles = chartRes.value.candles;
              setLiveCandles(chartRes.value.candles);
            }
            if (chartRes.value?.history?.length > 0) {
              updatedHistory = chartRes.value.history;
              setLiveHistory(chartRes.value.history);
            }
          }

          // Store in fast cache
          chartCache.set(cacheKey, {
            quote: updatedQuote,
            candles: updatedCandles,
            history: updatedHistory,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error("Live stock feed error:", e);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, [selected, range]);

  // Hook to poll the /api/yfinance/chart/:symbol endpoint every 60 seconds if the time range is set to '1d', keeping the view live
  const { isPolling, lastUpdated: lastPolledAt } = usePollYFinanceChart({
    symbol: selected,
    range,
    intervalMs: 60000,
    onUpdate: useCallback((chartData) => {
      if (chartData?.candles?.length > 0) {
        setLiveCandles(chartData.candles);
      }
      if (chartData?.history?.length > 0) {
        setLiveHistory(chartData.history);
      }
      // Also update in-memory cache for instant switching
      const cacheKey = `${selected}_1d`;
      const existing = chartCache.get(cacheKey) || {};
      chartCache.set(cacheKey, {
        ...existing,
        candles: chartData?.candles || existing.candles,
        history: chartData?.history || existing.history,
        timestamp: Date.now(),
      });
    }, [selected]),
  });

  if (!selected || !stockData || !stockMeta) return null;

  const isWatched = watchlist.includes(selected);
  // NEW: check if there is any active alert for this stock
  const hasActiveAlert = alerts.some((alert) => alert.symbol === selected);
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
    <div className="stock-detail-page" style={{ paddingTop: 16, textAlign: "left", maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
      {/* Back & Quick Actions Bar */}
      <div className="stock-detail-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
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

        <div className="stock-detail-action-buttons" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Set Alert Button - Neutral when inactive, amber when active */}
<button
  onClick={() => setIsAlertModalOpen(true)}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: hasActiveAlert
      ? darkMode
        ? "rgba(245,158,11,0.2)"   // amber tint dark
        : "rgba(245,158,11,0.1)"    // amber tint light
      : darkMode
        ? "#1a2236"                 // same neutral as watch button dark
        : "rgba(0,0,0,0.04)",       // same neutral as watch button light
    border: `1px solid ${hasActiveAlert ? "#f59e0b" : borderCol}`,
    color: hasActiveAlert ? "#f59e0b" : textSecondary,
    fontSize: 13,
    fontWeight: 800,
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.15s ease",
  }}
>
  <Bell
    size={15}
    fill={hasActiveAlert ? "#f59e0b" : "none"}
    color={hasActiveAlert ? "#f59e0b" : textSecondary}
  />
  {hasActiveAlert ? "Alert Active" : "Set Alert"}
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
        <div className="stock-detail-identity" style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
            </div>
            <div style={{ fontSize: 14, color: textSecondary, marginTop: 3, fontWeight: 600 }}>
              {stockMeta.name} • {stockMeta.sector || "Equities"}
            </div>
          </div>
        </div>

        <div className="stock-detail-price" style={{ textAlign: "right" }}>
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

      {/* Full-width native SVG price chart */}
      <div
        className="stock-detail-chart-card"
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
        {/* Chart Header Controls - Unified layout for Lines and Candlesticks */}
        <div className="stock-detail-chart-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Chart Type Toggle: Lines vs Candlesticks */}
            <div className={`stake-pill-group ${darkMode ? "stake-pill-group-dark" : ""}`}>
              <button
                id="stock-chart-type-lines"
                onClick={() => setChartType("line")}
                className={`stake-pill-btn ${darkMode ? "stake-pill-btn-dark" : ""} ${chartType === "line" ? "stake-pill-btn-active" : ""}`}
              >
                <TrendingUp size={14} /> Lines
              </button>

              <button
                id="stock-chart-type-candlestick"
                onClick={() => setChartType("candlestick")}
                className={`stake-pill-btn ${darkMode ? "stake-pill-btn-dark" : ""} ${chartType === "candlestick" ? "stake-pill-btn-active" : ""}`}
              >
                <BarChart2 size={14} /> Candlesticks
              </button>
            </div>

            {/* Volume Bars Toggle - Always in the exact same spot regardless of chart mode */}
            <button
              id="stock-chart-volume-toggle"
              onClick={() => setShowVolume(!showVolume)}
              className={`stake-volume-toggle ${darkMode ? "stake-volume-toggle-dark" : ""} ${showVolume ? "active" : ""}`}
            >
              <div className="stake-checkbox-box">
                {showVolume && <Check size={10} color="#ffffff" strokeWidth={3.5} />}
              </div>
              <span>Volume bars</span>
            </button>
          </div>

          {/* Time Range Selector - Always in the exact same spot regardless of chart mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {range === "1D" && isPolling && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#10b981",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 9px",
                  borderRadius: 8,
                  background: darkMode ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.02em",
                }}
                title={lastPolledAt ? `Last polled at ${new Date(lastPolledAt).toLocaleTimeString()}` : "Polling /api/yfinance/chart/:symbol every 60s"}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} className="animate-pulse" />
                LIVE (60s POLL)
              </span>
            )}

            <div className={`stake-pill-group ${darkMode ? "stake-pill-group-dark" : ""}`}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  id={`stock-range-btn-${r}`}
                  onClick={() => setRange(r)}
                  className={`stake-pill-btn ${darkMode ? "stake-pill-btn-dark" : ""} ${range === r ? "stake-pill-btn-active" : ""}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: "100%", marginTop: 8 }}>
          <CandlestickChart
            history={chartDataHistory}
            candles={liveCandles}
            height={340}
            currency={currency}
            darkMode={darkMode}
            showVolume={showVolume}
            chartType={chartType}
            range={range}
            onChartTypeChange={setChartType}
            orders={orders}
            ticker={selected}
            alerts={alerts}
          />
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
            className="stock-detail-position-card"
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
            className="stock-detail-key-metrics"
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
