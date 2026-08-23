import { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Flame,
  Eye,
  EyeOff,
  ShieldCheck,
  PieChart as PieIcon,
  Star,
  ChevronRight,
  Zap,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  Bot,
} from "lucide-react";
import { Sparkline } from "./Charts";
import { TooltipBadge } from "./TooltipBadge";
import { fmt, fmtShares, initials, formatMoney } from "../utils";

export function HomeDashboard({
  stocks,
  stockMetaList,
  netWorth,
  cashBalance,
  holdings,
  privacyMode,
  setPrivacyMode,
  watchlist = [],
  onToggleWatch,
  onSelectStock,
  onOpenOrderDesk,
  onOpenWallet,
  onNavigateTab,
  onOpenKyc,
  kycStatus = "VERIFIED",
  currency = "USD",
  dayChange = () => 0,
}) {
  const [moversTab, setMoversTab] = useState("gainers"); // "gainers" | "losers" | "turnover"
  const [showGuide, setShowGuide] = useState(true);

  // Calculate holdings metrics
  const holdingTickers = Object.keys(holdings).filter((t) => holdings[t]?.shares > 0.0001);
  const isNewAccount = holdingTickers.length === 0 && (cashBalance === 0 || cashBalance < 100);
  const totalStockValue = holdingTickers.reduce((acc, t) => {
    const curPrice = stocks[t]?.price || 0;
    return acc + holdings[t].shares * curPrice;
  }, 0);

  const totalCostBasis = holdingTickers.reduce((acc, t) => {
    return acc + (holdings[t].costBasis || 0);
  }, 0);

  const totalReturn = totalStockValue - totalCostBasis;
  const totalReturnPct = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

  // Compute Movers Lists
  const allMovers = [...stockMetaList].map((meta) => {
    const curPrice = stocks[meta.ticker]?.price || 100;
    const openPrice = stocks[meta.ticker]?.open || (curPrice * 0.98);
    const pointChange = curPrice - openPrice;
    const pctChange = openPrice > 0 ? (pointChange / openPrice) * 100 : 0;
    const turnover = curPrice * ((meta.ticker.charCodeAt(0) * 18420) + (curPrice * 450));
    const volume = (meta.ticker.charCodeAt(0) * 18420) + (curPrice * 450);

    return {
      ...meta,
      curPrice,
      openPrice,
      pointChange,
      pctChange,
      turnover,
      volume,
    };
  });

  const topGainers = [...allMovers].sort((a, b) => b.pctChange - a.pctChange).slice(0, 7);
  const topLosers = [...allMovers].sort((a, b) => a.pctChange - b.pctChange).slice(0, 7);
  const topTurnover = [...allMovers].sort((a, b) => b.turnover - a.turnover).slice(0, 7);

  const currentMoversList =
    moversTab === "gainers" ? topGainers : moversTab === "losers" ? topLosers : topTurnover;

  // Light Theme Palette
  const bgCard = "#ffffff";
  const borderCol = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const bgRow = "#f8fafc";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ paddingTop: 16, textAlign: "left" }}
    >
      {/* 0. NEW ACCOUNT ONBOARDING & TOOLTIP STEPPER (Clean, Dismissible) */}
      {showGuide && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
            borderRadius: 20,
            padding: "20px 24px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 4px 18px rgba(16, 185, 129, 0.06)",
            marginBottom: 24,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, margin: 0 }}>
                    {isNewAccount ? "New Account Setup & Quick-Start Guide" : "Stake Trading Tips & System Overview"}
                  </h3>
                  <TooltipBadge
                    title="Account Guidance"
                    text="Hover or tap on any (?) tooltip across Stake to learn about financial metrics, fractional execution, and automated AI trading."
                  />
                </div>
                <p style={{ fontSize: 12.5, color: textSecondary, margin: "2px 0 0" }}>
                  Follow these 4 essential steps to start investing in US fractional equities.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              style={{
                background: "transparent",
                border: "none",
                color: textSecondary,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
              }}
              title="Dismiss Guide"
            >
              Dismiss
            </button>
          </div>

          {/* 4 Interactive Step Cards with Tooltips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 12,
            }}
          >
            {/* Step 1: Identity & KYC */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>STEP 1</span>
                  <TooltipBadge
                    title="Identity & Compliance"
                    text="SEC & FINRA compliant verification. Takes under 2 minutes and unlocks bank linking, wire deposits, and instantaneous trade clearing."
                  />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, marginTop: 3 }}>
                  Verify Identity
                </div>
                <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 2 }}>
                  {kycStatus === "VERIFIED" ? "✓ KYC Verified & Compliant" : "Complete KYC to unlock trading"}
                </div>
              </div>
              <button
                onClick={onOpenKyc}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${kycStatus === "VERIFIED" ? "rgba(16,185,129,0.3)" : "#10b981"}`,
                  background: kycStatus === "VERIFIED" ? "#f0fdf4" : "#10b981",
                  color: kycStatus === "VERIFIED" ? "#059669" : "#ffffff",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {kycStatus === "VERIFIED" ? "KYC Completed" : "Start KYC"}
              </button>
            </div>

            {/* Step 2: Deposit Funds */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>STEP 2</span>
                  <TooltipBadge
                    title="Wallet & Purchasing Power"
                    text="Deposit cash instantly via zero-fee ACH bank transfer, Debit Card, or Wire. Demo mode includes $50,000 in paper trading capital."
                  />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, marginTop: 3 }}>
                  Fund Wallet
                </div>
                <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 2 }}>
                  Balance: {privacyMode ? "••••" : formatMoney(cashBalance, currency)}
                </div>
              </div>
              <button
                onClick={onOpenWallet}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: textPrimary,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Deposit Funds
              </button>
            </div>

            {/* Step 3: Discover & Buy Stocks */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>STEP 3</span>
                  <TooltipBadge
                    title="Fractional Share Orders"
                    text="Trade 9,500+ US stocks and ETFs starting from $1.00 or 0.0001 shares with zero commission and real-time Level 2 order book execution."
                  />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, marginTop: 3 }}>
                  Buy Equities
                </div>
                <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 2 }}>
                  {holdingTickers.length > 0 ? `${holdingTickers.length} active positions` : "Explore 30+ US stocks"}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("market")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: textPrimary,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Browse Markets
              </button>
            </div>

            {/* Step 4: AI Quant Agent */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>STEP 4</span>
                  <TooltipBadge
                    title="Autonomous Algorithmic Agent"
                    text="Activate autonomous quantitative strategies powered by RSI, MACD, and Gemini news sentiment analysis to automatically trade 24/7."
                  />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, marginTop: 3 }}>
                  Automate with AI
                </div>
                <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 2 }}>
                  Algorithmic trading engine
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("agent")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: textPrimary,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Configure Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP SECTION: PORTFOLIO HERO & LIVE MARKET SUMMARY WIDGET */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* User Portfolio Card */}
        <div
          style={{
            background: bgCard,
            borderRadius: 22,
            padding: "24px",
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>
                  PORTFOLIO OVERVIEW
                </span>
                <TooltipBadge
                  title="Net Consolidated Wealth"
                  text="Total combined valuation of all settled wallet cash plus current market equity values."
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: privacyMode ? "#059669" : textSecondary,
                    cursor: "pointer",
                  }}
                  title={privacyMode ? "Show Balances" : "Hide Balances (Privacy Mode)"}
                >
                  {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <div
                  onClick={onOpenKyc}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: kycStatus === "VERIFIED" ? "#059669" : "#d97706",
                    fontWeight: 600,
                    background: kycStatus === "VERIFIED" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    padding: "3px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${kycStatus === "VERIFIED" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>{kycStatus === "VERIFIED" ? "Verified" : "Verify KYC"}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 30, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
              {privacyMode ? "••••••••" : formatMoney(netWorth, currency)}
            </div>

            {privacyMode ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  color: textSecondary,
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                <span>•••••••• Total Return</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  color: totalReturn >= 0 ? "#059669" : "#ef4444",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {totalReturn >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>
                  {totalReturn >= 0 ? "+" : ""}{formatMoney(totalReturn, currency)} ({totalReturn >= 0 ? "+" : ""}{fmt(totalReturnPct)}%) Total Return
                </span>
                <TooltipBadge
                  title="Total Unrealized P&L"
                  text="Profit or loss relative to total purchase cost basis of current stock holdings."
                />
              </div>
            )}
          </div>

          {/* Sub-Metrics & Wallet Portal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 20,
              paddingTop: 16,
              borderTop: `1px solid ${borderCol}`,
            }}
          >
            <div style={{ background: bgRow, padding: "10px 14px", borderRadius: 12, border: `1px solid ${borderCol}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>AVAILABLE WALLET</span>
                <TooltipBadge
                  title="Purchasing Power"
                  text="Unencumbered settled cash ready for immediate stock purchases."
                />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                {privacyMode ? "••••••••" : formatMoney(cashBalance, currency)}
              </div>
            </div>

            <div style={{ background: bgRow, padding: "10px 14px", borderRadius: 12, border: `1px solid ${borderCol}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>EQUITIES HOLDINGS</span>
                <TooltipBadge
                  title="Equities Valuation"
                  text="Aggregate mark-to-market valuation of active stock positions."
                />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                {privacyMode ? "••••••••" : formatMoney(totalStockValue, currency)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              onClick={onOpenWallet}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                border: "none",
                background: "#10b981",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 12.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Wallet size={14} />
              <span>Wallet</span>
            </button>
            <button
              onClick={() => onNavigateTab("portfolio")}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                border: `1px solid ${borderCol}`,
                background: "#ffffff",
                color: textPrimary,
                fontWeight: 600,
                fontSize: 12.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <PieIcon size={14} color="#059669" />
              <span>View Portfolio</span>
            </button>
          </div>
        </div>

        {/* Global Market Overview / Index Snapshot Card */}
        <div
          style={{
            background: bgCard,
            borderRadius: 22,
            padding: "24px",
            border: `1px solid ${borderCol}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>
                  BENCHMARK INDICES
                </span>
                <TooltipBadge
                  title="Market Benchmarks"
                  text="Key index and mega-cap benchmarks updated with live real-time pricing."
                />
              </div>
              <span style={{ fontSize: 11, color: textSecondary, fontWeight: 500 }}>LIVE STREAMING</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { name: "S&P 500 ETF", sym: "SPY", price: stocks["SPY"]?.price || 564.80, chg: "+0.84%" },
                { name: "NASDAQ 100", sym: "QQQ", price: stocks["QQQ"]?.price || 488.20, chg: "+1.22%" },
                { name: "NVIDIA Corp", sym: "NVDA", price: stocks["NVDA"]?.price || 137.86, chg: "+2.84%" },
                { name: "Apple Inc", sym: "AAPL", price: stocks["AAPL"]?.price || 228.45, chg: "+1.42%" },
              ].map((idxItem) => (
                <div
                  key={idxItem.sym}
                  onClick={() => onSelectStock(idxItem.sym)}
                  style={{
                    background: bgRow,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderCol)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      {idxItem.sym}
                    </span>
                    <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>{idxItem.chg}</span>
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>{idxItem.name}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    $ {fmt(idxItem.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: `1px solid ${borderCol}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: textSecondary }}>Explore full 30+ equities universe</span>
            <button
              onClick={() => onNavigateTab("market")}
              style={{
                background: "transparent",
                border: "none",
                color: "#059669",
                fontWeight: 600,
                fontSize: 12.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Markets Explorer</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MARKET MOVERS TABLE SECTION (Top Gainers, Losers, Turnover) */}
      <div
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: 22,
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={18} color="#059669" />
              <h2 style={{ fontSize: 18, fontWeight: 900, color: textPrimary, margin: 0 }}>
                Market Movers
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: textSecondary, margin: "2px 0 0" }}>
              High-volatility equities, highest percentage shifts, and volume leaders
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div
            style={{
              display: "flex",
              background: "#f1f5f9",
              padding: 4,
              borderRadius: 12,
              border: `1px solid ${borderCol}`,
              gap: 4,
            }}
          >
            {[
              { id: "gainers", label: "Top Gainers" },
              { id: "losers", label: "Top Losers" },
              { id: "turnover", label: "Top Turnover" },
            ].map((t) => {
              const active = moversTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMoversTab(t.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#059669" : textSecondary,
                    boxShadow: active ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Movers Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ color: textSecondary, fontSize: 11, borderBottom: `1px solid ${borderCol}`, background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", fontWeight: 800 }}>SYMBOL</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>COMPANY</th>
                <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "right" }}>LTP ($)</th>
                <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "right" }}>POINT CHG</th>
                <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "right" }}>% CHANGE</th>
                <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "right" }}>PREV. CLOSE</th>
                {moversTab === "turnover" && (
                  <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "right" }}>TURNOVER ($)</th>
                )}
                <th style={{ padding: "10px 12px", fontWeight: 500, textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentMoversList.map((item) => {
                const isPositive = item.pointChange >= 0;
                const isWatched = watchlist.includes(item.ticker);

                return (
                  <tr
                    key={item.ticker}
                    style={{
                      borderBottom: `1px solid ${borderCol}`,
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => onSelectStock(item.ticker)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px", fontWeight: 800, color: textPrimary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: `${item.color}18`,
                            color: item.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 11,
                          }}
                        >
                          {initials(item.name)}
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{item.ticker}</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px", fontWeight: 500, color: textPrimary }}>{item.name}</td>

                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(item.curPrice)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 500,
                        color: isPositive ? "#059669" : "#ef4444",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isPositive ? "+" : ""}{fmt(item.pointChange)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 500,
                        color: isPositive ? "#059669" : "#ef4444",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 500,
                          background: isPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        }}
                      >
                        {isPositive ? "+" : ""}{item.pctChange.toFixed(2)}%
                      </span>
                    </td>

                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 400, color: textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(item.openPrice)}
                    </td>

                    {moversTab === "turnover" && (
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 500, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                        $ {fmt(item.turnover)}
                      </td>
                    )}

                    <td style={{ padding: "12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        <button
                          onClick={() => {
                            onSelectStock(item.ticker);
                            onOpenOrderDesk("BUY");
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "none",
                            background: "rgba(16,185,129,0.12)",
                            color: "#059669",
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => onToggleWatch(item.ticker)}
                          style={{
                            padding: "4px 8px",
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
      </div>

      {/* 3. ACTIVE HOLDINGS BREAKDOWN */}
      <div
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: 22,
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
              Active Holdings
            </h2>
            <p style={{ fontSize: 12.5, color: textSecondary, margin: "2px 0 0" }}>
              Your fractional equities allocation and live market valuation
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("portfolio")}
            style={{
              background: "#f1f5f9",
              border: `1px solid ${borderCol}`,
              padding: "6px 14px",
              borderRadius: 10,
              color: textPrimary,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Manage All ({holdingTickers.length})
          </button>
        </div>

        {holdingTickers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: textSecondary }}>
            <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>You do not have any active stock holdings yet.</p>
            <button
              onClick={() => onNavigateTab("market")}
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
              Explore Stocks to Buy
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {holdingTickers.map((ticker) => {
              const meta = stockMetaList.find((m) => m.ticker === ticker) || { ticker, name: ticker, color: "#10b981" };
              const h = holdings[ticker];
              const curPrice = stocks[ticker]?.price || 100;
              const val = h.shares * curPrice;
              const pl = val - h.costBasis;
              const plPct = h.costBasis > 0 ? (pl / h.costBasis) * 100 : 0;
              const isUp = pl >= 0;

              return (
                <div
                  key={ticker}
                  onClick={() => onSelectStock(ticker)}
                  style={{
                    background: bgRow,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 16,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderCol)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${meta.color}18`,
                          color: meta.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: 13,
                        }}
                      >
                        {initials(meta.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                          {ticker}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {meta.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {privacyMode ? "••••••••" : `$ ${fmt(val)}`}
                      </div>
                      <div style={{ fontSize: 11, color: textSecondary }}>
                        {fmtShares(h.shares)} units
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${borderCol}` }}>
                    <span style={{ fontSize: 11, color: textSecondary }}>Avg: $ {fmt(h.costBasis / h.shares)}</span>
                    {privacyMode ? (
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                        ••••••••
                      </span>
                    ) : (
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: isUp ? "#059669" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                        {isUp ? "+" : ""}$ {fmt(pl)} ({isUp ? "+" : ""}{fmt(plPct)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MY WATCHLIST SECTION */}
      <div
        style={{
          background: bgCard,
          borderRadius: 22,
          padding: 22,
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={16} fill="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                My Watchlist
              </h2>
              <p style={{ fontSize: 12, color: textSecondary, margin: "2px 0 0" }}>
                Monitored equities, real-time quotes, and fast execution
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("market")}
            style={{
              background: "#f1f5f9",
              border: `1px solid ${borderCol}`,
              padding: "6px 14px",
              borderRadius: 10,
              color: textPrimary,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add More Stocks
          </button>
        </div>

        {watchlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 16px", background: bgRow, borderRadius: 16, border: `1px dashed ${borderCol}` }}>
            <Star size={30} color={textSecondary} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>Your watchlist is empty</div>
            <p style={{ fontSize: 12.5, color: textSecondary, margin: "4px 0 12px" }}>
              Star equities in the Markets tab to track them here on your Home dashboard.
            </p>
            <button
              onClick={() => onNavigateTab("market")}
              style={{
                padding: "7px 16px",
                borderRadius: 10,
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Discover Stocks
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {watchlist.map((ticker) => {
              const meta = stockMetaList.find((m) => m.ticker === ticker) || { ticker, name: ticker, color: "#10b981" };
              const st = stocks[ticker] || { price: meta.price || 100, history: [100, 100] };
              const chg = dayChange(ticker);
              const up = chg >= 0;

              return (
                <div
                  key={ticker}
                  style={{
                    background: bgRow,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderCol)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div
                      onClick={() => onSelectStock(ticker)}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${meta.color}18`,
                          color: meta.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: 13,
                        }}
                      >
                        {initials(meta.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                          {ticker}
                        </div>
                        <div style={{ fontSize: 11.5, color: textSecondary, maxWidth: 130, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {meta.name}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleWatch(ticker)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                      title="Remove from watchlist"
                    >
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    </button>
                  </div>

                  <div
                    onClick={() => onSelectStock(ticker)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                        $ {fmt(st.price)}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                          fontSize: 12,
                          fontWeight: 800,
                          color: up ? "#059669" : "#ef4444",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {up ? "+" : ""}{fmt(chg * 100)}%
                      </div>
                    </div>

                    <div style={{ width: 84, height: 28 }}>
                      <Sparkline history={st.history} color={up ? "#059669" : "#ef4444"} w={84} h={28} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${borderCol}`, paddingTop: 10 }}>
                    <button
                      onClick={() => {
                        onSelectStock(ticker);
                        onOpenOrderDesk("BUY");
                      }}
                      style={{
                        padding: "7px",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(16,185,129,0.12)",
                        color: "#059669",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Zap size={12} /> Buy
                    </button>
                    <button
                      onClick={() => {
                        onSelectStock(ticker);
                        onOpenOrderDesk("SELL");
                      }}
                      style={{
                        padding: "7px",
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: "#ffffff",
                        color: textPrimary,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}