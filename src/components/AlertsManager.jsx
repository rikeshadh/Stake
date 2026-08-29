import { Bell, Trash2, ArrowUpRight, ArrowDownRight, Clock, Plus, Zap } from "lucide-react";
import { fmt } from "../utils";

export function AlertsManager({
  alerts = [],
  onDeleteAlert,
  onOpenSetAlert,
  onSelectStock,
  darkMode = false,
}) {
  const bgCard = darkMode ? "#111827" : "rgba(255,255,255,0.92)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgItem = darkMode ? "#1a2236" : "#f8fafc";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 12px 48px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#10b981",
                letterSpacing: "0.06em",
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(16,185,129,0.12)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              REAL-TIME PRICE TRIGGERS
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: textPrimary, margin: "6px 0 2px" }}>
            Active Stock Alerts
          </h1>
          <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
            Automated notifications triggered when a stock hits or crosses your custom target price.
          </p>
        </div>

        {onOpenSetAlert && (
          <button
            onClick={() => onOpenSetAlert()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              border: "none",
              background: "#006c49",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,108,73,0.3)",
            }}
          >
            <Plus size={16} /> Set New Alert
          </button>
        )}
      </div>

      {/* Alerts Grid / List */}
      {alerts.length === 0 ? (
        <div
          style={{
            background: bgCard,
            border: `1px solid ${borderCol}`,
            borderRadius: 20,
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: darkMode ? "0 6px 20px rgba(0,0,0,0.2)" : "0 6px 20px rgba(0,0,0,0.03)",
          }}
        >
          <Bell size={44} color="#10b981" style={{ margin: "0 auto 12px", opacity: 0.6 }} />
          <h3 style={{ fontSize: 18, fontWeight: 900, color: textPrimary, margin: "0 0 6px" }}>
            No Price Alerts Set
          </h3>
          <p style={{ fontSize: 13, color: textSecondary, maxWidth: 420, margin: "0 auto 18px" }}>
            Stay ahead of market movements. Navigate to any stock detail page or click "Set Alert" to get notified on breakout levels or dip buys.
          </p>
          {onOpenSetAlert && (
            <button
              onClick={() => onOpenSetAlert()}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "#006c49",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Create Your First Alert
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((al) => {
            const isAbove = al.condition === "ABOVE";
            return (
              <div
                key={al.id}
                className={al.triggered ? "stake-alert-triggered-pulse" : ""}
                style={{
                  background: al.triggered ? (darkMode ? "#291d09" : "#fffbeb") : bgCard,
                  border: al.triggered ? "1.5px solid #f59e0b" : `1px solid ${borderCol}`,
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 14,
                  boxShadow: al.triggered
                    ? "0 0 20px rgba(245, 158, 11, 0.25)"
                    : darkMode
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 4px 12px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: al.triggered
                        ? "rgba(245, 158, 11, 0.2)"
                        : isAbove
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(239,68,68,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {al.triggered ? (
                      <Zap size={22} color="#f59e0b" />
                    ) : isAbove ? (
                      <ArrowUpRight size={22} color="#10b981" />
                    ) : (
                      <ArrowDownRight size={22} color="#ef4444" />
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        onClick={() => onSelectStock && onSelectStock(al.symbol)}
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: "#10b981",
                          fontFamily: "'JetBrains Mono', monospace",
                          cursor: "pointer",
                        }}
                      >
                        {al.symbol}
                      </span>
                      {al.triggered ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fcd34d",
                            fontFamily: "'JetBrains Mono', monospace",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          ● TRIGGERED
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: isAbove ? (darkMode ? "#1b3a2a" : "#dcfce7") : (darkMode ? "#3b1a20" : "#fee2e2"),
                            color: isAbove ? "#10b981" : "#ef4444",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {isAbove ? "≥ ABOVE TARGET" : "≤ BELOW TARGET"}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, color: textPrimary, marginTop: 4, fontWeight: 700 }}>
                      Target: <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>$ {fmt(al.targetPrice)}</strong>
                      {al.note && (
                        <span style={{ color: textSecondary, fontWeight: 500, marginLeft: 8 }}>
                          • {al.note}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: textSecondary, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> Created on {al.createdAt ? new Date(al.createdAt).toLocaleDateString() : "Recently"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => onDeleteAlert && onDeleteAlert(al.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `1px solid ${borderCol}`,
                      background: bgItem,
                      color: "#ef4444",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
