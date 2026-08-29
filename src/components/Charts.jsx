import { useId, useState, useRef, useEffect, useMemo } from "react";
import logoImg from "../assets/logo.png";
import { fmt, getSmoothSvgPath } from "../utils";
import { fetchYFinanceChart } from "../api";

export function Logo({ size = 26, textSize = 16, dark = false, showAi = false, textColor }) {
  const computedColor = textColor || (dark ? "#ffffff" : "#0f172a");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img
        src={logoImg}
        alt="Stake Logo"
        referrerPolicy="no-referrer"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: dark ? "brightness(1.1)" : "none",
        }}
      />
      <div
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontWeight: 900,
          fontSize: textSize,
          letterSpacing: "-0.04em",
          color: dark ? "#ffffff" : computedColor,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ color: dark ? "#ffffff" : computedColor }}>Stake</span>
        {showAi && (
          <span
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
              color: "#ffffff",
              fontSize: Math.max(10, Math.round(textSize * 0.62)),
              fontWeight: 800,
              padding: "1.5px 5.5px",
              borderRadius: 5,
              letterSpacing: "0.03em",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
              lineHeight: 1.2,
            }}
          >
            AI
          </span>
        )}
      </div>
    </div>
  );
}

export function Sparkline({ history, color = "#10b981", w = 90, h = 32 }) {
  const rawId = useId();
  const gradId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  if (!history || history.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...history), max = Math.max(...history);
  const range = Math.max(max - min, 0.001);
  const padY = 4;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return [x, y];
  });
  const linePath = getSmoothSvgPath(pts);
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
      )}
    </svg>
  );
}

