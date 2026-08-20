import { TrendingUp, TrendingDown, Radio } from "lucide-react";

export function LiveIndicesFooter({ darkMode = false }) {
  const indices = [
    { name: "S&P 500", val: "5,864.67", chg: "+0.45%", isUp: true },
    { name: "NASDAQ 100", val: "20,380.20", chg: "+0.82%", isUp: true },
    { name: "DOW JONES", val: "43,275.90", chg: "+0.28%", isUp: true },
    { name: "FTSE 100", val: "8,358.25", chg: "-0.14%", isUp: false },
    { name: "NIKKEI 225", val: "38,981.75", chg: "+0.64%", isUp: true },
    { name: "DAX 40", val: "19,657.30", chg: "+0.38%", isUp: true },
    { name: "GOLD (oz)", val: "$2,721.40", chg: "+0.75%", isUp: true },
    { name: "CRUDE OIL", val: "$70.80", chg: "-0.65%", isUp: false },
    { name: "BITCOIN", val: "$68,450", chg: "+2.15%", isUp: true },
    { name: "ETHEREUM", val: "$2,640.80", chg: "+1.90%", isUp: true },
  ];

  const bgFooter = darkMode ? "rgba(18, 21, 24, 0.95)" : "rgba(255, 255, 255, 0.98)";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const badgeBg = darkMode ? "#0d1013" : "#f1f5f9";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";

  return (
    <footer
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        background: bgFooter,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: textPrimary,
        borderTop: `1px solid ${borderCol}`,
        boxShadow: darkMode ? "0 -4px 20px rgba(0,0,0,0.18)" : "0 -2px 10px rgba(0,0,0,0.04)",
        overflow: "hidden",
        height: 38,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Static Label Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          background: badgeBg,
          borderRight: `1px solid ${borderCol}`,
          height: "100%",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <Radio size={12} color="#10b981" />
        <span
          style={{
            color: "#059669",
            fontWeight: 800,
            fontSize: 10.5,
            letterSpacing: "0.08em",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          GLOBAL INDICES
        </span>
      </div>

      {/* Marquee Ticker Stream */}
      <div
        style={{
          display: "flex",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 28,
            paddingLeft: 16,
            animation: "marqueeScroll 35s linear infinite",
          }}
        >
          {[...indices, ...indices].map((idx, i) => (
            <div
              key={`${idx.name}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span style={{ fontWeight: 800, color: textSecondary, fontSize: 11 }}>{idx.name}</span>
              <span style={{ fontWeight: 800, color: textPrimary }}>{idx.val}</span>
              <span
                style={{
                  color: idx.isUp ? "#059669" : "#ef4444",
                  fontWeight: 800,
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {idx.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.chg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
