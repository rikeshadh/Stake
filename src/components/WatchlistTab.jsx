import { Star, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Sparkline } from "./Charts";
import { fmt, initials } from "../utils";

export function WatchlistTab({
  watchlist,
  stocks,
  stockMetaList,
  onToggleWatch,
  onSelectStock,
  onOpenOrderDesk,
  dayChange,
  darkMode = false,
}) {
  const watchedMeta = stockMetaList.filter((s) => watchlist.includes(s.ticker));

  const bgCard = darkMode ? "#111827" : "rgba(255,255,255,0.85)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = darkMode ? "#f8fafc" : "#191c1e";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div style={{ paddingTop: 16, textAlign: "left" }}>
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
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#10b981", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
          PERSONAL WATCHLIST
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: textPrimary }}>
          Starred Equities
        </h1>
        <p style={{ fontSize: 13.5, color: textSecondary, margin: "4px 0 0" }}>
          Track real-time quotes, volatility indicators, and open direct order desks for monitored stocks.
        </p>
      </div>

      {watchedMeta.length === 0 ? (
        <div style={{ padding: "50px 20px", textAlign: "center", background: bgCard, borderRadius: 20, border: `1px dashed ${borderCol}` }}>
          <Star size={36} color={textSecondary} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary }}>Your watchlist is empty</div>
          <div style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>
            Click the star icon next to any stock on the Markets page to add it here.
          </div>
        </div>
      ) : (
        <div className="market-grid" style={{ marginBottom: 30 }}>
          {watchedMeta.map((s) => {
            const st = stocks[s.ticker] || { price: s.price, history: [s.price, s.price] };
            const chg = dayChange(s.ticker);
            const up = chg >= 0;

            return (
              <div
                key={s.ticker}
                style={{
                  borderRadius: 20,
                  padding: "18px 20px",
                  background: bgCard,
                  backdropFilter: "blur(14px)",
                  border: `1px solid ${borderCol}`,
                  boxShadow: darkMode ? "0 8px 24px rgba(0,0,0,0.2)" : "0 8px 24px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div
                    onClick={() => onSelectStock(s.ticker)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `${s.color}22`,
                        color: s.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 13,
                      }}
                    >
                      {initials(s.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: textPrimary }}>{s.ticker}</div>
                      <div style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>{s.name}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleWatch(s.ticker)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                    title="Remove from watchlist"
                  >
                    <Star size={18} fill="#f59e0b" color="#f59e0b" />
                  </button>
                </div>

                <div
                  onClick={() => onSelectStock(s.ticker)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                      $ {fmt(st.price)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: up ? "#10b981" : "#ef4444",
                      }}
                    >
                      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {up ? "+" : ""}{fmt(chg * 100)}%
                    </div>
                  </div>

                  <div style={{ width: 90, height: 32 }}>
                    <Sparkline history={st.history} color={up ? "#10b981" : "#ef4444"} w={90} h={32} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${borderCol}`, paddingTop: 10 }}>
                  <button
                    onClick={() => {
                      onSelectStock(s.ticker);
                      onOpenOrderDesk("BUY");
                    }}
                    style={{
                      padding: "8px",
                      borderRadius: 10,
                      border: "none",
                      background: darkMode ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
                      color: "#10b981",
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Zap size={13} /> Buy
                  </button>
                  <button
                    onClick={() => {
                      onSelectStock(s.ticker);
                      onOpenOrderDesk("SELL");
                    }}
                    style={{
                      padding: "8px",
                      borderRadius: 10,
                      border: `1px solid ${darkMode ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`,
                      background: darkMode ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
                      color: "#ef4444",
                      fontWeight: 800,
                      fontSize: 12.5,
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
  );
}
