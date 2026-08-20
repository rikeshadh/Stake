import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  PieChart as PieIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowUpRight,
} from "lucide-react";
import { fmtShares, formatMoney } from "../utils";

// Sector mapping for standard tickers
const TICKER_SECTORS = {
  NVDA: "Semiconductors & AI",
  AAPL: "Consumer Technology",
  TSLA: "Automotive & Clean Energy",
  MSFT: "Cloud & Enterprise Software",
  AMZN: "E-Commerce & Cloud",
  GOOGL: "Search & Digital Media",
  META: "Social Media & Metaverse",
  COIN: "Digital Assets Exchange",
  NFLX: "Entertainment & Streaming",
  AMD: "Semiconductors",
  SPY: "Index ETF (S&P 500)",
  QQQ: "Index ETF (Nasdaq 100)",
};

const ASSET_COLORS = [
  "#006c49", // Stake Forest
  "#10b981", // Emerald
  "#3b82f6", // Royal Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#64748b", // Slate
];

export function DashboardOverview({
  netWorth = 0,
  cashBalance = 0,
  holdings = {},
  stocks = {},
  stockMetaList = [],
  privacyMode = false,
  setPrivacyMode = () => {},
  onSelectStock = () => {},
  onOpenWallet = () => {},
  darkMode = false,
  currency = "USD",
}) {
  const [viewMode, setViewMode] = useState("assets"); // "assets" | "sectors"
  const [activeIndex, setActiveIndex] = useState(null);

  // Compute live holding valuations
  const holdingTickers = useMemo(() => {
    return Object.keys(holdings).filter((t) => holdings[t]?.shares > 0.0001);
  }, [holdings]);

  const totalStockValue = useMemo(() => {
    return holdingTickers.reduce((acc, t) => {
      const curPrice = stocks[t]?.price || 0;
      return acc + (holdings[t]?.shares || 0) * curPrice;
    }, 0);
  }, [holdingTickers, holdings, stocks]);

  const computedNetWorth = netWorth || (cashBalance || 0) + totalStockValue;
  const portfolioTotal = computedNetWorth > 0 ? computedNetWorth : 1;

  // Build Asset Allocation Data
  const assetData = useMemo(() => {
    const items = [];

    // Cash slice
    if (cashBalance > 0.01) {
      const pct = (cashBalance / portfolioTotal) * 100;
      items.push({
        id: "CASH",
        name: "USD Cash (Available)",
        symbol: "CASH",
        category: "Liquid Wallet",
        value: cashBalance,
        pct: Number(pct.toFixed(2)),
        color: "#006c49",
        shares: null,
        price: 1,
        isCash: true,
      });
    }

    // Equities slices
    holdingTickers.forEach((t, idx) => {
      const h = holdings[t];
      const curPrice = stocks[t]?.price || 0;
      const val = (h?.shares || 0) * curPrice;
      const pct = (val / portfolioTotal) * 100;
      const meta = stockMetaList.find((m) => m.ticker === t);
      const color = meta?.color || ASSET_COLORS[(idx + 1) % ASSET_COLORS.length];
      const sector = TICKER_SECTORS[t] || meta?.sector || "Equities";

      items.push({
        id: t,
        name: meta?.name || t,
        symbol: t,
        category: sector,
        value: val,
        pct: Number(pct.toFixed(2)),
        color: color,
        shares: h?.shares || 0,
        price: curPrice,
        costBasis: h?.costBasis || 0,
        isCash: false,
      });
    });

    // Sort descending by value
    return items.sort((a, b) => b.value - a.value);
  }, [cashBalance, holdingTickers, holdings, stocks, stockMetaList, portfolioTotal]);

  // Build Sector Allocation Data
  const sectorData = useMemo(() => {
    const map = new Map();

    assetData.forEach((item) => {
      const cat = item.category || "Equities";
      const existing = map.get(cat) || { name: cat, value: 0, count: 0, color: item.color };
      existing.value += item.value;
      existing.count += 1;
      map.set(cat, existing);
    });

    const sectors = Array.from(map.values()).map((s, idx) => ({
      id: s.name,
      name: s.name,
      symbol: s.name,
      value: s.value,
      pct: Number(((s.value / portfolioTotal) * 100).toFixed(2)),
      color: s.name === "Liquid Wallet" ? "#006c49" : ASSET_COLORS[idx % ASSET_COLORS.length],
      count: s.count,
    }));

    return sectors.sort((a, b) => b.value - a.value);
  }, [assetData, portfolioTotal]);

  const activeChartData = viewMode === "assets" ? assetData : sectorData;
  const hoveredItem = activeIndex !== null && activeChartData[activeIndex] ? activeChartData[activeIndex] : null;

  // Diversification stats
  const cashPct = ((cashBalance / portfolioTotal) * 100).toFixed(1);
  const stockPct = ((totalStockValue / portfolioTotal) * 100).toFixed(1);
  const topHolding = assetData.find((a) => !a.isCash);
  const topHoldingPct = topHolding ? topHolding.pct : 0;

  // Theming
  const bgCard = darkMode ? "#111827" : "#ffffff";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgRow = darkMode ? "#1a2236" : "#f8fafc";
  const bgHover = darkMode ? "#243048" : "#f1f5f9";

  return (
    <div
      id="dashboard-overview-container"
      style={{
        background: bgCard,
        borderRadius: 22,
        padding: "24px",
        border: `1px solid ${borderCol}`,
        boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.03)",
        textAlign: "left",
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
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${borderCol}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(0, 108, 73, 0.1)",
              color: "#006c49",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PieIcon size={18} />
          </div>
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Asset Allocation & Portfolio Breakdown
            </h2>
            <p style={{ fontSize: 12.5, color: textSecondary, margin: "2px 0 0", fontWeight: 400 }}>
              Live distribution of equity positions and liquid cash balances
            </p>
          </div>
        </div>

        {/* View Mode Pills & Privacy Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              background: bgRow,
              borderRadius: 10,
              padding: 3,
              border: `1px solid ${borderCol}`,
            }}
          >
            <button
              onClick={() => {
                setViewMode("assets");
                setActiveIndex(null);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "none",
                fontSize: 12,
                fontWeight: viewMode === "assets" ? 600 : 500,
                background: viewMode === "assets" ? "#006c49" : "transparent",
                color: viewMode === "assets" ? "#ffffff" : textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              By Asset
            </button>
            <button
              onClick={() => {
                setViewMode("sectors");
                setActiveIndex(null);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "none",
                fontSize: 12,
                fontWeight: viewMode === "sectors" ? 600 : 500,
                background: viewMode === "sectors" ? "#006c49" : "transparent",
                color: viewMode === "sectors" ? "#ffffff" : textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              By Sector
            </button>
          </div>

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 10,
              background: bgRow,
              border: `1px solid ${borderCol}`,
              color: privacyMode ? "#006c49" : textSecondary,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title={privacyMode ? "Show Balances" : "Hide Balances"}
          >
            {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{privacyMode ? "Hidden" : "Hide"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Donut Chart on Left, Breakdown List & Metrics on Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "center",
        }}
      >
        {/* Left: Recharts Donut Visualization with Center Metadata */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 280,
            background: bgRow,
            borderRadius: 18,
            border: `1px solid ${borderCol}`,
            padding: "16px 12px",
          }}
        >
          <div style={{ width: "100%", height: 240, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={2}
                  cornerRadius={3}
                  animationDuration={600}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {activeChartData.map((entry, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <Cell
                        key={`cell-${entry.id || index}`}
                        fill={entry.color}
                        stroke={darkMode ? "#111827" : "#ffffff"}
                        strokeWidth={isSelected ? 3 : 1.5}
                        style={{
                          opacity: activeIndex === null || isSelected ? 1 : 0.4,
                          transform: isSelected ? "scale(1.03)" : "scale(1)",
                          transformOrigin: "center center",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Dynamic Data Callout */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
                width: 120,
              }}
            >
              {hoveredItem ? (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: hoveredItem.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {hoveredItem.symbol || hoveredItem.name}
                  </div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: textPrimary,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {hoveredItem.pct}%
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {privacyMode ? "••••••••" : formatMoney(hoveredItem.value, currency)}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: textSecondary,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    TOTAL ASSETS
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: textPrimary,
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 2,
                    }}
                  >
                    {privacyMode ? "••••••••" : formatMoney(computedNetWorth, currency)}
                  </div>
                  <div style={{ fontSize: 11, color: "#006c49", fontWeight: 600, marginTop: 2 }}>
                    {activeChartData.length} {viewMode === "assets" ? "Assets" : "Sectors"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              fontSize: 11.5,
              color: textSecondary,
              width: "100%",
              paddingTop: 10,
              borderTop: `1px solid ${borderCol}`,
              marginTop: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#006c49" }} />
              <span>Cash: <strong style={{ color: textPrimary }}>{cashPct}%</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
              <span>Equities: <strong style={{ color: textPrimary }}>{stockPct}%</strong></span>
            </div>
            {topHolding && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: topHolding.color }} />
                <span>Max Position ({topHolding.symbol}): <strong style={{ color: textPrimary }}>{topHoldingPct}%</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Allocation Breakdown List with Percentage Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              fontWeight: 600,
              color: textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 6px 4px",
            }}
          >
            <span>Asset / Class</span>
            <span>Weight & Valuation</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 250,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {activeChartData.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.id || index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => {
                    if (!item.isCash && item.symbol) {
                      onSelectStock(item.symbol);
                    } else if (item.isCash) {
                      onOpenWallet();
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: isHovered ? bgHover : bgRow,
                    border: `1px solid ${isHovered ? item.color : borderCol}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                            {item.symbol}
                          </span>
                          {!item.isCash && (
                            <span style={{ fontSize: 11, color: textSecondary, fontWeight: 400 }}>
                              ({fmtShares(item.shares)} shares)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary, fontWeight: 400 }}>
                          {item.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {privacyMode ? "••••••••" : formatMoney(item.value, currency)}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: item.color }}>
                        {item.pct}%
                      </div>
                    </div>
                  </div>

                  {/* Slim Visual Weight Bar */}
                  <div
                    style={{
                      height: 4,
                      width: "100%",
                      background: darkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(item.pct, 100)}%`,
                        background: item.color,
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(0, 108, 73, 0.05)",
              border: "1px solid rgba(0, 108, 73, 0.15)",
              marginTop: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#006c49", fontWeight: 500 }}>
              <ShieldCheck size={14} />
              <span>Simulated Portfolio Allocation Engine</span>
            </div>
            <button
              onClick={onOpenWallet}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                color: "#006c49",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Deposit / Manage Cash <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
