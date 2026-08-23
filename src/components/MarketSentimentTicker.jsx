import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function MarketSentimentTicker({ darkMode = false }) {
  const [indices, setIndices] = useState([
    { symbol: "S&P 500", value: "5,983.25", change: "+0.68%", isUp: true, type: "INDEX" },
    { symbol: "NASDAQ 100", value: "21,120.40", change: "+1.15%", isUp: true, type: "INDEX" },
    { symbol: "DOW JONES", value: "43,870.10", change: "+0.24%", isUp: true, type: "INDEX" },
    { symbol: "NIKKEI 225", value: "38,950.00", change: "+1.42%", isUp: true, type: "INDEX" },
    { symbol: "FTSE 100", value: "8,340.50", change: "-0.18%", isUp: false, type: "INDEX" },
    { symbol: "DAX 40", value: "19,420.80", change: "+0.52%", isUp: true, type: "INDEX" },
    { symbol: "BITCOIN", value: "$96,480", change: "+3.12%", isUp: true, type: "CRYPTO" },
    { symbol: "ETHEREUM", value: "$2,740", change: "+2.45%", isUp: true, type: "CRYPTO" },
    { symbol: "US 10Y YIELD", value: "4.28%", change: "-0.04%", isUp: false, type: "BOND" },
    { symbol: "GOLD SPOT", value: "$2,910/oz", change: "+0.35%", isUp: true, type: "COMMODITY" },
    { symbol: "BRENT CRUDE", value: "$74.20/bbl", change: "-0.85%", isUp: false, type: "COMMODITY" },
    { symbol: "FEAR & GREED", value: "76 (Greed)", change: "+4 pts", isUp: true, type: "SENTIMENT" },
  ]);

  const [isPaused, setIsPaused] = useState(false);

  // Subtle live tick generator for indices
  useEffect(() => {
    const timer = setInterval(() => {
      setIndices((prev) =>
        prev.map((item) => {
          if (item.type === "SENTIMENT") return item;
          if (Math.random() > 0.35) return item;
          const currentNum = parseFloat(item.value.replace(/[^0-9.-]/g, ""));
          if (isNaN(currentNum)) return item;
          const delta = (Math.random() - 0.48) * (currentNum * 0.0008);
          const newNum = currentNum + delta;
          let formatted;
          if (item.symbol === "BITCOIN") formatted = `$${Math.round(newNum).toLocaleString()}`;
          else if (item.symbol === "ETHEREUM") formatted = `$${Math.round(newNum).toLocaleString()}`;
          else if (item.symbol === "US 10Y YIELD") formatted = `${newNum.toFixed(2)}%`;
          else if (item.symbol === "GOLD SPOT") formatted = `$${Math.round(newNum).toLocaleString()}/oz`;
          else if (item.symbol === "BRENT CRUDE") formatted = `$${newNum.toFixed(2)}/bbl`;
          else formatted = newNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          const newPct = (parseFloat(item.change.replace("%", "")) + (delta / currentNum) * 100).toFixed(2);
          return {
            ...item,
            value: formatted,
            change: `${newPct > 0 ? "+" : ""}${newPct}%`,
            isUp: parseFloat(newPct) >= 0,
          };
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const bgContainer = darkMode ? "#0b1320" : "#f1f5f9";
  const borderCol = darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0";
  const textCol = darkMode ? "#e2e8f0" : "#0f172a";

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background: bgContainer,
        borderBottom: `1px solid ${borderCol}`,
        display: "flex",
        alignItems: "center",
        height: 38,
        position: "relative",
        userSelect: "none",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Fixed Sentiment Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          height: "100%",
          background: darkMode ? "#111c2e" : "#e2e8f0",
          borderRight: `1px solid ${borderCol}`,
          zIndex: 10,
          flexShrink: 0,
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px #10b981",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.05em",
            color: "#059669",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          GLOBAL SENTIMENT
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
          }}
        >
          BULLISH
        </span>
      </div>

      {/* Scrolling Marquee Track */}
      <div
        style={{
          display: "flex",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
          maskImage: "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            paddingLeft: 20,
            animation: "tickerMarquee 42s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          {/* Repeat list twice for seamless continuous loop */}
          {[...indices, ...indices].map((item, idx) => (
            <div
              key={`${item.symbol}-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: 6,
                transition: "background 0.15s ease",
              }}
            >
              <span style={{ fontWeight: 800, color: textCol, letterSpacing: "0.02em" }}>
                {item.symbol}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: textCol,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11.5,
                }}
              >
                {item.value}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontWeight: 700,
                  fontSize: 11,
                  color: item.isUp ? "#10b981" : "#ef4444",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {item.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{item.change}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tickerMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