export function BigChart({
  history,
  color = "#006c49",
  height = 240,
  privacyMode = false,
  darkMode = false,
  currency = "$",
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const containerRef = useRef(null);

  if (!history || history.length < 2) {
    return <div style={{ height, background: darkMode ? "#111827" : "rgba(0,0,0,0.02)", borderRadius: 16 }} />;
  }

  const w = 600, h = height;
  const padLeft = 12, padRight = 85, padY = 24;
  const chartW = w - padLeft - padRight;

  const rawMin = Math.min(...history);
  const rawMax = Math.max(...history);

  let min = rawMin;
  let max = rawMax;

  // Fix zero/flat range displaying repeating $ 0
  if (Math.abs(max - min) < 0.01) {
    if (max === 0) {
      min = 0;
      max = 100;
    } else {
      min = rawMin * 0.95;
      max = rawMax * 1.05;
    }
  }

  const range = Math.max(max - min, 1);

  const pts = history.map((v, i) => {
    const x = padLeft + (i / (history.length - 1)) * chartW;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return [x, y];
  });

  const linePath = getSmoothSvgPath(pts);
  const areaPath = `${linePath} L ${padLeft + chartW},${h - 8} L ${padLeft},${h - 8} Z`;
  const gradId = `bgchart-${color.replace("#", "")}-${h}`;
  const gridLevels = [0, 0.33, 0.66, 1];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.round(pct * (history.length - 1));
    setHoverIdx(idx);
  };

  const currentVal = hoverIdx !== null ? history[hoverIdx] : history[history.length - 1];
  const startVal = history[0];
  const diff = currentVal - startVal;
  const pctDiff = startVal > 0 ? (diff / startVal) * 100 : 0;
  const activePt = hoverIdx !== null ? pts[hoverIdx] : pts[pts.length - 1];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      onTouchMove={(e) => {
        if (e.touches[0]) handleMouseMove(e.touches[0]);
      }}
      onTouchEnd={() => setHoverIdx(null)}
      style={{ position: "relative", width: "100%", userSelect: "none", cursor: "crosshair" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: darkMode ? "#f8fafc" : "#191c1e" }}>
            {privacyMode ? "••••••••" : `${currency} ${fmt(currentVal)}`}
          </span>
          {privacyMode ? (
            <span style={{ fontSize: 12.5, fontWeight: 500, color: darkMode ? "#94a3b8" : "#64748b" }}>
              ••••••••
            </span>
          ) : (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: diff >= 0 ? "#10b981" : "#ef4444" }}>
              {diff >= 0 ? "+" : ""}${currency} ${fmt(diff)} ({diff >= 0 ? "+" : ""}{fmt(pctDiff)}%)
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "#94a3b8" : "#6c7a71", fontFamily: "'JetBrains Mono', monospace" }}>
          {hoverIdx !== null ? `Point #${hoverIdx + 1}` : "LIVE STREAM"}
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", height: h }}>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="70%" stopColor={color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {gridLevels.map((lvl, idx) => {
            const y = h - padY - lvl * (h - padY * 2);
            const priceLvl = min + lvl * range;
            const formattedPrice = priceLvl >= 1000
              ? `${(priceLvl / 1000).toFixed(1)}k`
              : fmt(priceLvl, priceLvl % 1 === 0 ? 0 : 1);
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <text x={padLeft + chartW + 8} y={y + 4} fill={darkMode ? "#94a3b8" : "#8a978f"} fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="start">
                  {privacyMode ? "••••" : `${currency} ${formattedPrice}`}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {hoverIdx !== null && pts[hoverIdx] && (
            <line x1={pts[hoverIdx][0]} y1={padY / 2} x2={pts[hoverIdx][0]} y2={h - padY / 2} stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.75" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {activePt && (
          <div
            style={{
              position: "absolute",
              left: `${(activePt[0] / w) * 100}%`,
              top: `${(activePt[1] / h) * 100}%`,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: color,
              border: "2.5px solid #ffffff",
              boxShadow: `0 0 10px ${color}80`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        )}

        {/* Minimalist Custom Hover Tooltip */}
        {hoverIdx !== null && activePt && (
          <div
            style={{
              position: "absolute",
              left: `${Math.max(12, Math.min(88, (activePt[0] / w) * 100))}%`,
              top: Math.max(10, activePt[1] - 48),
              transform: "translate(-50%, -100%)",
              background: darkMode ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${darkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)"}`,
              borderRadius: 10,
              padding: "6px 10px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              pointerEvents: "none",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: darkMode ? "#f8fafc" : "#191c1e" }}>
                {privacyMode ? "••••••••" : `${currency} ${fmt(currentVal)}`}
              </span>
              {!privacyMode && (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: diff >= 0 ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                  {diff >= 0 ? "+" : ""}${currency} ${fmt(diff)} ({diff >= 0 ? "+" : ""}{fmt(pctDiff)}%)
                </span>
              )}
            </div>
            <div style={{ fontSize: 9.5, color: darkMode ? "#94a3b8" : "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
              Index Point #{hoverIdx + 1} of {history.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CandlestickChart({
  history,
  candles: externalCandles,
  height = 280,
  darkMode = false,
  showVolume = false,
  currency = "$",
  chartType: externalChartType = "candle",
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const containerRef = useRef(null);

  // Normalize chartType to "candle" or "line"
  const activeMode = externalChartType === "candlestick" ? "candle" : externalChartType;
  const isLineMode = activeMode === "line" || activeMode === "smooth";

  // Derive candlestick and volume series memoized
  const candleList = useMemo(() => {
    if (externalCandles && externalCandles.length > 0) {
      return externalCandles;
    }
    if (history && history.length > 0) {
      const list = [];
      const chunkSize = Math.max(1, Math.floor(history.length / 28));
      for (let i = 0; i < history.length; i += chunkSize) {
        const chunk = history.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const open = chunk[0];
        const close = chunk[chunk.length - 1];
        const maxVal = Math.max(...chunk);
        const minVal = Math.min(...chunk);
        const high = maxVal + Math.abs(close - open) * 0.22;
        const low = minVal - Math.abs(close - open) * 0.22;
        const volume = Math.floor(180000 + (((i * 47) % 100) / 100) * 650000);
        list.push({
          open,
          close,
          high,
          low,
          volume,
          isUp: close >= open,
          date: `T-${list.length + 1}`
        });
      }
      return list;
    }
    return [];
  }, [externalCandles, history]);

  const w = 700;
  const padLeft = 14;
  const padRight = 85;
  const chartW = w - padLeft - padRight;

  const priceH = showVolume ? height * 0.74 : height;
  const volH = showVolume ? Math.max(64, height * 0.26) : 0;
  const padY = 20;
  const candleW = Math.max(4, candleList.length > 0 ? (chartW / candleList.length) * 0.65 : 10);

  const { minPrice, priceRange, maxVolume, pts, linePath, areaPath } = useMemo(() => {
    if (candleList.length === 0) {
      return { minPrice: 0, maxPrice: 100, priceRange: 100, maxVolume: 1000, pts: [], linePath: "", areaPath: "" };
    }
    const allHighs = candleList.map((c) => c.high);
    const allLows = candleList.map((c) => c.low);
    const minP = Math.min(...allLows);
    const maxP = Math.max(...allHighs);
    const pRange = Math.max(maxP - minP, 0.001);

    const allVols = candleList.map((c) => c.volume || 1000);
    const maxV = Math.max(...allVols, 1000);

    const points = candleList.map((c, i) => {
      const x = padLeft + (i + 0.5) * (chartW / candleList.length);
      const y = priceH - padY - ((c.close - minP) / pRange) * (priceH - padY * 2);
      return [x, y];
    });

    const lPath = getSmoothSvgPath(points);
    const aPath = `${lPath} L ${padLeft + chartW},${priceH - 4} L ${padLeft},${priceH - 4} Z`;

    return {
      minPrice: minP,
      maxPrice: maxP,
      priceRange: pRange,
      maxVolume: maxV,
      pts: points,
      linePath: lPath,
      areaPath: aPath,
    };
  }, [candleList, chartW, priceH, padLeft, padY]);

  if (candleList.length === 0) {
    return <div style={{ height, background: darkMode ? "#161d19" : "rgba(0,0,0,0.02)", borderRadius: 16 }} />;
  }

  const handleMouseMove = (e) => {
    if (!containerRef.current || candleList.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.min(candleList.length - 1, Math.floor(pct * candleList.length));
    setHoverIdx(idx);
  };

  const activeCandle = hoverIdx !== null ? candleList[hoverIdx] : candleList[candleList.length - 1];
  const firstCandle = candleList[0];
  const activeChange = activeCandle ? activeCandle.close - (activeCandle.open || firstCandle.open) : 0;
  const activeChangePct = activeCandle && activeCandle.open ? (activeChange / activeCandle.open) * 100 : 0;

  const bgBorder = darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const textColor = darkMode ? "#e2e8f0" : "#191c1e";
  const subTextColor = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      style={{
        position: "relative",
        width: "100%",
        userSelect: "none",
        fontFamily: "'Hanken Grotesk', sans-serif"
      }}
    >
      {/* Top HUD: OHLCV Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
          padding: "0 2px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", flexWrap: "wrap" }}>
          <span>
            <span style={{ color: subTextColor }}>O: </span>
            <strong style={{ color: textColor }}>{currency} {fmt(activeCandle?.open)}</strong>
          </span>
          <span>
            <span style={{ color: subTextColor }}>H: </span>
            <strong style={{ color: "#10b981" }}>{currency} {fmt(activeCandle?.high)}</strong>
          </span>
          <span>
            <span style={{ color: subTextColor }}>L: </span>
            <strong style={{ color: "#ef4444" }}>{currency} {fmt(activeCandle?.low)}</strong>
          </span>
          <span>
            <span style={{ color: subTextColor }}>C: </span>
            <strong style={{ color: activeCandle?.isUp ? "#10b981" : "#ef4444" }}>
              {currency} {fmt(activeCandle?.close)}
            </strong>
          </span>
          <span style={{ color: activeChange >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
            {activeChange >= 0 ? "+" : ""}{fmt(activeChange)} ({activeChange >= 0 ? "+" : ""}{fmt(activeChangePct)}%)
          </span>
          {activeCandle?.volume && (
            <span style={{ color: subTextColor, fontSize: 11 }}>
              VOL: <strong style={{ color: textColor }}>{(activeCandle.volume > 1e6 ? `${(activeCandle.volume / 1e6).toFixed(2)}M` : `${(activeCandle.volume / 1e3).toFixed(1)}K`)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Candlestick / Line SVG Canvas */}
      <div style={{ position: "relative", width: "100%", height: priceH }}>
        <svg width="100%" height={priceH} viewBox={`0 0 ${w} ${priceH}`} preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="candle-line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="85%" stopColor="#10b981" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((lvl, idx) => {
            const y = priceH - padY - lvl * (priceH - padY * 2);
            const priceLvl = minPrice + lvl * priceRange;
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke={bgBorder} strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <text x={padLeft + chartW + 8} y={y + 3.5} fill={subTextColor} fontSize="9.5" fontFamily="'JetBrains Mono', monospace" textAnchor="start">
                  {currency} {fmt(priceLvl, 1)}
                </text>
              </g>
            );
          })}

          {isLineMode ? (
            <>
              <path d={areaPath} fill="url(#candle-line-grad)" />
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {hoverIdx !== null && pts[hoverIdx] && (
                <circle cx={pts[hoverIdx][0]} cy={pts[hoverIdx][1]} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              )}
            </>
          ) : (
            candleList.map((c, i) => {
              const cx = padLeft + (i + 0.5) * (chartW / candleList.length);
              const highY = priceH - padY - ((c.high - minPrice) / priceRange) * (priceH - padY * 2);
              const lowY = priceH - padY - ((c.low - minPrice) / priceRange) * (priceH - padY * 2);
              const openY = priceH - padY - ((c.open - minPrice) / priceRange) * (priceH - padY * 2);
              const closeY = priceH - padY - ((c.close - minPrice) / priceRange) * (priceH - padY * 2);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(3, Math.abs(closeY - openY));
              const candleColor = c.isUp ? "#10b981" : "#ef4444";
              const isHovered = hoverIdx === i;

              return (
                <g key={i} opacity={hoverIdx !== null && !isHovered ? 0.75 : 1}>
                  {/* Upper & lower wick */}
                  <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={candleColor} strokeWidth={isHovered ? "2.2" : "1.5"} vectorEffect="non-scaling-stroke" />
                  {/* Candle Body */}
                  <rect
                    x={cx - candleW / 2}
                    y={bodyTop}
                    width={candleW}
                    height={bodyHeight}
                    fill={c.isUp ? candleColor : candleColor}
                    stroke={candleColor}
                    strokeWidth="1"
                    rx="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })
          )}

          {/* Hover Crosshair */}
          {hoverIdx !== null && (
            <line
              x1={padLeft + (hoverIdx + 0.5) * (chartW / candleList.length)}
              y1={padY / 2}
              x2={padLeft + (hoverIdx + 0.5) * (chartW / candleList.length)}
              y2={priceH}
              stroke={darkMode ? "#ffffff" : "#006c49"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.7"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Minimalist Custom Hover Tooltip for Candlestick & Line Charts */}
        {hoverIdx !== null && activeCandle && (
          <div
            style={{
              position: "absolute",
              left: `${Math.max(12, Math.min(88, ((padLeft + (hoverIdx + 0.5) * (chartW / candleList.length)) / w) * 100))}%`,
              top: Math.max(10, (isLineMode && pts[hoverIdx] ? pts[hoverIdx][1] - 45 : 18)),
              transform: "translate(-50%, -100%)",
              background: darkMode ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${darkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)"}`,
              borderRadius: 10,
              padding: "7px 11px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
              pointerEvents: "none",
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: darkMode ? "#f8fafc" : "#191c1e" }}>
                {currency} {fmt(activeCandle.close || activeCandle.open)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: activeChange >= 0 ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                {activeChange >= 0 ? "+" : ""}{currency} {fmt(activeChange)} ({activeChange >= 0 ? "+" : ""}{fmt(activeChangePct)}%)
              </span>
            </div>

            {!isLineMode ? (
              <div style={{ display: "flex", gap: 8, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: subTextColor, borderTop: `1px dashed ${bgBorder}`, paddingTop: 3, marginTop: 1 }}>
                <span>O: <strong style={{ color: textColor }}>{fmt(activeCandle.open)}</strong></span>
                <span>H: <strong style={{ color: "#10b981" }}>{fmt(activeCandle.high)}</strong></span>
                <span>L: <strong style={{ color: "#ef4444" }}>{fmt(activeCandle.low)}</strong></span>
                {activeCandle.volume && (
                  <span>Vol: <strong style={{ color: textColor }}>{(activeCandle.volume > 1e6 ? `${(activeCandle.volume / 1e6).toFixed(1)}M` : `${(activeCandle.volume / 1e3).toFixed(0)}K`)}</strong></span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 9.5, color: subTextColor, fontFamily: "'JetBrains Mono', monospace" }}>
                {activeCandle.date || `Sample Point #${hoverIdx + 1}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Synchronized Volume Bar Chart Section (Clean, subtle, refined) */}
      {showVolume && volH > 0 && (
        <div style={{ marginTop: 10, borderTop: `1px dashed ${bgBorder}`, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: subTextColor, marginBottom: 4, padding: "0 2px" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              VOLUME HISTOGRAM
            </span>
            <span style={{ background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "1px 6px", borderRadius: 4 }}>
              PEAK: {(maxVolume > 1e6 ? `${(maxVolume / 1e6).toFixed(2)}M` : `${(maxVolume / 1e3).toFixed(0)}K`)}
            </span>
          </div>

          <div style={{ position: "relative", width: "100%", height: volH }}>
            <svg width="100%" height={volH} viewBox={`0 0 ${w} ${volH}`} preserveAspectRatio="none" style={{ display: "block" }}>
              {/* Volume grid line at 50% */}
              <line x1={padLeft} y1={volH / 2} x2={padLeft + chartW} y2={volH / 2} stroke={bgBorder} strokeDasharray="3 3" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              <text x={padLeft + chartW + 8} y={volH / 2 + 3} fill={subTextColor} fontSize="8.5" fontFamily="'JetBrains Mono', monospace" textAnchor="start">
                {(maxVolume / 2 > 1e6 ? `${(maxVolume / 2e6).toFixed(1)}M` : `${(maxVolume / 2e3).toFixed(0)}K`)}
              </text>

              {candleList.map((c, i) => {
                const cx = padLeft + (i + 0.5) * (chartW / candleList.length);
                const vol = c.volume || 1000;
                const barHeight = Math.max(3, (vol / maxVolume) * (volH - 8));
                const barY = volH - barHeight;
                const isHovered = hoverIdx === i;
                const barFill = c.isUp
                  ? (darkMode ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.55)")
                  : (darkMode ? "rgba(239, 68, 68, 0.45)" : "rgba(239, 68, 68, 0.55)");
                const barActiveFill = c.isUp ? "#10b981" : "#ef4444";

                return (
                  <g key={i}>
                    <rect
                      x={cx - candleW / 2}
                      y={barY}
                      width={candleW}
                      height={barHeight}
                      fill={isHovered ? barActiveFill : barFill}
                      rx="2"
                      ry="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}

              {hoverIdx !== null && (
                <line
                  x1={padLeft + (hoverIdx + 0.5) * (chartW / candleList.length)}
                  y1={0}
                  x2={padLeft + (hoverIdx + 0.5) * (chartW / candleList.length)}
                  y2={volH}
                  stroke={darkMode ? "#ffffff" : "#006c49"}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.7"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroChart() {
  const pts = [
    [0, 180], [40, 170], [80, 175], [120, 150], [160, 160],
    [200, 130], [240, 140], [280, 110], [320, 120], [360, 85],
    [400, 95], [440, 60], [480, 75], [520, 40], [560, 45], [600, 20]
  ];
  const linePath = getSmoothSvgPath(pts);
  const areaPath = `${linePath} L 600,220 L 0,220 Z`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#hero-grad)" />
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MarketMainChart({
  height = 240,
  nepseHistory,
  darkMode = false,
}) {
  const [range, setRange] = useState("1D");
  const [hoverIdx, setHoverIdx] = useState(null);
  const [liveSeries, setLiveSeries] = useState(null);
  const containerRef = useRef(null);

  // Fetch real-time market index series on range switch
  useEffect(() => {
    let isMounted = true;
    async function loadRangeData() {
      const rangeMap = {
        "1D": { r: "1d", i: "5m" },
        "1W": { r: "5d", i: "15m" },
        "1M": { r: "1mo", i: "1d" },
        "3M": { r: "3mo", i: "1d" },
        "1Y": { r: "1y", i: "1wk" },
        "ALL": { r: "5y", i: "1mo" },
      };
      const cfg = rangeMap[range] || { r: "1d", i: "5m" };
      try {
        const res = await fetchYFinanceChart("SPY", cfg.r, cfg.i);
        if (isMounted && res?.history && res.history.length > 2) {
          setLiveSeries(res.history);
        }
      } catch (err) {
        console.warn("Market chart range fetch fallback:", err);
      }
    }
    loadRangeData();
    return () => {
      isMounted = false;
    };
  }, [range]);

  // Fallback realistic series if not supplied
  const baseHistory = nepseHistory && nepseHistory.length > 3 ? nepseHistory : [
    5420.2, 5428.5, 5424.1, 5430.8, 5433.4, 5429.9, 5434.2, 5438.0, 5435.6,
    5440.3, 5442.9, 5439.1, 5443.5, 5446.0, 5441.4, 5444.15
  ];

  const history = liveSeries && liveSeries.length > 2 ? liveSeries : baseHistory;

  const w = 700, h = height;
  const padLeft = 14, padRight = 80, padY = 24;
  const chartW = w - padLeft - padRight;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const rangeVal = Math.max(max - min, 1);

  const pts = history.map((v, i) => {
    const x = padLeft + (i / (history.length - 1)) * chartW;
    const y = h - padY - ((v - min) / rangeVal) * (h - padY * 2);
    return [x, y];
  });

  const linePath = getSmoothSvgPath(pts);
  const areaPath = `${linePath} L ${padLeft + chartW},${h - 6} L ${padLeft},${h - 6} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.round(pct * (history.length - 1));
    setHoverIdx(idx);
  };

  const currentVal = hoverIdx !== null ? history[hoverIdx] : history[history.length - 1];
  const startVal = history[0];
  const diff = currentVal - startVal;
  const pctDiff = (diff / startVal) * 100;
  const isUp = diff >= 0;
  const activePt = hoverIdx !== null ? pts[hoverIdx] : pts[pts.length - 1];

  const cardBg = darkMode ? "#161e1a" : "rgba(255,255,255,0.85)";
  const cardBorder = darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)";
  const statBg = darkMode ? "#1a2520" : "#f8fafc";
  const statText = darkMode ? "#e2e8f0" : "#191c1e";
  const statSub = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        borderRadius: 22,
        padding: "20px 24px",
        background: cardBg,
        backdropFilter: "blur(20px)",
        border: `1px solid ${cardBorder}`,
        boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.03)",
        marginBottom: 24,
      }}
    >
      {/* Header: Stake Benchmark + Range selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#10b981", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace", background: "rgba(16,185,129,0.15)", padding: "3px 8px", borderRadius: 6 }}>
              STAKE 50 BENCHMARK
            </span>
            <span style={{ fontSize: 11, color: statSub, fontWeight: 700 }}>
              Live Intraday Index Stream
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: statText, fontFamily: "'JetBrains Mono', monospace" }}>
              $ {fmt(currentVal, 2)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: isUp ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
              {isUp ? "+" : ""}$ {fmt(diff, 2)} ({isUp ? "+" : ""}{fmt(pctDiff, 2)}%)
            </span>
          </div>
        </div>

        {/* Range Buttons */}
        <div style={{ display: "flex", gap: 4, background: darkMode ? "#1a2520" : "rgba(0,0,0,0.04)", padding: 3, borderRadius: 10 }}>
          {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: range === r ? 800 : 600,
                cursor: "pointer",
                background: range === r ? "#006c49" : "transparent",
                color: range === r ? "#ffffff" : statSub,
                transition: "all 0.15s ease",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Graph Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMouseMove(e.touches[0]);
        }}
        onTouchEnd={() => setHoverIdx(null)}
        style={{ position: "relative", width: "100%", height: h, cursor: "crosshair", userSelect: "none" }}
      >
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="stake-main-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="80%" stopColor="#10b981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines with currency formatting */}
          {[0, 0.33, 0.66, 1].map((lvl, idx) => {
            const y = h - padY - lvl * (h - padY * 2);
            const ptsVal = min + lvl * rangeVal;
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <text x={padLeft + chartW + 8} y={y + 4} fill={statSub} fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="start">
                  $ {fmt(ptsVal, 1)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#stake-main-grad)" />
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {hoverIdx !== null && pts[hoverIdx] && (
            <line
              x1={pts[hoverIdx][0]}
              y1={padY / 2}
              x2={pts[hoverIdx][0]}
              y2={h - padY / 2}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.8"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {activePt && (
          <div
            style={{
              position: "absolute",
              left: `${(activePt[0] / w) * 100}%`,
              top: `${(activePt[1] / h) * 100}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#10b981",
              border: "2px solid #ffffff",
              boxShadow: "0 0 8px rgba(16,185,129,0.8)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        )}

        {/* Minimalist Hover Tooltip for MarketMainChart */}
        {hoverIdx !== null && activePt && (
          <div
            style={{
              position: "absolute",
              left: `${Math.max(14, Math.min(86, (activePt[0] / w) * 100))}%`,
              top: Math.max(10, activePt[1] - 48),
              transform: "translate(-50%, -100%)",
              background: darkMode ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${darkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)"}`,
              borderRadius: 10,
              padding: "6px 10px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
              pointerEvents: "none",
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: statText }}>
                $ {fmt(currentVal, 2)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: isUp ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                {isUp ? "+" : ""}$ {fmt(diff, 2)} ({isUp ? "+" : ""}{fmt(pctDiff, 2)}%)
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: statSub, fontFamily: "'JetBrains Mono', monospace" }}>
              {range} Interval • Point #{hoverIdx + 1} of {history.length}
            </div>
          </div>
        )}
      </div>

      {/* Market Breadth & Live Stats Footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          marginTop: 14,
          borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          paddingTop: 12,
        }}
      >
        <div style={{ background: statBg, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: statSub, fontWeight: 700 }}>TURNOVER</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statText, fontFamily: "'JetBrains Mono', monospace" }}>$ 4.82 Billion</div>
        </div>
        <div style={{ background: statBg, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: statSub, fontWeight: 700 }}>TRADED SHARES</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statText, fontFamily: "'JetBrains Mono', monospace" }}>12,482,910</div>
        </div>
        <div style={{ background: statBg, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: statSub, fontWeight: 700 }}>TRANSACTIONS</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statText, fontFamily: "'JetBrains Mono', monospace" }}>64,280 Trades</div>
        </div>
        <div style={{ background: darkMode ? "rgba(16,185,129,0.12)" : "#f0fdf4", border: `1px solid ${darkMode ? "rgba(16,185,129,0.2)" : "#dcfce7"}`, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>ADVANCES</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>142 Stocks ▲</div>
        </div>
        <div style={{ background: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${darkMode ? "rgba(239,68,68,0.2)" : "#fee2e2"}`, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>DECLINES</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>78 Stocks ▼</div>
        </div>
        <div style={{ background: statBg, padding: "8px 12px", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: statSub, fontWeight: 700 }}>UNCHANGED</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statText, fontFamily: "'JetBrains Mono', monospace" }}>12 Stocks ▬</div>
        </div>
      </div>
    </div>
  );
}
