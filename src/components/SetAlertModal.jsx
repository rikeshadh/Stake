import { useState } from "react";
import { Bell, X, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import { fmt } from "../utils";

export function SetAlertModal({
  isOpen,
  onClose,
  symbol,
  currentPrice = 500,
  currency = "$",
  onSaveAlert,
  darkMode = false,
}) {
  const [condition, setCondition] = useState("ABOVE"); // ABOVE or BELOW
  const [targetPrice, setTargetPrice] = useState(
    condition === "ABOVE" ? Math.round(currentPrice * 1.05 * 10) / 10 : Math.round(currentPrice * 0.95 * 10) / 10
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleConditionChange = (cond) => {
    setCondition(cond);
    if (cond === "ABOVE" && targetPrice <= currentPrice) {
      setTargetPrice(Math.round(currentPrice * 1.05 * 10) / 10);
    } else if (cond === "BELOW" && targetPrice >= currentPrice) {
      setTargetPrice(Math.round(currentPrice * 0.95 * 10) / 10);
    }
  };

  const handleQuickPct = (pct) => {
    const newPrice = Math.round(currentPrice * (1 + pct / 100) * 10) / 10;
    setTargetPrice(newPrice);
    if (pct > 0) setCondition("ABOVE");
    else setCondition("BELOW");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) {
      alert("Please enter a valid target price");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSaveAlert) {
        await onSaveAlert({
          symbol,
          targetPrice: parseFloat(targetPrice),
          condition,
          note: note.trim() || `Alert when ${symbol} hits ${currency} ${fmt(targetPrice)}`,
          currentPrice,
        });
      }
      setSuccessMsg(`Alert saved! We will notify you when ${symbol} crosses ${currency} ${fmt(targetPrice)}`);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Failed to save price alert. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pctDiff = ((targetPrice - currentPrice) / currentPrice) * 100;

  const modalBg = darkMode ? "#111827" : "#ffffff";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = darkMode ? "#1a2236" : "#f8fafc";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 110,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 120,
          width: "min(460px, 94vw)",
          background: modalBg,
          borderRadius: 20,
          border: `1px solid ${borderCol}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          fontFamily: "'Hanken Grotesk', sans-serif",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${borderCol}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: darkMode ? "#1a2520" : "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(16,185,129,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: textPrimary }}>
                Set Price Alert • {symbol}
              </div>
              <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 600 }}>
                Live Price: <strong style={{ color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{currency} {fmt(currentPrice)}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
            }}
          >
            <X size={18} color={textSecondary} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {successMsg ? (
            <div
              style={{
                padding: "24px 16px",
                background: darkMode ? "rgba(16,185,129,0.15)" : "#f0fdf4",
                border: "1px solid #10b981",
                borderRadius: 14,
                textAlign: "center",
                color: "#10b981",
                fontWeight: 800,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Check size={28} />
              <div>{successMsg}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Trigger Condition Selector */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: textSecondary, marginBottom: 6 }}>
                  NOTIFY ME WHEN PRICE MOVES
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleConditionChange("ABOVE")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "10px",
                      borderRadius: 10,
                      border: `1px solid ${condition === "ABOVE" ? "#10b981" : borderCol}`,
                      background: condition === "ABOVE" ? (darkMode ? "rgba(16,185,129,0.15)" : "#f0fdf4") : inputBg,
                      color: condition === "ABOVE" ? "#10b981" : textSecondary,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <ArrowUpRight size={16} /> Rises Above
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConditionChange("BELOW")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "10px",
                      borderRadius: 10,
                      border: `1px solid ${condition === "BELOW" ? "#ef4444" : borderCol}`,
                      background: condition === "BELOW" ? (darkMode ? "rgba(239,68,68,0.15)" : "#fef2f2") : inputBg,
                      color: condition === "BELOW" ? "#ef4444" : textSecondary,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <ArrowDownRight size={16} /> Falls Below
                  </button>
                </div>
              </div>

              {/* Target Price Input */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: textSecondary }}>
                    TARGET PRICE ({currency})
                  </label>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: pctDiff >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}% from current
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || "")}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    color: textPrimary,
                    fontSize: 16,
                    fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: "none",
                  }}
                />
              </div>

              {/* Quick % Offset Presets */}
              <div style={{ display: "flex", gap: 6 }}>
                {[-10, -5, -2, 2, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPct(pct)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: pct > 0 ? "#10b981" : "#ef4444",
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: "pointer",
                    }}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Note / Tag */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: textSecondary, marginBottom: 6 }}>
                  NOTIFICATION NOTE (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take profit zone, Buy breakout, Stop loss warning..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    color: textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={onClose}
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
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "#006c49",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0,108,73,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Bell size={16} />
                  {isSubmitting ? "Saving Alert..." : "Save Alert to Profile"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
