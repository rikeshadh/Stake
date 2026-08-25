import { useState, useMemo, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  Palette,
  Check,
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
  darkMode = false,
  currency = "USD",
}) {
  const [viewMode, setViewMode] = useState("assets"); // "assets" | "sectors"
  const [activeTheme, setActiveTheme] = useState("emerald");
  const [themePopupOpen, setThemePopupOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const themeRef = useRef(null);

  useEffect(() => {
    if (!themePopupOpen) return;
    const handleDocClick = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemePopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [themePopupOpen]);

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

  const totalPortfolioValue = cashBalance + totalStockValue;
  const hasCapital = totalPortfolioValue > 0.01;
  const calculatedNetWorth = Math.max(totalPortfolioValue, 1);

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

      // 24-hr sparkline trend points
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
  const currentActiveItem = activeItems[activeIndex] || activeItems[0] || (hasCapital ? {
    name: "Portfolio Capital",
    symbol: "TOTAL",
    value: totalPortfolioValue,
    pct: 100,
    color: palette[0],
  } : {
    name: "Unallocated",
    symbol: "READY",
    value: 0,
    pct: 0,
    color: "#94a3b8",
  });

  // Calculate high-fidelity Equities vs Cash ratios
  const equitiesPct = hasCapital ? Math.round((totalStockValue / totalPortfolioValue) * 100) : 0;
  const cashPct = hasCapital ? Math.round((cashBalance / totalPortfolioValue) * 100) : 0;

  // Calculate Max Position Risk
  const topEquity = assetData.find((a) => !a.isCash);
  const maxRiskFormatted = topEquity
    ? `${topEquity.pct}% (${topEquity.symbol})`
    : cashBalance > 0
    ? "100% (Liquid Cash)"
    : "0% (Unfunded)";

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
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginTop: 3 }}>
            Asset Allocation & Strategy Weighting
          </h3>
        </div>

        {/* Controls: View Mode & Color Theme Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Theme Switcher Popup Dropdown */}
          <div style={{ position: "relative" }} ref={themeRef}>
            <button
              id="theme-palette-btn"
              onClick={() => setThemePopupOpen((prev) => !prev)}
              title={`Color Theme: ${COLOR_THEMES[activeTheme]?.name || "Palette"}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 10,
                background: darkMode ? "#1e293b" : "#f1f5f9",
                border: `1px solid ${borderCol}`,
                color: palette[0],
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Palette size={16} />
            </button>

            {themePopupOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: 60,
                  background: darkMode ? "#1e293b" : "#ffffff",
                  border: `1px solid ${borderCol}`,
                  borderRadius: 14,
                  padding: 6,
                  minWidth: 200,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              >
                {Object.values(COLOR_THEMES).map((th) => {
                  const isSelected = activeTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        setActiveTheme(th.id);
                        setThemePopupOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: isSelected ? (darkMode ? "#334155" : "#f0fdf4") : "transparent",
                        color: isSelected ? (darkMode ? "#34d399" : "#059669") : textPrimary,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        transition: "background 0.1s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {th.colors.slice(0, 4).map((c, i) => (
                            <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                          ))}
                        </div>
                        <span>{th.name}</span>
                      </div>
                      {isSelected && <Check size={14} color={darkMode ? "#34d399" : "#059669"} />}
                    </button>
                  );
                })}
              </div>
            )}
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
                data={activeItems.length > 0 ? activeItems : [{ name: "Awaiting Allocation", symbol: "EMPTY", value: 1, color: darkMode ? "#334155" : "#cbd5e1" }]}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={activeItems.length > 1 ? 3 : 0}
                dataKey="value"
                onMouseEnter={(_, idx) => {
                  if (activeItems.length > 0) setActiveIndex(idx);
                }}
              >
                {(activeItems.length > 0 ? activeItems : [{ color: darkMode ? "#334155" : "#cbd5e1" }]).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={darkMode ? "#111827" : "#ffffff"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
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
              {currentActiveItem.symbol || (hasCapital ? "PORTFOLIO" : "READY")}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: currentActiveItem.color || textPrimary,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {activeItems.length > 0 ? `${currentActiveItem.pct || 0}%` : (hasCapital ? "100%" : "READY")}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: textSecondary }}>
              {privacyMode ? "••••••••" : formatMoney(currentActiveItem.value || (hasCapital ? totalPortfolioValue : 0), currency)}
            </div>
          </div>
        </div>

        {/* Right Info: Concentration & Diversification Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Spectrum Bar Distribution */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: textPrimary, fontSize: 13, fontWeight: 800 }}>Portfolio Distribution</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: hasCapital ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                    color: hasCapital ? "#059669" : textSecondary,
                  }}
                >
                  {activeItems.length > 0 ? `${activeItems.length} ${activeItems.length === 1 ? "Position Category" : "Position Categories"}` : "Unallocated"}
                </span>
              </div>
              <span style={{ color: textSecondary, fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace" }}>
                {privacyMode ? "••••" : formatMoney(totalPortfolioValue, currency)}
              </span>
            </div>

            {/* Spectrum Bar */}
            <div
              style={{
                display: "flex",
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: darkMode ? "#334155" : "#e2e8f0",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {activeItems.length > 0 ? (
                activeItems.map((item, idx) => (
                  <div
                    key={`bar-${item.id}-${idx}`}
                    style={{
                      width: `${item.pct}%`,
                      background: item.color,
                      transition: "all 0.3s ease",
                    }}
                    title={`${item.name}: ${item.pct}%`}
                  />
                ))
              ) : (
                <div style={{ width: "100%", background: darkMode ? "#475569" : "#cbd5e1", opacity: 0.6 }} />
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: darkMode ? "#111827" : "#ffffff",
                border: `1px solid ${borderCol}`,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Equities vs Cash
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                {hasCapital ? `${equitiesPct}% / ${cashPct}%` : "0% / 0%"}
              </div>
              <div style={{ fontSize: 11, color: textSecondary, marginTop: 3 }}>
                {hasCapital
                  ? `${privacyMode ? "••••" : formatMoney(totalStockValue, currency)} stocks • ${privacyMode ? "••••" : formatMoney(cashBalance, currency)} cash`
                  : "Deposit funds to allocate"}
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: darkMode ? "#111827" : "#ffffff",
                border: `1px solid ${borderCol}`,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Max Position Risk
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: topEquity && topEquity.pct > 40 ? "#f59e0b" : "#10b981",
                  marginTop: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {maxRiskFormatted}
              </div>
              <div style={{ fontSize: 11, color: textSecondary, marginTop: 3 }}>
                {topEquity
                  ? `${topEquity.name} (${topEquity.pct}%)`
                  : cashBalance > 0
                  ? "Zero stock concentration risk"
                  : "No risk exposure"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Position Matrix Breakdown with Sparklines */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginBottom: 12 }}>
          {viewMode === "assets" ? "Position Breakdown & 24h Trends" : "Sector Exposures"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeItems.length > 0 ? (
            activeItems.map((item, idx) => {
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

                  {/* 24-Hour Mini-Sparkline */}
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

                  {/* Valuation & Gain/Loss */}
                  <div style={{ textAlign: "right", minWidth: 90 }}>
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
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "24px 20px",
                borderRadius: 14,
                background: bgRow,
                border: `1px dashed ${borderCol}`,
                textAlign: "center",
                color: textSecondary,
                fontSize: 13,
              }}
            >
              No active positions or funds yet. Deposit capital or explore markets to start building your portfolio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
