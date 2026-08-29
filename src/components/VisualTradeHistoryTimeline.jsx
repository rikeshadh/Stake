import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  User,
  CheckCircle2,
  Filter,
  Calendar,
} from "lucide-react";
import { fmt } from "../utils";

export function VisualTradeHistoryTimeline({
  orders = [],
  ticker,
  currentPrice = 150,
  onOpenOrderDesk,
  darkMode = false,
}) {
  const [filterType, setFilterType] = useState("ALL"); // ALL, BUY, SELL, AGENT

  const bgCard = darkMode ? "#111827" : "rgba(255,255,255,0.92)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgItem = darkMode ? "#1a2236" : "#f8fafc";

  // Filter orders for this specific ticker if ticker is provided
  const tickerOrders = orders.filter((o) => {
    const sym = (o.ticker || o.scrip || o.symbol || "").toUpperCase();
    return !ticker || sym === ticker.toUpperCase();
  });

  // Apply sub-filters
  const filteredOrders = tickerOrders.filter((o) => {
    const side = (o.side || o.type || "BUY").toUpperCase();
    const isAgent = Boolean(o.isAgent || o.reason?.toLowerCase().includes("agent") || o.reason?.toLowerCase().includes("ai"));
    if (filterType === "BUY") return side === "BUY";
    if (filterType === "SELL") return side === "SELL";
    if (filterType === "AGENT") return isAgent;
    return true;
  });

  const totalBuyCount = tickerOrders.filter((o) => (o.side || o.type || "").toUpperCase() === "BUY").length;
  const totalSellCount = tickerOrders.filter((o) => (o.side || o.type || "").toUpperCase() === "SELL").length;
  const totalAgentCount = tickerOrders.filter(
    (o) => Boolean(o.isAgent || o.reason?.toLowerCase().includes("agent") || o.reason?.toLowerCase().includes("ai"))
  ).length;

  const formatOrderTime = (timestamp) => {
    if (!timestamp) return "Recently";
    const dt = new Date(timestamp);
    if (isNaN(dt.getTime())) return "Recently";
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      id="visual-trade-history-timeline"
      style={{
        background: bgCard,
        border: `1px solid ${borderCol}`,
        borderRadius: 22,
        padding: "24px 28px",
        boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.25)" : "0 10px 30px rgba(0,0,0,0.03)",
        backdropFilter: "blur(20px)",
        marginTop: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${borderCol}`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                color: "#00E599",
                letterSpacing: "0.06em",
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(0,229,153,0.12)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              EXECUTION LEDGER
            </span>
            <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>
              {tickerOrders.length} Executed Order{tickerOrders.length === 1 ? "" : "s"}
            </span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
            Visual Trade History Timeline
          </h3>
          <p style={{ fontSize: 13, color: textSecondary, margin: "3px 0 0" }}>
            Complete audit trail of BUY and SELL executions on {ticker || "assets"} by you and the autonomous Stake AI agent.
          </p>
        </div>

        {/* Action button if empty */}
        {onOpenOrderDesk && (
          <button
            id="timeline-place-order-btn"
            type="button"
            onClick={() => onOpenOrderDesk("BUY")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #00E599 0%, #059669 100%)",
              color: "#06110c",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,229,153,0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            <TrendingUp size={15} /> Execute Trade
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: textSecondary, marginRight: 6 }}>
          <Filter size={13} /> Filter:
        </div>

        {[
          { id: "ALL", label: `All (${tickerOrders.length})` },
          { id: "BUY", label: `Buys (${totalBuyCount})` },
          { id: "SELL", label: `Sells (${totalSellCount})` },
          { id: "AGENT", label: `AI Agent (${totalAgentCount})` },
        ].map((f) => {
          const isActive = filterType === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${isActive ? "#00E599" : borderCol}`,
                background: isActive ? "rgba(0,229,153,0.12)" : bgItem,
                color: isActive ? (darkMode ? "#00E599" : "#059669") : textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Timeline Content */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px 20px",
            background: bgItem,
            borderRadius: 16,
            border: `1px dashed ${borderCol}`,
          }}
        >
          <Calendar size={32} color={textSecondary} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
          <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>
            No Trade Executions Found
          </div>
          <p style={{ fontSize: 13, color: textSecondary, maxWidth: 380, margin: "0 auto 14px" }}>
            {ticker
              ? `No ${filterType !== "ALL" ? filterType.toLowerCase() + " " : ""}orders have been executed for ${ticker} yet. Trades placed manually or via Stake AI will display here with chart markers.`
              : "No orders found in your transaction history."}
          </p>
          {onOpenOrderDesk && (
            <button
              type="button"
              onClick={() => onOpenOrderDesk("BUY")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: "#00E599",
                color: "#06110c",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Place Your First Order
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 20 }}>
          {/* Vertical connecting line */}
          <div
            style={{
              position: "absolute",
              left: 19,
              top: 14,
              bottom: 24,
              width: 2,
              background: darkMode
                ? "linear-gradient(to bottom, #00E599 0%, rgba(255,255,255,0.1) 100%)"
                : "linear-gradient(to bottom, #00E599 0%, rgba(0,0,0,0.08) 100%)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredOrders.map((order, idx) => {
              const side = (order.side || order.type || "BUY").toUpperCase();
              const isBuy = side === "BUY";
              const isAgent = Boolean(
                order.isAgent ||
                order.reason?.toLowerCase().includes("agent") ||
                order.reason?.toLowerCase().includes("ai")
              );
              const execPrice = Number(order.price || order.executionPrice || currentPrice);
              const shares = Number(order.shares || order.quantity || 1);
              const totalVal = Number(order.total || (shares * execPrice));
              const orderId = order.id || order.orderId || `ORD-${idx + 101}`;
              const orderTime = formatOrderTime(order.timestamp || order.time || order.date);

              return (
                <div
                  key={orderId + "-" + idx}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  {/* Timeline Node Icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: isBuy
                        ? "linear-gradient(135deg, #00E599 0%, #059669 100%)"
                        : "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
                      color: isBuy ? "#06110c" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: isBuy
                        ? "0 0 14px rgba(0,229,153,0.4)"
                        : "0 0 14px rgba(239,68,68,0.4)",
                      border: `3px solid ${darkMode ? "#111827" : "#ffffff"}`,
                      zIndex: 2,
                    }}
                  >
                    {isBuy ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>

                  {/* Order Card */}
                  <div
                    style={{
                      flex: 1,
                      background: bgItem,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 16,
                      padding: "16px 18px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: isBuy ? "rgba(0,229,153,0.15)" : "rgba(239,68,68,0.15)",
                            color: isBuy ? (darkMode ? "#00E599" : "#059669") : "#ef4444",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {side} • {shares.toFixed(shares % 1 === 0 ? 0 : 4)} SHARES
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: 6,
                            background: isAgent ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)",
                            color: isAgent ? "#a855f7" : "#3b82f6",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {isAgent ? <Sparkles size={11} /> : <User size={11} />}
                          {isAgent ? "Stake AI Agent" : "Manual Trader"}
                        </span>

                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "#10b981",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <CheckCircle2 size={12} /> FILLED
                        </span>
                      </div>

                      <div style={{ fontSize: 11.5, color: textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {orderTime}
                      </div>
                    </div>

                    {/* Trade Pricing Details */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)",
                        border: `1px solid ${borderCol}`,
                        marginBottom: order.reason ? 8 : 0,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>
                          Execution Price
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                          ${fmt(execPrice)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>
                          Order Total
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: isBuy ? "#00E599" : textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                          ${fmt(totalVal)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>
                          Order Reference
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                          {orderId}
                        </div>
                      </div>
                    </div>

                    {/* Order Reason Note if present */}
                    {order.reason && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: textSecondary,
                          fontStyle: "italic",
                          marginTop: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>Note:</span>
                        <span>{order.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
