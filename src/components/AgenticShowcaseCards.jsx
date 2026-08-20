import { Sparkles, Shield, Activity, Zap, CheckCircle2, RefreshCw } from "lucide-react";

export function AgenticShowcaseCards({ onGetStarted }) {
  return (
    <section style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px 60px" }}>
      {/* Section Subheading */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 999,
            background: "rgba(0, 108, 73, 0.08)",
            color: "#006c49",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            marginBottom: 10,
            fontFamily: "var(--font-body)",
          }}
        >
          <Sparkles size={14} color="#006c49" /> AGENTIC ECOSYSTEM • NEXT-GEN INFRASTRUCTURE
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#0f172a",
            margin: "0 0 10px",
          }}
        >
          Autonomous Trading & Market Intelligence
        </h2>
        <p style={{ fontSize: 15.5, color: "#64748b", margin: 0, maxWidth: 620, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6, fontWeight: 400 }}>
          Give your autonomous agents dedicated brokerage clearing, real-time Level 2 market scanning, and institutional risk safeguards.
        </p>
      </div>

      {/* 2 Side-by-Side Showcase Cards in Light Theme */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 28,
        }}
      >
        {/* ================= CARD 1: AGENTIC TRADING ================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 32,
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
            cursor: "default",
            position: "relative",
          }}
          className="agentic-feature-card"
        >
          {/* Top Text Content */}
          <div style={{ padding: "48px 36px 20px", textAlign: "center", zIndex: 5 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3vw, 32px)",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
              }}
            >
              Agentic Trading
            </h3>

            <p
              style={{
                fontSize: 14.5,
                color: "#475569",
                lineHeight: 1.6,
                maxWidth: 380,
                margin: "0 auto 24px",
                fontWeight: 400,
                fontFamily: "var(--font-body)",
              }}
            >
              Give your agent a dedicated Stake account to trade in, then monitor autonomous execution and performance directly in real time.
            </p>

            <button
              onClick={onGetStarted}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#ccff00",
                color: "#052e16",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(204, 255, 0, 0.4)",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(204, 255, 0, 0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(204, 255, 0, 0.4)";
              }}
            >
              Get started
            </button>
          </div>

          {/* Bottom Visual: 3D Illuminated Glass Keyboard / Isometric Matrix */}
          <div
            style={{
              position: "relative",
              height: 290,
              width: "100%",
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, #030a14 55%, #02060c 100%)",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            {/* Ambient Upward Lime Light Beam Cone */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 280,
                height: 240,
                background: "conic-gradient(from 180deg at 50% 100%, rgba(204, 255, 0, 0.8) 0deg, rgba(163, 230, 53, 0.3) 60deg, transparent 90deg, transparent 270deg, rgba(163, 230, 53, 0.3) 300deg, rgba(204, 255, 0, 0.8) 360deg)",
                filter: "blur(24px)",
                opacity: 0.85,
                pointerEvents: "none",
              }}
            />

            {/* Radiant Floor Flare */}
            <div
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 320,
                height: 60,
                background: "radial-gradient(ellipse at center, #ccff00 0%, rgba(204, 255, 0, 0.4) 40%, transparent 80%)",
                filter: "blur(14px)",
                pointerEvents: "none",
              }}
            />

            {/* Isometric Glass Keycaps Cluster */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                gap: 10,
                marginBottom: 32,
                transform: "perspective(700px) rotateX(25deg)",
              }}
            >
              {[
                { label: "SWEEP", symbol: "⌘", active: false },
                { label: "EXECUTE", symbol: "⚡", active: true },
                { label: "VERIFY", symbol: "✓", active: false },
              ].map((key, i) => (
                <div
                  key={i}
                  style={{
                    width: key.active ? 86 : 74,
                    height: 80,
                    borderRadius: 14,
                    background: key.active
                      ? "linear-gradient(135deg, rgba(204, 255, 0, 0.25) 0%, rgba(15, 23, 42, 0.8) 60%, rgba(2, 6, 23, 0.95) 100%)"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(15, 23, 42, 0.75) 60%, rgba(2, 6, 23, 0.9) 100%)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: key.active
                      ? "1.5px solid rgba(204, 255, 0, 0.7)"
                      : "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: key.active
                      ? "0 -6px 20px rgba(204, 255, 0, 0.35), inset 0 2px 8px rgba(204, 255, 0, 0.4), 0 14px 24px rgba(0,0,0,0.6)"
                      : "0 10px 20px rgba(0,0,0,0.5), inset 0 1px 4px rgba(255,255,255,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: key.active ? 20 : 16,
                      color: key.active ? "#ccff00" : "rgba(255,255,255,0.8)",
                      textShadow: key.active ? "0 0 12px rgba(204,255,0,0.8)" : "none",
                    }}
                  >
                    {key.symbol}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.08em",
                      color: key.active ? "#ffffff" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {key.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= CARD 2: AGENTIC RISK RAILS & MARKET RADAR ================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 32,
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
            cursor: "default",
            position: "relative",
          }}
          className="agentic-feature-card"
        >
          {/* Top Text Content */}
          <div style={{ padding: "48px 36px 20px", textAlign: "center", zIndex: 5 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3vw, 32px)",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
              }}
            >
              Risk Rails & Intelligence
            </h3>

            <p
              style={{
                fontSize: 14.5,
                color: "#475569",
                lineHeight: 1.6,
                maxWidth: 380,
                margin: "0 auto 24px",
                fontWeight: 400,
                fontFamily: "var(--font-body)",
              }}
            >
              Set hard spending limits, automated stop-loss thresholds, and enjoy a 5-minute instant trade revert grace period on every order.
            </p>

            <button
              onClick={onGetStarted}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#006c49",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0, 108, 73, 0.25)",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 108, 73, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 108, 73, 0.25)";
              }}
            >
              Explore Safeguards
            </button>
          </div>

          {/* Bottom Visual: Holographic Multi-Layer Shield & Radar Scanner Matrix */}
          <div
            style={{
              position: "relative",
              height: 290,
              width: "100%",
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, #030a14 55%, #02060c 100%)",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            {/* Ambient Upward Emerald Light Beam */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 280,
                height: 240,
                background: "conic-gradient(from 180deg at 50% 100%, rgba(16, 185, 129, 0.8) 0deg, rgba(5, 150, 105, 0.3) 60deg, transparent 90deg, transparent 270deg, rgba(5, 150, 105, 0.3) 300deg, rgba(16, 185, 129, 0.8) 360deg)",
                filter: "blur(24px)",
                opacity: 0.85,
                pointerEvents: "none",
              }}
            />

            {/* Radiant Floor Flare */}
            <div
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 320,
                height: 60,
                background: "radial-gradient(ellipse at center, #10b981 0%, rgba(16, 185, 129, 0.4) 40%, transparent 80%)",
                filter: "blur(14px)",
                pointerEvents: "none",
              }}
            />

            {/* Standing Cybernetic Safety & Radar Shield Box */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                width: 280,
                marginBottom: 24,
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(15, 23, 42, 0.88) 60%, rgba(2, 6, 23, 0.98) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                borderRadius: 18,
                padding: "16px 18px",
                boxShadow: "0 -8px 24px rgba(16, 185, 129, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transform: "perspective(800px) rotateX(12deg)",
                boxSizing: "border-box",
              }}
            >
              {/* Header: Shield Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontSize: 11, fontWeight: 700 }}>
                  <Shield size={14} />
                  <span>AUTONOMOUS RISK SHIELD</span>
                </div>
                <span style={{ fontSize: 10, color: "#34d399", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                  ACTIVE
                </span>
              </div>

              {/* Status Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={11} color="#f59e0b" /> Max Daily Allocation:
                  </span>
                  <span style={{ color: "#ffffff", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>$ 2,000 / day</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <RefreshCw size={11} color="#38bdf8" /> Instant Trade Revert:
                  </span>
                  <span style={{ color: "#38bdf8", fontWeight: 600 }}>5-Min Grace</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Activity size={11} color="#34d399" /> L2 Order Book Radar:
                  </span>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>Real-time 180s Scan</span>
                </div>
              </div>

              {/* Safe Guardrail Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8 }}>
                <CheckCircle2 size={12} color="#10b981" />
                <span>Zero unsolicited API executions without your authorization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
