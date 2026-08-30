import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  const [condition, setCondition] = useState("ABOVE"); // "ABOVE" or "BELOW"
  const [targetPriceInput, setTargetPriceInput] = useState(
    () => (currentPrice * 1.05).toFixed(1)
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const closeButtonRef = useRef(null);

  /* Reset the form on each open, using React's documented "adjust state when a
     prop changes" pattern. This used to be an effect keyed on
     [isOpen, currentPrice] — but currentPrice ticks live, so every price update
     while the modal was open wiped the target price and note the user was
     mid-way through typing. Keying off the open transition alone fixes that. */
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setCondition("ABOVE");
      setTargetPriceInput((currentPrice * 1.05).toFixed(1));
      setNote("");
      setError(null);
      setIsSubmitting(false);
    }
  }

  // Focus target price input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Trap focus inside modal
  const trapFocus = useCallback((e) => {
    if (!modalRef.current || e.key !== "Tab") return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      if (activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", trapFocus);
      return () => document.removeEventListener("keydown", trapFocus);
    }
  }, [isOpen, trapFocus]);

  const handleConditionChange = (cond) => {
    setCondition(cond);
    const current = parseFloat(targetPriceInput);
    if (cond === "ABOVE" && current <= currentPrice) {
      setTargetPriceInput((currentPrice * 1.05).toFixed(1));
    } else if (cond === "BELOW" && current >= currentPrice) {
      setTargetPriceInput((currentPrice * 0.95).toFixed(1));
    }
    setError(null);
  };

  const handleQuickPct = (pct) => {
    const newPrice = currentPrice * (1 + pct / 100);
    setTargetPriceInput(newPrice.toFixed(1));
    setCondition(pct > 0 ? "ABOVE" : "BELOW");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const targetPrice = parseFloat(targetPriceInput);

    if (isNaN(targetPrice) || targetPrice <= 0) {
      setError("Please enter a valid positive target price.");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSaveAlert) {
        await onSaveAlert({
          symbol,
          targetPrice,
          condition,
          note: note.trim() || `Alert when ${symbol} hits ${currency} ${fmt(targetPrice)}`,
          currentPrice,
        });
      }
      // Success: close the modal immediately
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save price alert. Please try again.");
      setIsSubmitting(false);
    }
  };

  const pctDiff =
    ((parseFloat(targetPriceInput || "0") - currentPrice) / currentPrice) * 100;

  // Color palette
  const colors = {
    modalBg: darkMode ? "#111827" : "#ffffff",
    headerBg: darkMode ? "#1a2236" : "#f8fafc",
    textPrimary: darkMode ? "#f8fafc" : "#191c1e",
    textSecondary: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    inputBg: darkMode ? "#1a2236" : "#f8fafc",
    green: "#10b981",
    red: "#ef4444",
    primaryButton: "#006c49",
  };

  const styles = {
    backdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.6)",
      zIndex: 110,
      backdropFilter: "blur(4px)",
    },
    modal: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 120,
      width: "min(460px, 94vw)",
      background: colors.modalBg,
      borderRadius: 20,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      fontFamily: "'Hanken Grotesk', sans-serif",
      overflow: "hidden",
      textAlign: "left",
    },
    header: {
      padding: "16px 20px",
      borderBottom: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: colors.headerBg,
    },
    iconContainer: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: "rgba(16,185,129,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 16,
      fontWeight: 900,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 11.5,
      color: colors.textSecondary,
      fontWeight: 600,
    },
    closeButton: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 6,
      borderRadius: "50%",
      transition: "background 0.2s",
    },
    form: {
      padding: 20,
    },
    label: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 800,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    buttonGroup: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
    },
    conditionButton: (active, type) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${
        active ? (type === "ABOVE" ? colors.green : colors.red) : colors.border
      }`,
      background: active
        ? darkMode
          ? type === "ABOVE"
            ? "rgba(16,185,129,0.15)"
            : "rgba(239,68,68,0.15)"
          : type === "ABOVE"
            ? "#f0fdf4"
            : "#fef2f2"
        : colors.inputBg,
      color: active ? (type === "ABOVE" ? colors.green : colors.red) : colors.textSecondary,
      fontWeight: 800,
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: `1px solid ${colors.border}`,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: 900,
      fontFamily: "'JetBrains Mono', monospace",
      outline: "none",
    },
    quickButton: (pct) => ({
      flex: 1,
      padding: "6px 0",
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.inputBg,
      color: pct > 0 ? colors.green : colors.red,
      fontSize: 11.5,
      fontWeight: 800,
      fontFamily: "'JetBrains Mono', monospace",
      cursor: "pointer",
      transition: "background 0.2s",
    }),
    noteInput: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: `1px solid ${colors.border}`,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: 600,
      outline: "none",
    },
    errorBox: {
      padding: "8px 12px",
      borderRadius: 8,
      background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2",
      border: "1px solid #ef4444",
      color: "#ef4444",
      fontSize: 13,
      fontWeight: 700,
    },
    cancelButton: {
      padding: "12px 18px",
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      background: colors.inputBg,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
    },
    saveButton: {
      flex: 1,
      padding: "12px 20px",
      borderRadius: 12,
      border: "none",
      background: colors.primaryButton,
      color: "#ffffff",
      fontSize: 14,
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(0,108,73,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      transition: "opacity 0.2s",
      opacity: isSubmitting ? 0.7 : 1,
    },
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div onClick={onClose} style={styles.backdrop} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        style={styles.modal}
      >
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.iconContainer}>
              <Bell size={18} color={colors.green} />
            </div>
            <div>
              <div id="alert-modal-title" style={styles.title}>
                Set Price Alert • {symbol}
              </div>
              <div style={styles.subtitle}>
                Live Price:{" "}
                <strong
                  style={{
                    color: colors.textPrimary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {currency} {fmt(currentPrice)}
                </strong>
              </div>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close modal"
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={18} color={colors.textSecondary} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={styles.label}>NOTIFY ME WHEN PRICE MOVES</label>
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => handleConditionChange("ABOVE")}
                  style={styles.conditionButton(condition === "ABOVE", "ABOVE")}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <ArrowUpRight size={16} /> Rises Above
                </button>
                <button
                  type="button"
                  onClick={() => handleConditionChange("BELOW")}
                  style={styles.conditionButton(condition === "BELOW", "BELOW")}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <ArrowDownRight size={16} /> Falls Below
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={styles.label}>TARGET PRICE ({currency})</label>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: pctDiff >= 0 ? colors.green : colors.red,
                  }}
                >
                  {pctDiff >= 0 ? "+" : ""}
                  {pctDiff.toFixed(1)}% from current
                </span>
              </div>
              <input
                ref={inputRef}
                type="number"
                step="0.1"
                min="0.1"
                required
                value={targetPriceInput}
                onChange={(e) => {
                  setTargetPriceInput(e.target.value);
                  setError(null);
                }}
                style={styles.input}
                aria-label="Target price"
              />
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {[-10, -5, -2, 2, 5, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPct(pct)}
                  style={styles.quickButton(pct)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = colors.inputBg)}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>

            <div>
              <label style={styles.label}>NOTIFICATION NOTE (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. Take profit zone, Buy breakout, Stop loss warning..."
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 120))}
                style={styles.noteInput}
                maxLength={120}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button type="button" onClick={onClose} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} style={styles.saveButton}>
                <Bell size={16} />
                {isSubmitting ? "Saving..." : "Save Alert"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}