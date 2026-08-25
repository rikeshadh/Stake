import { useState, useEffect, useId, useMemo } from "react";
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
import { fetchYFinanceChart } from "../api";
import { fmt, getCurrencySymbol, getCurrencyRate } from "../utils";
import { TrendingUp, TrendingDown, Calendar, Check } from "lucide-react";

const TIME_RANGES = [
  { id: "1D", label: "1D", range: "1d", interval: "5m" },
  { id: "1W", label: "1W", range: "5d", interval: "15m" },
  { id: "1M", label: "1M", range: "1mo", interval: "1d" },
  { id: "3M", label: "3M", range: "3mo", interval: "1d" },
  { id: "1Y", label: "1Y", range: "1y", interval: "1wk" },
  { id: "ALL", label: "ALL", range: "5y", interval: "1mo" },
];

function generateSyntheticPoints(basePrice, count, rangeId) {
  const points = [];
  const now = Date.now();
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
  const startPrice = basePrice * (0.88 + Math.random() * 0.2);
  let curPrice = startPrice;

  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - 1 - i) * stepMs);
    const progress = i / (count - 1);
    const target = startPrice + (basePrice - startPrice) * progress;
    const delta = (Math.random() - 0.48) * curPrice * volatility + (target - curPrice) * 0.15;
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
      volume: Math.floor(10000 + Math.random() * 85000),
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
  ticker = "NVDA",
  basePrice = 150,
  currency = "USD",
  height = 340,
  darkMode = false,
  showVolume: initialShowVolume = true,
}) {
  const [selectedRange, setSelectedRange] = useState("1M");
  const [showVolume, setShowVolume] = useState(initialShowVolume);
  const [chartData, setChartData] = useState([]);
  const chartGradId = useId().replace(/[^a-zA-Z0-9]/g, "");

  const rate = getCurrencyRate(currency);
  const symbol = getCurrencySymbol(currency);

  useEffect(() => {
    let isMounted = true;
    async function loadTrendData() {
      const cfg = TIME_RANGES.find((r) => r.id === selectedRange) || TIME_RANGES[2];

      try {
        const res = await fetchYFinanceChart(ticker, cfg.range, cfg.interval);
        if (isMounted && res) {
          if (res.candles && res.candles.length > 3) {
            const formatted = res.candles.map((c, idx) => {
              const dt = new Date(c.time || c.date || Date.now() - (res.candles.length - idx) * 3600000);
              const timeLabel =
                selectedRange === "1D"
                  ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : selectedRange === "1W" || selectedRange === "1M"
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
                volume: c.volume || Math.floor(15000 + Math.random() * 45000),
                isUp: (c.close || c.price || basePrice) >= (c.open || basePrice),
              };
            });
            setChartData(formatted);
            return;
          } else if (res.history && res.history.length > 3) {
            const formatted = res.history.map((p, idx) => {
              const dt = new Date(Date.now() - (res.history.length - idx) * 3600000);
              const prev = idx > 0 ? res.history[idx - 1] : p;
              return {
                time:
                  selectedRange === "1D"
                    ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : dt.toLocaleDateString([], { month: "short", day: "numeric" }),
                fullDate: dt.toLocaleString(),
                priceUSD: Number((p || basePrice).toFixed(2)),
                volume: Math.floor(20000 + Math.random() * 50000),
                isUp: p >= prev,
              };
            });
            setChartData(formatted);
            return;
          }
        }
      } catch (err) {
        console.warn("Recharts live fetch fallback:", err);
      }

      if (isMounted) {
        const count = selectedRange === "1D" ? 36 : selectedRange === "1W" ? 42 : selectedRange === "1M" ? 30 : 52;
        const synth = generateSyntheticPoints(basePrice || 100, count, selectedRange);
        setChartData(synth);
      }
    }

    loadTrendData();
    return () => {
      isMounted = false;
    };
  }, [ticker, selectedRange, basePrice]);

  const convertedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return chartData.map((d) => ({
      ...d,
      price: Number((d.priceUSD * rate).toFixed(2)),
      high: d.highUSD ? Number((d.highUSD * rate).toFixed(2)) : undefined,
      low: d.lowUSD ? Number((d.lowUSD * rate).toFixed(2)) : undefined,
      open: d.openUSD ? Number((d.openUSD * rate).toFixed(2)) : undefined,
    }));
  }, [chartData, rate]);

  const firstVal = convertedData[0]?.price || 0;
  const lastVal = convertedData[convertedData.length - 1]?.price || 0;
  const isPositive = lastVal >= firstVal;
  const priceChange = lastVal - firstVal;
  const pctChange = firstVal > 0 ? (priceChange / firstVal) * 100 : 0;

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
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 800,
              color: isPositive ? "#10b981" : "#ef4444",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {isPositive ? "+" : ""}
              {symbol} {fmt(priceChange)} ({isPositive ? "+" : ""}
              {fmt(pctChange)}%)
            </span>
            <span style={{ fontSize: 11, color: darkMode ? "#94a3b8" : "#64748b", fontWeight: 600, marginLeft: 4 }}>
              over {selectedRange}
            </span>
          </div>

          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              border: `1px solid ${showVolume ? "#10b981" : darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
              background: showVolume ? (darkMode ? "rgba(16,185,129,0.14)" : "#f0fdf4") : "transparent",
              color: showVolume ? "#10b981" : darkMode ? "#94a3b8" : "#64748b",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: 3,
                border: `1.5px solid ${showVolume ? "#10b981" : "#94a3b8"}`,
                background: showVolume ? "#10b981" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showVolume && <Check size={10} color="#ffffff" strokeWidth={3.5} />}
            </div>
            <span>Volume Bars</span>
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            padding: 3,
            borderRadius: 10,
          }}
        >
          {TIME_RANGES.map((r) => {
            const isSelected = selectedRange === r.id;
            return (
              <button
                key={r.id}
                id={`recharts-range-btn-${r.id}`}
                onClick={() => setSelectedRange(r.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? (darkMode ? "#10b981" : "#006c49") : "transparent",
                  color: isSelected ? "#ffffff" : darkMode ? "#94a3b8" : "#64748b",
                  transition: "all 0.15s ease",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

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
              isAnimationActive={true}
              animationDuration={450}
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
                  isAnimationActive={true}
                  animationDuration={400}
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
