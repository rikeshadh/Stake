import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { BigChart } from "./Charts";
import { DashboardOverview } from "./DashboardOverview";
import { fmt, fmtShares, initials, formatMoney } from "../utils";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export function PortfolioTab({
  netWorth,
  cashBalance,
  portfolioHistory,
  holdings,
  orders,
  stocks,
  stockMetaList,
  privacyMode,
  setPrivacyMode = () => {},
  onSelectStock,
  onOpenOrderDesk,
  onOpenWallet,
  darkMode = false,
  currency = "USD",
}) {
  const [tf, setTf] = useState("1D");

  const holdingTickers = Object.keys(holdings).filter((t) => holdings[t]?.shares > 0.0001);
  const totalStockValue = holdingTickers.reduce((acc, t) => {
    const curPrice = stocks[t]?.price || 0;
    return acc + holdings[t].shares * curPrice;
  }, 0);
  const totalCostBasis = holdingTickers.reduce((acc, t) => acc + (holdings[t].costBasis || 0), 0);
  const totalReturn = totalStockValue - totalCostBasis;
  const totalReturnPct = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

  const bgCard = darkMode ? "#111827" : "rgba(255,255,255,0.85)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgItem = darkMode ? "#1a2236" : "#f8fafc";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ paddingTop: 16, textAlign: "left" }}
    >
      {/* Portfolio Overview Banner */}
      <div
        style={{
          borderRadius: 22,
          padding: "24px 28px",
          marginBottom: 24,
          background: darkMode
            ? "linear-gradient(135deg, #111827 0%, #172033 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,253,244,0.7) 100%)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${borderCol}`,
          boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#10b981", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
              TOTAL PORTFOLIO VALUE
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
              {privacyMode ? "••••••••" : formatMoney(netWorth, currency)}
            </div>
            {privacyMode ? (
              <div
                style={{
                  marginTop: 4,
                  color: textSecondary,
                  fontWeight: 500,
                  fontSize: 13.5,
                }}
              >
                <span>•••••••• All-time</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  color: totalReturn >= 0 ? "#10b981" : "#ef4444",
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                {totalReturn >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <span>
                  {totalReturn >= 0 ? "+" : ""}
                  {formatMoney(totalReturn, currency)} ({totalReturn >= 0 ? "+" : ""}{fmt(totalReturnPct)}%) All-time
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onOpenWallet}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10b981, #006c49)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              }}
            >
              <Wallet size={14} /> Wallet
            </button>
          </div>
        </div>

        {/* Portfolio Graph */}
        <div style={{ marginTop: 20 }}>
          <BigChart history={portfolioHistory} color="#10b981" height={220} privacyMode={privacyMode} darkMode={darkMode} currency={currency} />
        </div>

        {/* Timeframes */}
        <div style={{ display: "flex", gap: 6, marginTop: 14, borderTop: `1px solid ${borderCol}`, paddingTop: 12 }}>
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: tf === t ? 600 : 500,
                border: "none",
                cursor: "pointer",
                background: tf === t ? "#006c49" : "transparent",
                color: tf === t ? "#ffffff" : textSecondary,
                transition: "all 0.15s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Allocation Donut Overview */}
      <DashboardOverview
        netWorth={netWorth}
        cashBalance={cashBalance}
        holdings={holdings}
        stocks={stocks}
        stockMetaList={stockMetaList}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        onSelectStock={onSelectStock}
        onOpenWallet={onOpenWallet}
        darkMode={darkMode}
        currency={currency}
      />

      {/* Holdings List */}
      <div
        style={{
          borderRadius: 22,
          padding: 24,
          background: bgCard,
          border: `1px solid ${borderCol}`,
          boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.02)",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.06em", marginBottom: 4 }}>
          EQUITIES INVENTORY
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
          Active Holdings
        </div>

        {holdingTickers.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: textSecondary }}>
            No active positions found. Buy equities from the market to build your Stake portfolio.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {holdingTickers.map((ticker) => {
              const meta = stockMetaList.find((m) => m.ticker === ticker) || { name: ticker, color: "#10b981" };
              const h = holdings[ticker];
              const curPrice = stocks[ticker]?.price || 0;
              const curValue = h.shares * curPrice;
              const gain = curValue - h.costBasis;
              const gainPct = h.costBasis > 0 ? (gain / h.costBasis) * 100 : 0;

              return (
                <div
                  key={ticker}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    background: bgItem,
                    borderRadius: 16,
                    border: `1px solid ${borderCol}`,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div
                    onClick={() => onSelectStock(ticker)}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${meta.color}22`,
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {initials(meta.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{ticker}</div>
                      <div style={{ fontSize: 12, color: textSecondary, fontWeight: 500 }}>
                        {fmtShares(h.shares)} shares • Avg: $ {fmt(h.costBasis / h.shares)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      {privacyMode ? "••••••••" : `$ ${fmt(curValue)}`}
                    </div>
                    {privacyMode ? (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: textSecondary,
                          marginTop: 2,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        ••••••••
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: gain >= 0 ? "#10b981" : "#ef4444",
                          marginTop: 2,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {gain >= 0 ? "+" : ""}$ {fmt(gain)} ({gain >= 0 ? "+" : ""}{fmt(gainPct)}%)
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        onSelectStock(ticker);
                        onOpenOrderDesk("BUY");
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(16,185,129,0.15)",
                        color: "#10b981",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Buy +
                    </button>
                    <button
                      onClick={() => {
                        onSelectStock(ticker);
                        onOpenOrderDesk("SELL");
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${darkMode ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`,
                        background: darkMode ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
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
              );
            })}
          </div>
        )}
      </div>

      {/* Orders History */}
      <div
        style={{
          borderRadius: 22,
          padding: 24,
          background: bgCard,
          border: `1px solid ${borderCol}`,
          boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.02)",
          marginBottom: 30,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", marginBottom: 4 }}>
          EXECUTION LOGS
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: textPrimary, marginBottom: 16 }}>
          Recent Orders & Executions
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: textSecondary }}>
            No recent orders.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.slice(-8).reverse().map((ord, idx) => {
              const isBuy = ord.type === "buy" || ord.side === "BUY";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: bgItem,
                    borderRadius: 12,
                    fontSize: 13,
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isBuy ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: isBuy ? "#10b981" : "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, color: textPrimary }}>{ord.ticker}</span>
                      <span style={{ marginLeft: 6, color: textSecondary, fontSize: 11.5 }}>
                        {isBuy ? "BUY" : "SELL"} • {ord.shares} Qty @ $ {fmt(ord.price)}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: isBuy ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                      {privacyMode ? "••••••••" : `$ ${fmt(ord.total || ord.shares * ord.price)}`}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#10b981", fontWeight: 600 }}>EXECUTED</div>
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
