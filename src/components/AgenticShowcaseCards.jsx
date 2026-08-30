import { Sparkles, Shield, Activity, Zap, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";

/* The two cards below sit inside LandingPage and inherit its token set. Each is
   a white card whose lower panel is dark, so the panel reads as a screenshot of
   the real artefact the feature produces — a decision trace and a risk
   configuration readout — rather than an abstract graphic. */

const TRACE = [
  { t: "09:31:04", label: "Scanned 3,412 symbols", tag: "scan" },
  { t: "09:31:06", label: "NVDA · momentum breakout", tag: "signal" },
  { t: "09:31:06", label: "Risk check · within $2,000 cap", tag: "risk" },
  { t: "09:31:07", label: "Bought 12 @ 138.27", tag: "fill" },
];

const RAILS = [
  { icon: Zap, tint: "var(--mint)", label: "Daily allocation ceiling", value: "$2,000" },
  { icon: RefreshCw, tint: "var(--sky)", label: "Order revert window", value: "5 min" },
  { icon: Activity, tint: "var(--mint-bright)", label: "Order book rescan", value: "every 180s" },
];

export function AgenticShowcaseCards({ onGetStarted }) {
  return (
    <section className="stake-section">
      <div className="stake-section-head stake-section-head-center">
        <div className="stake-eyebrow" style={{ justifyContent: "center" }}>
          <Sparkles size={13} /> Agentic ecosystem
        </div>
        <h2 className="stake-section-title">Autonomous trading, on a short leash</h2>
        <p className="stake-section-lede">
          Give an agent its own brokerage account, real-time Level 2 scanning, and hard limits it
          cannot trade past.
        </p>
      </div>

      <div className="stake-showcase-grid">
        {/* ---------------- Card 1 · agentic trading ---------------- */}
        <article className="agentic-feature-card">
          <div className="stake-showcase-copy">
            <h3 className="stake-showcase-title">Agentic trading</h3>
            <p className="stake-showcase-lede">
              Give your agent a dedicated Stake account, then watch every decision it makes and
              every order it fills, as it happens.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="stake-glass-button stake-glass-button-primary"
            >
              Get started <ArrowRight size={15} />
            </button>
          </div>

          <div className="stake-showcase-panel">
            <div className="stake-panel-head">
              <span>
                Decision trace · <strong>Momentum breakout</strong>
              </span>
              <span className="stake-live">
                <span className="stake-live-dot" aria-hidden="true" />
                Running
              </span>
            </div>
            <ol className="stake-trace">
              {TRACE.map((r, i) => (
                <li className="stake-trace-row" key={r.t + r.tag} style={{ "--i": i }}>
                  <span className="stake-trace-time">{r.t}</span>
                  <span className="stake-trace-label">{r.label}</span>
                  <span className={`stake-trace-tag ${r.tag}`}>{r.tag}</span>
                </li>
              ))}
            </ol>
          </div>
        </article>

        {/* ---------------- Card 2 · risk rails ---------------- */}
        <article className="agentic-feature-card">
          <div className="stake-showcase-copy">
            <h3 className="stake-showcase-title">Risk rails</h3>
            <p className="stake-showcase-lede">
              Set a hard spending ceiling, automatic stop-losses, and a five-minute window to revert
              any order the agent placed.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="stake-btn-light"
            >
              Explore safeguards <ArrowRight size={15} />
            </button>
          </div>

          <div className="stake-showcase-panel">
            <div className="stake-panel-head">
              <span>
                <Shield size={12} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                Risk shield
              </span>
              <span className="stake-live">
                <span className="stake-live-dot" aria-hidden="true" />
                Armed
              </span>
            </div>

            <dl className="stake-rails">
              {RAILS.map(({ icon: Icon, tint, label, value }) => (
                <div className="stake-rail-row" key={label}>
                  <dt className="stake-rail-label">
                    <Icon size={12} color={tint} />
                    {label}
                  </dt>
                  <dd className="stake-rail-val">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="stake-rail-note">
              <CheckCircle2 size={12} color="var(--mint)" />
              No order leaves the desk without the limits you set
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
