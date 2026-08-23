import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  Palette,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { Sparkline } from "./Charts";
import { fmt, fmtShares, initials, formatMoney } from "../utils";

const COLOR_THEMES = {
  emerald: {
    id: "emerald",
    name: "Stake Emerald",
    colors: ["#10b981", "#059669", "#34d399", "#047857", "#0d9488", "#14b8a6", "#2dd4bf", "#6ee7b7"],
  },
  cyber: {
    id: "cyber",
    name: "Cyber Matrix",
    colors: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6", "#10b981", "#f43f5e", "#6366f1"],
  },
  slate: {
    id: "slate",
    name: "Monochrome Slate",
    colors: ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#1e293b", "#020617"],
  },
  sunset: {
    id: "sunset",
    name: "Sunset Ember",
    colors: ["#f59e0b", "#ea580c", "#ef4444", "#e11d48", "#db2777", "#9333ea", "#fbbf24", "#fb923c"],
  },
};

// Render active shape on hover for Recharts Pie
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

export function DashboardOverview({
  cashBalance = 50000,
  holdings = {},
  stocks = {},
  stockMetaList = [],
  privacyMode = false,
  onSelectStock = () => {},
  onOpenWallet = () => {},
  darkMode = false,
  currency = "USD",
}) {
  const [viewMode, setViewMode] = useState("assets"); // "assets" | "sectors"
  const [activeTheme, setActiveTheme] = useState("emerald");
  const [activeIndex, setActiveIndex] = useState(0);

  const palette = COLOR_THEMES[activeTheme]?.colors || COLOR_THEMES.emerald.colors;

  // 1. Compute Individual Asset Items
  const holdingTickers = useMemo(
    () => Object.keys(holdings).filter((t) => holdings[t]?.shares > 0.0001),
    [holdings]
  );

  const totalStockValue = useMemo(() => {
    return holdingTickers.reduce((acc, t) => {
      const curPrice = stocks[t]?.price || 0;
      return acc + holdings[t].shares * curPrice;
    }, 0);
  }, [holdingTickers, stocks, holdings]);

  const calculatedNetWorth = Math.max(cashBalance + totalStockValue, 1);

  // Asset level breakdown
  const assetData = useMemo(() => {
    const items = [];

    // Cash slice
    if (cashBalance > 0.01) {
      const pct = (cashBalance / calculatedNetWorth) * 100;
      items.push({
        id: "CASH",
        name: "USD Cash Collateral",
        symbol: "CASH",
        category: "Liquid Reserve",
        value: cashBalance,
        pct: Number(pct.toFixed(1)),
        isCash: true,
        shares: null,
        sparkline: [cashBalance, cashBalance, cashBalance, cashBalance, cashBalance],
      });
    }

    // Equity slices
    holdingTickers.forEach((t) => {
      const h = holdings[t];
      const livePrice = stocks[t]?.price || 150;
      const val = h.shares * livePrice;
      const pct = (val / calculatedNetWorth) * 100;
      const meta = stockMetaList.find((m) => m.ticker === t) || {
        name: t,
        sector: "Equities",
      };
      const cost = h.costBasis || 0;
      const gain = val - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

      // 24-hr sparkline trend points (pure deterministic calculation)
      const openPrice = stocks[t]?.open || livePrice * 0.98;
      const charShift = (t.charCodeAt(0) % 5) * 0.1;
      const midPrice1 = openPrice + (livePrice - openPrice) * 0.35 + charShift;
      const midPrice2 = openPrice + (livePrice - openPrice) * 0.65 - charShift;
      const sparklineData = [openPrice, midPrice1, midPrice2, livePrice];

      items.push({
        id: t,
        name: meta.name || t,
        symbol: t,
        category: meta.sector || "Equities",
        value: val,
        pct: Number(pct.toFixed(1)),
        shares: h.shares,
        price: livePrice,
        costBasis: cost,
        gain,
        gainPct,
        isCash: false,
        sparkline: sparklineData,
      });
    });

    // Sort by value descending
    items.sort((a, b) => b.value - a.value);

    // Assign theme colors
    return items.map((item, idx) => ({
      ...item,
      color: palette[idx % palette.length],
    }));
  }, [holdings, stocks, cashBalance, calculatedNetWorth, stockMetaList, palette, holdingTickers]);

  // 2. Sector level breakdown
  const sectorData = useMemo(() => {
    const sectorMap = {};

    if (cashBalance > 0.01) {
      sectorMap["Cash & Collateral"] = {
        id: "sec-cash",
        name: "Cash & Collateral",
        symbol: "CASH",
        category: "Liquid Reserve",
        value: cashBalance,
        count: 1,
        isCash: true,
      };
    }

    holdingTickers.forEach((t) => {
      const h = holdings[t];
      const livePrice = stocks[t]?.price || 150;
      const val = h.shares * livePrice;
      const meta = stockMetaList.find((m) => m.ticker === t) || { sector: "Other Equities" };
      const sec = meta.sector || "Equities";

      if (!sectorMap[sec]) {
        sectorMap[sec] = {
          id: `sec-${sec}`,
          name: sec,
          symbol: sec,
          category: "Sector Exposure",
          value: 0,
          count: 0,
          isCash: false,
        };
      }
      sectorMap[sec].value += val;
      sectorMap[sec].count += 1;
    });

    const items = Object.values(sectorMap).map((sec) => ({
      ...sec,
      pct: Number(((sec.value / calculatedNetWorth) * 100).toFixed(1)),
    }));

    items.sort((a, b) => b.value - a.value);

    return items.map((item, idx) => ({
      ...item,
      color: palette[idx % palette.length],
    }));
  }, [holdings, stocks, cashBalance, calculatedNetWorth, stockMetaList, palette, holdingTickers]);

  const activeItems = viewMode === "assets" ? assetData : sectorData;
  const currentActiveItem = activeItems[activeIndex] || activeItems[0] || {};

  // Theme Styles
  const bgCard = darkMode ? "#111827" : "#ffffff";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgRow = darkMode ? "#1a2236" : "#f8fafc";
  const bgItemHover = darkMode ? "#243048" : "#f1f5f9";

  return (
    <div
      style={{
        borderRadius: 22,
        padding: "24px",
        background: bgCard,
        border: `1px solid ${borderCol}`,
        boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 8px 24px rgba(0,0,0,0.03)",
        marginBottom: 24,
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>
              PORTFOLIO DIVERSIFICATION
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
              }}
            >
              Interactive Recharts Engine
            </span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginTop: 3 }}>
            Asset Allocation & Strategy Weighting
          </h3>
        </div>

        {/* Controls: View Mode & Color Theme */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Theme Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: darkMode ? "#1e293b" : "#f1f5f9",
              padding: "3px 6px",
              borderRadius: 10,
              border: `1px solid ${borderCol}`,
            }}
          >
            <Palette size={13} color={textSecondary} />
            {Object.values(COLOR_THEMES).map((th) => (
              <button
                key={th.id}
                onClick={() => setActiveTheme(th.id)}
                title={th.name}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: activeTheme === th.id ? (darkMode ? "#334155" : "#ffffff") : "transparent",
                  color: activeTheme === th.id ? textPrimary : textSecondary,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: activeTheme === th.id ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {th.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Asset vs Sector Switcher */}
          <div
            style={{
              display: "flex",
              background: darkMode ? "#1e293b" : "#f1f5f9",
              borderRadius: 10,
              padding: 3,
              border: `1px solid ${borderCol}`,
            }}
          >
            <button
              onClick={() => {
                setViewMode("assets");
                setActiveIndex(0);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                background: viewMode === "assets" ? (darkMode ? "#059669" : "#006c49") : "transparent",
                color: viewMode === "assets" ? "#ffffff" : textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              By Tickers
            </button>
            <button
              onClick={() => {
                setViewMode("sectors");
                setActiveIndex(0);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                background: viewMode === "sectors" ? (darkMode ? "#059669" : "#006c49") : "transparent",
                color: viewMode === "sectors" ? "#ffffff" : textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              By Sectors
            </button>
          </div>
        </div>
      </div>

      {/* Main Allocation Display: Donut Visualizer + Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 20,
          alignItems: "center",
          marginBottom: 24,
          padding: "16px 20px",
          background: bgRow,
          borderRadius: 18,
          border: `1px solid ${borderCol}`,
        }}
      >
        {/* Recharts Modern Interactive Pie / Donut */}
        <div style={{ position: "relative", width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={activeItems}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
              >
                {activeItems.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={darkMode ? "#111827" : "#ffffff"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: darkMode ? "#1e293b" : "#ffffff",
                          padding: "10px 14px",
                          borderRadius: 10,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                          border: `1px solid ${borderCol}`,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 800, color: textPrimary, marginBottom: 2 }}>
                          {data.name} ({data.symbol})
                        </div>
                        <div style={{ color: data.color, fontWeight: 700 }}>
                          {data.pct}% Allocation • {privacyMode ? "••••••••" : formatMoney(data.value, currency)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Readout */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary, textTransform: "uppercase" }}>
              {currentActiveItem.symbol || "ALLOCATION"}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: currentActiveItem.color || textPrimary,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {currentActiveItem.pct || 0}%
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: textSecondary }}>
              {privacyMode ? "••••••••" : formatMoney(currentActiveItem.value || 0, currency)}
            </div>
          </div>
        </div>

        {/* Right Info: Concentration & Diversification Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Spectrum Bar Distribution */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <span style={{ color: textSecondary }}>Portfolio Distribution</span>
              <span style={{ color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {activeItems.length} Position Categories
              </span>
            </div>
            <div
              style={{
                display: "flex",
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: darkMode ? "#334155" : "#e2e8f0",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {activeItems.map((item, idx) => (
                <div
                  key={`bar-${item.id}-${idx}`}
                  style={{
                    width: `${item.pct}%`,
                    background: item.color,
                    transition: "all 0.3s ease",
                  }}
                  title={`${item.name}: ${item.pct}%`}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: darkMode ? "#111827" : "#ffffff",
                border: `1px solid ${borderCol}`,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, color: textSecondary, textTransform: "uppercase" }}>
                Equities vs Cash
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                {Math.round((totalStockValue / calculatedNetWorth) * 100)}% / {Math.round((cashBalance / calculatedNetWorth) * 100)}%
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: darkMode ? "#111827" : "#ffffff",
                border: `1px solid ${borderCol}`,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, color: textSecondary, textTransform: "uppercase" }}>
                Max Position Risk
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: (activeItems[0]?.pct || 0) > 35 ? "#f59e0b" : "#10b981",
                  marginTop: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {activeItems[0]?.pct || 0}% ({activeItems[0]?.symbol || "None"})
              </div>
            </div>
          </div>

          {/* Diversification Rating */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: holdingTickers.length >= 3 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              border: `1px solid ${holdingTickers.length >= 3 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
            }}
          >
            <ShieldCheck size={16} color={holdingTickers.length >= 3 ? "#10b981" : "#f59e0b"} />
            <span style={{ fontSize: 12, fontWeight: 700, color: holdingTickers.length >= 3 ? "#059669" : "#d97706" }}>
              {holdingTickers.length >= 4
                ? "Optimal Portfolio Diversification across sectors"
                : "Concentrated Exposure — Consider adding more non-correlated assets"}
            </span>
          </div>
        </div>
      </div>

      {/* Position Matrix Breakdown with Sparklines (Requirement 5) */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 12 }}>
          {viewMode === "assets" ? "Position Breakdown & 24h Trends" : "Sector Exposures"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeItems.map((item, idx) => {
            const isSelected = activeIndex === idx;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: isSelected ? bgItemHover : bgRow,
                  border: `1px solid ${isSelected ? item.color : borderCol}`,
                  transition: "all 0.15s ease",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {/* Symbol & Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 180 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: `${item.color}22`,
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      border: `1px solid ${item.color}44`,
                    }}
                  >
                    {item.isCash ? "$" : initials(item.name || item.symbol)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>
                        {item.symbol || item.name}
                      </span>
                      {item.category && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: textSecondary,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: darkMode ? "#1e293b" : "#e2e8f0",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 2 }}>
                      {item.isCash
                        ? "Available for trading or AI agent"
                        : item.shares !== null && item.shares !== undefined
                        ? `${fmtShares(item.shares)} shares @ $${fmt(item.price)}`
                        : `${item.count || 1} asset positions`}
                    </div>
                  </div>
                </div>

                {/* 24-Hour Mini-Sparkline (Requirement 5) */}
                {!item.isCash && item.sparkline && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px" }}>
                    <div style={{ width: 80, height: 28 }}>
                      <Sparkline
                        history={item.sparkline}
                        color={item.gain >= 0 ? "#10b981" : "#ef4444"}
                        w={80}
                        h={28}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.gain >= 0 ? "#10b981" : "#ef4444",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.gain >= 0 ? "+" : ""}{fmt(item.gainPct)}%
                    </span>
                  </div>
                )}

                {/* Weight Indicator */}
                <div style={{ flex: "1 1 100px", maxWidth: 160, padding: "0 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: textSecondary }}>Weight</span>
                    <span style={{ color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", borderRadius: 999, background: darkMode ? "#334155" : "#e2e8f0", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${item.pct}%`,
                        background: item.color,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>

                {/* Valuation & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      {privacyMode ? "••••••••" : formatMoney(item.value, currency)}
                    </div>
                    {item.gain !== undefined && !item.isCash && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: item.gain >= 0 ? "#10b981" : "#ef4444",
                          fontFamily: "'JetBrains Mono', monospace",
                          marginTop: 1,
                        }}
                      >
                        {item.gain >= 0 ? "+" : ""}${fmt(item.gain)}
                      </div>
                    )}
                  </div>

                  {!item.isCash && item.symbol && (
                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "transparent",
                        border: `1px solid ${borderCol}`,
                        color: textPrimary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Chart</span>
                      <ArrowUpRight size={13} />
                    </button>
                  )}

                  {item.isCash && (
                    <button
                      onClick={onOpenWallet}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        color: "#10b981",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Deposit</span>
                      <ArrowUpRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
