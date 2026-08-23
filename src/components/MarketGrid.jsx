import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  LayoutGrid,
  ListFilter,
  Filter
} from "lucide-react";
import { Sparkline } from "./Charts";
import { fmt, initials } from "../utils";

const SECTORS = [
  "All",
  "Semiconductors & AI",
  "Cloud & Software",
  "Consumer & Retail",
  "Electric Vehicles",
  "Financials & Banking",
  "Fintech & Payments",
  "Healthcare",
  "Entertainment & Media"
];

export function MarketGrid({
  stocks,
  stockMetaList,
  watchlist,
  onToggleWatch,
  onSelectStock,
  onOpenOrderDesk,
  dayChange,
  flash,
}) {
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [authFilter, setAuthFilter] = useState("ALL"); // "ALL" | "AUTHENTICATED" | "GUEST"
  const [sort, setSort] = useState("movers"); // "movers" | "az" | "price_high" | "price_low"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Filter stocks by search, sector, and access tier
  let filtered = stockMetaList.filter((s) => {
    const matchesSearch =
      s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.sector && s.sector.toLowerCase().includes(search.toLowerCase()));

    const matchesSector =
      selectedSector === "All" ||
      (s.sector && s.sector.toLowerCase().includes(selectedSector.toLowerCase())) ||
      (selectedSector.includes("Semi") && (s.sector?.includes("Semi") || s.sector?.includes("AI") || s.sector?.includes("Tech"))) ||
      (selectedSector.includes("Cloud") && (s.sector?.includes("Cloud") || s.sector?.includes("Software"))) ||
      (selectedSector.includes("Consumer") && (s.sector?.includes("Consumer") || s.sector?.includes("Retail") || s.sector?.includes("Food"))) ||
      (selectedSector.includes("Financial") && (s.sector?.includes("Finance") || s.sector?.includes("Bank") || s.sector?.includes("Holdings"))) ||
      (selectedSector.includes("Fintech") && (s.sector?.includes("Fintech") || s.sector?.includes("Payments"))) ||
      (selectedSector.includes("Electric") && (s.sector?.includes("EV") || s.sector?.includes("Auto")));

    const isGuestFeatured = ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "TSLA", "META", "AMD", "NFLX", "DIS", "PLTR", "BABA", "ASML"].includes(s.ticker);
    const matchesAuth =
      authFilter === "ALL" ||
      (authFilter === "AUTHENTICATED" && !isGuestFeatured) ||
      (authFilter === "GUEST" && isGuestFeatured);

    return matchesSearch && matchesSector && matchesAuth;
  });

  // Sort logic
  if (sort === "az") {
    filtered = [...filtered].sort((a, b) => a.ticker.localeCompare(b.ticker));
  } else if (sort === "price_high") {
    filtered = [...filtered].sort((a, b) => (stocks[b.ticker]?.price || 0) - (stocks[a.ticker]?.price || 0));
  } else if (sort === "price_low") {
    filtered = [...filtered].sort((a, b) => (stocks[a.ticker]?.price || 0) - (stocks[b.ticker]?.price || 0));
  } else if (sort === "movers") {
    filtered = [...filtered].sort((a, b) => dayChange(b.ticker) - dayChange(a.ticker));
  }

  // Clean Light Theme Palette
  const bgCard = "#ffffff";
  const borderCol = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const bgInput = "#ffffff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ paddingTop: 16, textAlign: "left" }}
    >
      {/* 1. Header with Title & Stats Overview */}
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
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: textPrimary }}>
            Markets Explorer
          </h1>
        </div>

        {/* View Mode Switcher & Sort Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: bgInput,
              border: `1px solid ${borderCol}`,
              color: textPrimary,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <option value="movers">Sort: Top Daily Movers</option>
            <option value="price_high">Sort: Price (High to Low)</option>
            <option value="price_low">Sort: Price (Low to High)</option>
            <option value="az">Sort: Alphabetical (A-Z)</option>
          </select>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, border: `1px solid ${borderCol}` }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                border: "none",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#059669" : textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                border: "none",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#059669" : textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
              title="Table View"
            >
              <ListFilter size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Sector Category Filter Pills */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Search bar */}
        <div style={{ position: "relative", width: "100%" }}>
          <Search size={16} color={textSecondary} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticker, company name, or sector (e.g. NVDA, Apple, Semiconductor, Banking)..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              borderRadius: 14,
              background: bgInput,
              border: `1px solid ${borderCol}`,
              color: textPrimary,
              fontSize: 13.5,
              boxSizing: "border-box",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "#f1f5f9",
                border: "none",
                borderRadius: 999,
                width: 20,
                height: 20,
                color: textSecondary,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Access Tier / Scope Filters (Auth vs Guest) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, background: "#f1f5f9", padding: 3, borderRadius: 10, border: `1px solid ${borderCol}` }}>
            {[
              { id: "ALL", label: "All Equities", count: stockMetaList.length },
              { id: "AUTHENTICATED", label: "Live Traded (Auth)", count: stockMetaList.length - 13 },
              { id: "GUEST", label: "Guest / Demo Feeds", count: 13 },
            ].map((f) => {
              const active = authFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setAuthFilter(f.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: "none",
                    background: active ? (f.id === "GUEST" ? "#f59e0b" : f.id === "AUTHENTICATED" ? "#0284c7" : "#059669") : "transparent",
                    color: active ? "#ffffff" : textSecondary,
                    fontSize: 11.5,
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{ opacity: 0.85, fontSize: 10, background: active ? "rgba(0,0,0,0.18)" : "#e2e8f0", padding: "1px 5px", borderRadius: 999 }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: 11.5, color: textSecondary, fontWeight: 500 }}>
            Showing <b>{filtered.length}</b> listed assets
          </span>
        </div>

        {/* Sector Pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {SECTORS.map((sector) => {
            const active = selectedSector === sector;
            return (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "rgba(16,185,129,0.3)" : borderCol}`,
                  background: active ? "rgba(16,185,129,0.12)" : "#ffffff",
                  color: active ? "#059669" : textSecondary,
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Assets Listing (Grid or Table) */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: bgCard,
            borderRadius: 20,
            padding: "48px 24px",
            textAlign: "center",
            border: `1px solid ${borderCol}`,
          }}
        >
          <Filter size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>
            No stocks matched your search criteria
          </h3>
          <p style={{ margin: "6px 0 16px", fontSize: 13, color: textSecondary }}>
            Try adjusting your search terms or clearing the sector filter.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedSector("All");
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              background: "#10b981",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((stock) => {
            const data = stocks[stock.ticker] || {};
            const curPrice = data.price || 100;
            const chg = dayChange(stock.ticker);
            const isUp = chg >= 0;
            const isWatched = watchlist.includes(stock.ticker);
            const isFlashing = flash && flash[stock.ticker];

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectStock(stock.ticker)}
                style={{
                  background: bgCard,
                  borderRadius: 20,
                  padding: "18px 20px",
                  border: `1px solid ${
                    isFlashing
                      ? isUp
                        ? "rgba(16,185,129,0.8)"
                        : "rgba(239,68,68,0.8)"
                      : borderCol
                  }`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: isFlashing ? "scale(1.01)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderCol;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
                }}
              >
                <div>
                  {/* Top Bar: Icon + Ticker + Watch Star */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${stock.color}14`,
                          color: stock.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: 14,
                        }}
                      >
                        {initials(stock.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                          {stock.ticker}
                        </div>
                        <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 600, maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {stock.name}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatch(stock.ticker);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isWatched ? "#f59e0b" : textSecondary,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <Star size={16} fill={isWatched ? "#f59e0b" : "none"} />
                    </button>
                  </div>

                  {/* Sparkline Visual */}
                  <div style={{ margin: "10px 0", height: 36, display: "flex", alignItems: "center" }}>
                    <Sparkline history={data.history || [curPrice * 0.98, curPrice]} color={isUp ? "#059669" : "#ef4444"} w={230} h={36} />
                  </div>
                </div>

                <div>
                  {/* Price & Change */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6, paddingTop: 10, borderTop: `1px solid ${borderCol}` }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                        $ {fmt(curPrice)}
                      </div>
                      <div style={{ fontSize: 10.5, color: textSecondary, marginTop: 1 }}>{stock.sector || "Equities"}</div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 13,
                        fontWeight: 900,
                        color: isUp ? "#059669" : "#ef4444",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{isUp ? "+" : ""}{(chg * 100).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* 1-Click Buy / Sell Drawer Launch */}
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(stock.ticker);
                        onOpenOrderDesk("BUY");
                      }}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(16,185,129,0.12)",
                        color: "#059669",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Buy
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(stock.ticker);
                        onOpenOrderDesk("SELL");
                      }}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        borderRadius: 8,
                        border: "1px solid rgba(239,68,68,0.2)",
                        background: "rgba(239,68,68,0.06)",
                        color: "#ef4444",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div
          style={{
            background: bgCard,
            borderRadius: 20,
            padding: 20,
            border: `1px solid ${borderCol}`,
            overflowX: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ color: textSecondary, fontSize: 11, borderBottom: `1px solid ${borderCol}`, background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", fontWeight: 800 }}>TICKER</th>
                <th style={{ padding: "10px 12px", fontWeight: 800 }}>NAME</th>
                <th style={{ padding: "10px 12px", fontWeight: 800 }}>SECTOR</th>
                <th style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right" }}>PRICE ($)</th>
                <th style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right" }}>24H CHANGE</th>
                <th style={{ padding: "10px 12px", fontWeight: 800, textAlign: "center" }}>TREND</th>
                <th style={{ padding: "10px 12px", fontWeight: 800, textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock) => {
                const data = stocks[stock.ticker] || {};
                const curPrice = data.price || 100;
                const chg = dayChange(stock.ticker);
                const isUp = chg >= 0;
                const isWatched = watchlist.includes(stock.ticker);

                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => onSelectStock(stock.ticker)}
                    style={{
                      borderBottom: `1px solid ${borderCol}`,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px", fontWeight: 900, color: textPrimary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: `${stock.color}14`,
                            color: stock.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: 11,
                          }}
                        >
                          {initials(stock.name)}
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stock.ticker}</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px", fontWeight: 700, color: textPrimary }}>{stock.name}</td>
                    <td style={{ padding: "12px", color: textSecondary }}>{stock.sector || "Equities"}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(curPrice)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 800,
                        color: isUp ? "#059669" : "#ef4444",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isUp ? "+" : ""}{(chg * 100).toFixed(2)}%
                    </td>

                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <Sparkline history={data.history || [curPrice * 0.98, curPrice]} color={isUp ? "#059669" : "#ef4444"} w={80} h={24} />
                    </td>

                    <td style={{ padding: "12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        <button
                          onClick={() => {
                            onSelectStock(stock.ticker);
                            onOpenOrderDesk("BUY");
                          }}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "rgba(16,185,129,0.12)",
                            color: "#059669",
                            fontWeight: 800,
                            fontSize: 11.5,
                            cursor: "pointer",
                          }}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => onToggleWatch(stock.ticker)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: `1px solid ${borderCol}`,
                            background: "transparent",
                            color: isWatched ? "#f59e0b" : textSecondary,
                            cursor: "pointer",
                          }}
                        >
                          <Star size={12} fill={isWatched ? "#f59e0b" : "none"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
