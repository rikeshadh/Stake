import { useState } from "react";
import { X, Eye, EyeOff, PlusCircle, Send, Wallet, CheckCircle2 } from "lucide-react";
import { fmt, formatMoney } from "../utils";

export function WalletModal({
  isOpen,
  onClose,
  user,
  cashBalance,
  privacyMode,
  setPrivacyMode,
  onDeposit,
  onWithdraw,
  showToast,
  darkMode = false,
  currency = "USD",
}) {
  const [mode, setMode] = useState("deposit");
  const [amtStr, setAmtStr] = useState("10000");
  const [gateway, setGateway] = useState("Direct Bank Wire");

  if (!isOpen) return null;

  const isDeposit = mode === "deposit";

  const handleSubmit = () => {
    const amount = parseFloat(amtStr);
    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount");
      return;
    }
    if (isDeposit) {
      onDeposit(amount, gateway);
      onClose();
    } else {
      if (amount > cashBalance) {
        showToast(`Insufficient balance! Available: ${formatMoney(cashBalance, currency)}`);
        return;
      }
      onWithdraw(amount, gateway);
      onClose();
    }
  };

  const customerName = user?.name || "Demo Trader";
  const customerId = user?.accountNumber || "STK-DEMO-884210";

  const bgModal = darkMode ? "#111827" : "#ffffff";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = darkMode ? "#1a2236" : "#f8fafc";

  // Color theme variables based on selected mode
  const theme = isDeposit
    ? {
        primary: "#10b981",
        gradient: darkMode ? "linear-gradient(135deg, #162036 0%, #1a2542 100%)" : "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
        border: darkMode ? "rgba(16,185,129,0.3)" : "#86efac",
        text: darkMode ? "#10b981" : "#065f46",
        icon: "#10b981",
        badgeBg: darkMode ? "rgba(16,185,129,0.15)" : "#f0fdf4",
        badgeBorder: darkMode ? "rgba(16,185,129,0.3)" : "#bbf7d0",
        btnGradient: "linear-gradient(135deg, #10b981, #006c49)",
        btnShadow: "0 6px 18px rgba(16,185,129,0.35)",
        switchBg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.12)",
        activeSwitchBg: "#10b981",
        activeSwitchText: "#ffffff",
        inactiveSwitchText: textSecondary,
      }
    : {
        primary: "#ef4444",
        gradient: darkMode ? "linear-gradient(135deg, #2d1818 0%, #3d1c1c 100%)" : "linear-gradient(135deg, #fee2e2 0%, #ffe4e6 100%)",
        border: darkMode ? "rgba(239,68,68,0.3)" : "#fca5a5",
        text: darkMode ? "#ef4444" : "#991b1b",
        icon: "#ef4444",
        badgeBg: darkMode ? "rgba(239,68,68,0.15)" : "#fff1f2",
        badgeBorder: darkMode ? "rgba(239,68,68,0.3)" : "#fecaca",
        btnGradient: "linear-gradient(135deg, #ef4444, #b61722)",
        btnShadow: "0 6px 18px rgba(239,68,68,0.35)",
        switchBg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)",
        activeSwitchBg: "#b61722",
        activeSwitchText: "#ffffff",
        inactiveSwitchText: textSecondary,
      };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "rgba(10,14,12,0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 100,
          width: "min(680px, 94vw)",
          borderRadius: 24,
          padding: "24px 28px",
          background: bgModal,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          textAlign: "left",
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "'Hanken Grotesk', sans-serif",
          transition: "border-color 0.25s ease",
        }}
      >
        {/* Top Bar with Title & Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: theme.badgeBg,
                border: `1px solid ${theme.badgeBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <Wallet size={18} color={theme.primary} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: theme.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                STAKE WALLET
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: textPrimary }}>
                {isDeposit ? "Deposit Funds" : "Withdraw Funds to Bank"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${borderCol}`,
              background: inputBg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: textSecondary,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* User Account Details Bar */}
        <div
          style={{
            background: inputBg,
            border: `1px solid ${borderCol}`,
            borderRadius: 14,
            padding: "10px 16px",
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>
              {customerName}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#10b981",
                fontFamily: "'JetBrains Mono', monospace",
                background: darkMode ? "rgba(16,185,129,0.15)" : "#dcfce7",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {customerId}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Bank Connected
          </div>
        </div>

        {/* Current Available Wallet Balance Display */}
        <div
          style={{
            background: theme.gradient,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.25s ease",
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: theme.text, letterSpacing: "0.04em" }}>
              AVAILABLE WALLET BALANCE
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              {privacyMode ? "••••••••" : formatMoney(cashBalance, currency)}
            </div>
          </div>

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: bgModal,
              color: textPrimary,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {privacyMode ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{privacyMode ? "Show" : "Hide"}</span>
          </button>
        </div>

        {/* Deposit / Withdraw Mode Toggle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            background: inputBg,
            padding: 4,
            borderRadius: 14,
            marginBottom: 20,
            border: `1px solid ${borderCol}`,
          }}
        >
          <button
            onClick={() => setMode("deposit")}
            style={{
              padding: "10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 13.5,
              background: isDeposit ? "#006c49" : "transparent",
              color: isDeposit ? "#ffffff" : textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <PlusCircle size={15} /> Deposit Collateral
          </button>

          <button
            onClick={() => setMode("withdraw")}
            style={{
              padding: "10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 13.5,
              background: !isDeposit ? "#b61722" : "transparent",
              color: !isDeposit ? "#ffffff" : textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Send size={15} /> Withdraw to Bank
          </button>
        </div>

        {/* Gateway Selection */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: textSecondary, marginBottom: 8 }}>
            SELECT SETTLEMENT GATEWAY
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { id: "ACH", name: "ACH Bank Transfer", fee: "0% Fee" },
              { id: "Wire", name: "Fedwire / Wire", fee: "$0 Fee" },
              { id: "Card", name: "Debit / Apple Pay", fee: "Instant" },
            ].map((gw) => (
              <div
                key={gw.id}
                onClick={() => setGateway(gw.id)}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${gateway === gw.id ? theme.primary : borderCol}`,
                  background: gateway === gw.id ? (darkMode ? "rgba(16,185,129,0.12)" : "#f8fafc") : inputBg,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: gateway === gw.id ? theme.primary : textPrimary }}>
                  {gw.name}
                </div>
                <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>{gw.fee}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>
              AMOUNT ($)
            </label>
            <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>
              Max per transaction: $ 500,000
            </span>
          </div>

          <input
            type="number"
            value={amtStr}
            onChange={(e) => setAmtStr(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${borderCol}`,
              background: inputBg,
              color: textPrimary,
              fontSize: 18,
              fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace",
              outline: "none",
            }}
          />

          {/* Quick Amount Chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[1000, 5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                onClick={() => setAmtStr(val.toString())}
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
                }}
              >
                +${val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: theme.btnGradient,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: theme.btnShadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isDeposit ? `Confirm Deposit of $ ${fmt(parseFloat(amtStr) || 0)}` : `Initiate Withdrawal of $ ${fmt(parseFloat(amtStr) || 0)}`}
        </button>
      </div>
    </>
  );
}
