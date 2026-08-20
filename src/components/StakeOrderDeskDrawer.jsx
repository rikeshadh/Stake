import { useState } from "react";
import { X, TrendingUp, TrendingDown, Layers, AlertTriangle } from "lucide-react";
import { fmt, fmtShares } from "../utils";

export function StakeOrderDeskDrawer({
  isOpen,
  onClose,
  selectedStock = "NVDA",
  initialMode = "BUY",
  stockData = { price: 137.86, open: 136.5 },
  cashBalance = 50000,
  holdingShares = 0,
  onExecuteTrade,
  user,
  darkMode = false,
}) {
  const [mode, setMode] = useState(() => (initialMode ? initialMode.toUpperCase() : "BUY"));
  const [prevModeProp, setPrevModeProp] = useState(initialMode);
  const [validity, setValidity] = useState("DAY");
  const [qty, setQty] = useState("");

  // Adjust state during render when initialMode changes (recommended React pattern)
  if (initialMode !== prevModeProp) {
    setPrevModeProp(initialMode);
    setMode(initialMode ? initialMode.toUpperCase() : "BUY");
  }

  if (!isOpen) return null;

  const isBuy = mode === "BUY";
  const basePrice = stockData?.price || 135;
  const currency = stockData?.currency || "$";
  const effectivePrice = basePrice;

  const parsedQty = parseFloat(qty) || 0;
  const estimatedTotal = parsedQty * effectivePrice;
  const totalWithBrokerage = estimatedTotal * 1.004;

  // Validation Checks
  const isInvalidQty = parsedQty <= 0;
  const isInsufficientCollateral = isBuy && parsedQty > 0 && totalWithBrokerage > cashBalance;
  const isInsufficientHoldings = !isBuy && parsedQty > 0 && parsedQty > holdingShares;
  const maxBuyableShares = effectivePrice > 0 ? Math.floor(cashBalance / (effectivePrice * 1.004)) : 0;

  const top5Buy = [
    { orders: 4, qty: 350, price: Math.round(basePrice * 0.998 * 10) / 10 },
    { orders: 8, qty: 820, price: Math.round(basePrice * 0.995 * 10) / 10 },
    { orders: 2, qty: 150, price: Math.round(basePrice * 0.991 * 10) / 10 },
    { orders: 11, qty: 1450, price: Math.round(basePrice * 0.988 * 10) / 10 },
    { orders: 5, qty: 500, price: Math.round(basePrice * 0.985 * 10) / 10 },
  ];

  const top5Sell = [
    { price: Math.round(basePrice * 1.002 * 10) / 10, qty: 420, orders: 3 },
    { price: Math.round(basePrice * 1.006 * 10) / 10, qty: 680, orders: 7 },
    { price: Math.round(basePrice * 1.01 * 10) / 10, qty: 1100, orders: 9 },
    { price: Math.round(basePrice * 1.014 * 10) / 10, qty: 390, orders: 4 },
    { price: Math.round(basePrice * 1.018 * 10) / 10, qty: 750, orders: 6 },
  ];

  const totalBuyQty = top5Buy.reduce((a, b) => a + b.qty, 0);
  const totalSellQty = top5Sell.reduce((a, b) => a + b.qty, 0);

  const customerName = user?.name || "Demo Trader";
  const customerId = user?.accountNumber || "STK-DEMO-884210";

  const handleTrade = () => {
    if (isInvalidQty) {
      alert("Please enter a valid positive share quantity.");
      return;
    }
    if (isInsufficientCollateral) {
      alert(`Insufficient Collateral. Required: ${currency} ${fmt(totalWithBrokerage)}, Available: ${currency} ${fmt(cashBalance)}`);
      return;
    }
    if (isInsufficientHoldings) {
      alert(`Insufficient shares in portfolio. Available: ${fmtShares(holdingShares)} units.`);
      return;
    }

    if (onExecuteTrade) {
      onExecuteTrade({
        ticker: selectedStock || "NVDA",
        side: mode ? mode.toUpperCase() : "BUY",
        shares: parsedQty,
        price: effectivePrice,
        total: estimatedTotal,
        orderType: "MKT",
        validity,
      });
      if (onClose) onClose();
    }
  };

  const handleReset = () => {
    setQty("");
    setValidity("DAY");
  };

  const panelBg = darkMode ? "#111827" : "#ffffff";
  const headerBg = darkMode ? "#162036" : "#f8fafc";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = darkMode ? "#1a2236" : "#f8fafc";
  const cardBg = darkMode ? "#162036" : "#f8fafc";

  return (
    <>
      {/* Dim Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 99,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Slide-out Desk Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          width: "min(520px, 100vw)",
          background: panelBg,
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Hanken Grotesk', sans-serif",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${borderCol}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: headerBg,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.08em" }}>
              STAKE TRADING DESK
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{selectedStock}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                {currency} {fmt(basePrice)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: `1px solid ${borderCol}`,
              background: darkMode ? "#1a2520" : "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: textSecondary,
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* User Account Verification Strip */}
        <div
          style={{
            background: cardBg,
            padding: "10px 24px",
            borderBottom: `1px solid ${borderCol}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, color: textPrimary }}>{customerName}</span>
            <span style={{ color: "#10b981", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              ({customerId})
            </span>
          </div>
          <div style={{ color: textSecondary, fontWeight: 600 }}>
            {isBuy ? (
              <span>Collateral: <strong style={{ color: textPrimary }}>{currency} {fmt(cashBalance)}</strong></span>
            ) : (
              <span>Holding: <strong style={{ color: textPrimary }}>{fmtShares(holdingShares)} Shares</strong></span>
            )}
          </div>
        </div>

        {/* Order Configuration Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {/* BUY / SELL Switch */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              background: inputBg,
              padding: 4,
              borderRadius: 14,
              border: `1px solid ${borderCol}`,
            }}
          >
            <button
              onClick={() => setMode("BUY")}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 14,
                background: isBuy ? "#006c49" : "transparent",
                color: isBuy ? "#ffffff" : textSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <TrendingUp size={16} /> Buy
            </button>

            <button
              onClick={() => setMode("SELL")}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 14,
                background: !isBuy ? "#b61722" : "transparent",
                color: !isBuy ? "#ffffff" : textSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <TrendingDown size={16} /> Sell
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>
                QUANTITY (SHARES)
              </label>
              {isBuy ? (
                <button
                  onClick={() => setQty(maxBuyableShares)}
                  style={{ background: "none", border: "none", color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Max Buy ({maxBuyableShares} Qty)
                </button>
              ) : (
                <button
                  onClick={() => setQty(holdingShares)}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Sell All ({fmtShares(holdingShares)} Qty)
                </button>
              )}
            </div>

            <input
              type="number"
              min="1"
              placeholder="Enter quantity..."
              value={qty}
              onChange={(e) => setQty(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${isInsufficientCollateral || isInsufficientHoldings || (qty !== "" && isInvalidQty) ? "#ef4444" : borderCol}`,
                background: inputBg,
                color: textPrimary,
                fontSize: 16,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Inline Validation Banner */}
          {qty !== "" && isInvalidQty && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
              <AlertTriangle size={14} /> Please enter a valid share quantity greater than 0.
            </div>
          )}

          {isInsufficientCollateral && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
              <AlertTriangle size={14} /> Insufficient cash collateral. Maximum you can purchase is {maxBuyableShares} shares.
            </div>
          )}

          {isInsufficientHoldings && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
              <AlertTriangle size={14} /> Exceeds portfolio holdings. You only hold {fmtShares(holdingShares)} shares of {selectedStock}.
            </div>
          )}

          {/* Quick Quantity Presets */}
          <div style={{ display: "flex", gap: 6 }}>
            {[10, 25, 50, 100, 500].map((presetQty) => (
              <button
                key={presetQty}
                onClick={() => setQty((prev) => (parseFloat(prev) || 0) + presetQty)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 8,
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  color: textPrimary,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.15s ease",
                }}
              >
                +{presetQty}
              </button>
            ))}
          </div>

          {/* Order Summary Confirmation Card */}
          <div
            style={{
              background: isBuy ? (darkMode ? "rgba(0,108,73,0.15)" : "#f0fdf4") : (darkMode ? "rgba(182,23,34,0.15)" : "#fef2f2"),
              border: `1px solid ${isBuy ? (darkMode ? "rgba(0,108,73,0.3)" : "#bbf7d0") : (darkMode ? "rgba(182,23,34,0.3)" : "#fecaca")}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: textSecondary, fontWeight: 700 }}>Market Price</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {currency} {fmt(effectivePrice)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: textSecondary, fontWeight: 700 }}>Exchange & SEC Regulatory Fee (0.4%)</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                {currency} {fmt(estimatedTotal * 0.004)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px dashed ${borderCol}`, paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: textPrimary }}>Total Estimated Value</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: isBuy ? "#10b981" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                {currency} {fmt(totalWithBrokerage)}
              </span>
            </div>
          </div>

          {/* Submit Action Button */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleReset}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: `1px solid ${borderCol}`,
                background: inputBg,
                color: textSecondary,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              onClick={handleTrade}
              disabled={isInvalidQty || isInsufficientCollateral || isInsufficientHoldings}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                fontWeight: 900,
                cursor: (isInvalidQty || isInsufficientCollateral || isInsufficientHoldings) ? "not-allowed" : "pointer",
                background: (isInvalidQty || isInsufficientCollateral || isInsufficientHoldings)
                  ? (darkMode ? "#2a3530" : "#94a3b8")
                  : (isBuy ? "#006c49" : "#b61722"),
                color: "#ffffff",
                boxShadow: (isInvalidQty || isInsufficientCollateral || isInsufficientHoldings) ? "none" : (isBuy ? "0 6px 20px rgba(0,108,73,0.35)" : "0 6px 20px rgba(182,23,34,0.35)"),
                transition: "all 0.15s ease",
              }}
            >
              {isBuy ? (parsedQty > 0 ? `Buy ${parsedQty} ${selectedStock}` : "Buy") : (parsedQty > 0 ? `Sell ${parsedQty} ${selectedStock}` : "Sell")}
            </button>
          </div>

          {/* Level 2 Live Market Depth (Clickable Rows) */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={14} color="#10b981" /> Level 2 Order Depth Matrix
            </div>

            {isBuy ? (
              <div style={{ background: darkMode ? "#16231c" : "#f0fdf4", border: `1px solid ${darkMode ? "#1b3a2a" : "#bbf7d0"}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#10b981" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers size={14} color="#10b981" /> TOP 5 BUY DEPTH (BID)
                  </span>
                  <span style={{ fontSize: 10, background: darkMode ? "#1b3a2a" : "#dcfce7", color: "#10b981", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
                    CLICK ROW TO FILL
                  </span>
                </div>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderCol}`, color: textSecondary, textAlign: "left" }}>
                      <th style={{ paddingBottom: 6 }}>Orders</th>
                      <th style={{ paddingBottom: 6 }}>Buyer Qty</th>
                      <th style={{ paddingBottom: 6, textAlign: "right" }}>Bid Price ({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Buy.map((b, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setQty(b.qty);
                        }}
                        style={{ borderBottom: `1px solid ${borderCol}`, cursor: "pointer" }}
                      >
                        <td style={{ padding: "6px 0", color: textSecondary }}>{b.orders}</td>
                        <td style={{ padding: "6px 0", fontWeight: 800, color: textPrimary }}>{b.qty}</td>
                        <td style={{ padding: "6px 0", textAlign: "right", color: "#10b981", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
                          {currency} {fmt(b.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", marginTop: 8, borderTop: `1px solid ${borderCol}`, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>Total Bid Volume</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totalBuyQty.toLocaleString()} units</span>
                </div>
              </div>
            ) : (
              <div style={{ background: darkMode ? "#26171a" : "#fef2f2", border: `1px solid ${darkMode ? "#3f1b22" : "#fecaca"}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#ef4444" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers size={14} color="#ef4444" /> TOP 5 SELL DEPTH (ASK)
                  </span>
                  <span style={{ fontSize: 10, background: darkMode ? "#3f1b22" : "#fee2e2", color: "#ef4444", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
                    CLICK ROW TO FILL
                  </span>
                </div>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderCol}`, color: textSecondary, textAlign: "left" }}>
                      <th style={{ paddingBottom: 6 }}>Ask Price ({currency})</th>
                      <th style={{ paddingBottom: 6 }}>Seller Qty</th>
                      <th style={{ paddingBottom: 6, textAlign: "right" }}>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Sell.map((s, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setQty(s.qty);
                        }}
                        style={{ borderBottom: `1px solid ${borderCol}`, cursor: "pointer" }}
                      >
                        <td style={{ padding: "6px 0", color: "#ef4444", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
                          {currency} {fmt(s.price)}
                        </td>
                        <td style={{ padding: "6px 0", fontWeight: 800, color: textPrimary }}>{s.qty}</td>
                        <td style={{ padding: "6px 0", textAlign: "right", color: textSecondary }}>{s.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginTop: 8, borderTop: `1px solid ${borderCol}`, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>Total Ask Volume</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totalSellQty.toLocaleString()} units</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
