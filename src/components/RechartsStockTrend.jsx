import { useId, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { fmt, getCurrencySymbol, getCurrencyRate } from "../utils";
import { Calendar } from "lucide-react";

// Fixed reference baseline for pure deterministic rendering without Date.now()/Math.random() in render
const BASE_TIMESTAMP = 1715000000000;

function pseudoRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSyntheticPoints(basePrice, count, rangeId) {
  const points = [];
  const stepMs =
    rangeId === "1D"
      ? 5 * 60 * 1000
      : rangeId === "1W"
      ? 30 * 60 * 1000
      : rangeId === "1M"
      ? 24 * 3600 * 1000
      : rangeId === "1Y"
      ? 7 * 24 * 3600 * 1000
      : 30 * 24 * 3600 * 1000;

  const volatility = rangeId === "1D" ? 0.004 : rangeId === "1W" ? 0.008 : 0.015;
  const startPrice = basePrice * (0.88 + pseudoRand(basePrice + 1) * 0.2);
  let curPrice = startPrice;

  for (let i = 0; i < count; i++) {
    const time = new Date(BASE_TIMESTAMP - (count - 1 - i) * stepMs);
    const progress = i / (count - 1);
    const target = startPrice + (basePrice - startPrice) * progress;
    const rVal = pseudoRand(basePrice * 17 + i * 31);
    const delta = (rVal - 0.48) * curPrice * volatility + (target - curPrice) * 0.15;
    curPrice = Math.max(curPrice * 0.5, curPrice + delta);

    const timeLabel =
      rangeId === "1D"
        ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : rangeId === "1W" || rangeId === "1M"
        ? time.toLocaleDateString([], { month: "short", day: "numeric" })
        : time.toLocaleDateString([], { month: "short", year: "2-digit" });

    points.push({
      time: timeLabel,
      fullDate: time.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      priceUSD: Number(curPrice.toFixed(2)),
      volume: Math.floor(10000 + pseudoRand(i * 19 + 5) * 85000),
    });
  }

  if (points.length > 0) {
    points[points.length - 1].priceUSD = Number(basePrice.toFixed(2));
  }

  return points;
}

function CustomTrendTooltip({ active, payload, firstVal, symbol, darkMode }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const current = data.price;
    const diff = current - firstVal;
    const diffPct = firstVal > 0 ? (diff / firstVal) * 100 : 0;

    return (
      <div
        style={{
          background: darkMode ? "#0f172a" : "#ffffff",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          textAlign: "left",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div style={{ fontSize: 11, color: darkMode ? "#94a3b8" : "#64748b", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={12} />
          <span>{data.fullDate || data.time}</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: darkMode ? "#ffffff" : "#0f172a" }}>
            {symbol} {fmt(current)}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: diff >= 0 ? "#10b981" : "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {diff >= 0 ? "+" : ""}
            {symbol} {fmt(diff)} ({diff >= 0 ? "+" : ""}
            {fmt(diffPct)}%)
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            fontSize: 10.5,
            color: darkMode ? "#94a3b8" : "#64748b",
            marginTop: 6,
            paddingTop: 6,
            borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          {data.high && <span>H: <strong style={{ color: "#10b981" }}>{symbol} {fmt(data.high)}</strong></span>}
          {data.low && <span>L: <strong style={{ color: "#ef4444" }}>{symbol} {fmt(data.low)}</strong></span>}
          {data.volume && <span>Vol: <strong>{data.volume > 1e6 ? `${(data.volume / 1e6).toFixed(1)}M` : `${(data.volume / 1e3).toFixed(0)}K`}</strong></span>}
        </div>
      </div>
    );
  }
  return null;
}

export function RechartsStockTrend({
  basePrice = 150,
  currency = "USD",
  height = 340,
  darkMode = false,
  showVolume = true,
  range = "1M",
  liveHistory,
  liveCandles,
}) {
  const chartGradId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rate = getCurrencyRate(currency);
  const symbol = getCurrencySymbol(currency);

  // Compute chart points synchronously with priority on props (liveCandles / liveHistory)
  const internalData = useMemo(() => {
    if (liveCandles && liveCandles.length > 3) {
      return liveCandles.map((c, idx) => {
        const dt = new Date(c.time || c.date || BASE_TIMESTAMP - (liveCandles.length - idx) * 3600000);
        const timeLabel =
          range === "1D"
            ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : range === "1W" || range === "1M"
            ? dt.toLocaleDateString([], { month: "short", day: "numeric" })
            : dt.toLocaleDateString([], { month: "short", year: "2-digit" });

        return {
          time: timeLabel,
          fullDate: dt.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          priceUSD: Number((c.close || c.price || basePrice).toFixed(2)),
          openUSD: c.open,
          highUSD: c.high,
          lowUSD: c.low,
          volume: c.volume || Math.floor(15000 + pseudoRand(idx * 7 + 11) * 45000),
          isUp: (c.close || c.price || basePrice) >= (c.open || basePrice),
        };
      });
    }

    if (liveHistory && liveHistory.length > 3) {
      return liveHistory.map((p, idx) => {
        const dt = new Date(BASE_TIMESTAMP - (liveHistory.length - idx) * 3600000);
        const prev = idx > 0 ? liveHistory[idx - 1] : p;
        return {
          time:
            range === "1D"
              ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : dt.toLocaleDateString([], { month: "short", day: "numeric" }),
          fullDate: dt.toLocaleString(),
          priceUSD: Number((p || basePrice).toFixed(2)),
          volume: Math.floor(20000 + pseudoRand(idx * 13 + 19) * 50000),
          isUp: p >= prev,
        };
      });
    }

    // Fast synthetic fallback
    const count = range === "1D" ? 28 : range === "1W" ? 35 : range === "1M" ? 28 : 40;
    return generateSyntheticPoints(basePrice || 100, count, range);
  }, [range, basePrice, liveCandles, liveHistory]);

  const convertedData = useMemo(() => {
    if (!internalData || internalData.length === 0) return [];
    return internalData.map((d) => ({
      ...d,
      price: Number((d.priceUSD * rate).toFixed(2)),
      high: d.highUSD ? Number((d.highUSD * rate).toFixed(2)) : undefined,
      low: d.lowUSD ? Number((d.lowUSD * rate).toFixed(2)) : undefined,
      open: d.openUSD ? Number((d.openUSD * rate).toFixed(2)) : undefined,
    }));
  }, [internalData, rate]);

  const firstVal = convertedData[0]?.price || 0;
  const lastVal = convertedData[convertedData.length - 1]?.price || 0;
  const isPositive = lastVal >= firstVal;

  const minPrice = useMemo(() => {
    if (convertedData.length === 0) return 0;
    const min = Math.min(...convertedData.map((d) => d.price));
    return Math.floor(min * 0.985);
  }, [convertedData]);

  const maxPrice = useMemo(() => {
    if (convertedData.length === 0) return 100;
    const max = Math.max(...convertedData.map((d) => d.price));
    return Math.ceil(max * 1.015);
  }, [convertedData]);

  const maxVolume = useMemo(() => {
    if (convertedData.length === 0) return 10000;
    return Math.max(...convertedData.map((d) => d.volume || 10000));
  }, [convertedData]);

  const strokeColor = isPositive ? "#10b981" : "#ef4444";
  const fillColor = isPositive ? "#10b981" : "#ef4444";

  const priceChartHeight = showVolume ? Math.max(200, height * 0.72) : height;
  const volChartHeight = showVolume ? Math.max(65, height * 0.28) : 0;

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      <div style={{ width: "100%", height: priceChartHeight, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={convertedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${chartGradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={darkMode ? 0.35 : 0.28} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}
            />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: darkMode ? "#64748b" : "#94a3b8",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              minTickGap={28}
            />

            <YAxis
              domain={[minPrice, maxPrice]}
              tickLine={false}
              axisLine={false}
              orientation="right"
              tick={{
                fontSize: 11,
                fill: darkMode ? "#64748b" : "#94a3b8",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              tickFormatter={(val) => `${symbol} ${fmt(val, val >= 1000 ? 0 : 2)}`}
            />

            <Tooltip
              content={<CustomTrendTooltip firstVal={firstVal} symbol={symbol} darkMode={darkMode} />}
            />

            <ReferenceLine
              y={firstVal}
              stroke={darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
              strokeDasharray="3 3"
              label={{
                value: `Baseline: ${symbol} ${fmt(firstVal, 2)}`,
                position: "insideTopLeft",
                fill: darkMode ? "#64748b" : "#94a3b8",
                fontSize: 10,
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.4}
              fillOpacity={1}
              fill={`url(#grad-${chartGradId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showVolume && (
        <div style={{ width: "100%", marginTop: 10, borderTop: `1px dashed ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: darkMode ? "#94a3b8" : "#64748b", marginBottom: 4, padding: "0 2px" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              VOLUME HISTOGRAM
            </span>
            <span style={{ background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "1px 6px", borderRadius: 4 }}>
              PEAK: {maxVolume > 1e6 ? `${(maxVolume / 1e6).toFixed(2)}M` : `${(maxVolume / 1e3).toFixed(0)}K`}
            </span>
          </div>

          <div style={{ width: "100%", height: volChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convertedData} margin={{ top: 2, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={[0, maxVolume * 1.1]}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: darkMode ? "#64748b" : "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}
                  tickFormatter={(v) => (v > 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`)}
                />
                <Bar
                  dataKey="volume"
                  fill={darkMode ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.6)"}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export const LinesStockTrend = RechartsStockTrend;
