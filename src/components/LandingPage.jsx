import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Shield,
  HelpCircle,
  X,
  ChevronUp,
  FileText,
  Scale,
  AlertTriangle,
  MessageCircle,
  Activity,
} from "lucide-react";
import { Logo, MarketMainChart } from "./Charts";
import { AgenticShowcaseCards } from "./AgenticShowcaseCards";
import { fetchStocks } from "../api";
import { fmt } from "../utils";
import "../styles/landing.css";

const FALLBACK_STOCKS = [
  { ticker: "NVDA", name: "NVIDIA Corporation", price: 138.25, change: 2.84, sector: "Semiconductors & AI", volume: "48.2M" },
  { ticker: "AAPL", name: "Apple Inc.", price: 229.10, change: 1.42, sector: "Consumer Tech", volume: "32.0M" },
  { ticker: "TSLA", name: "Tesla Inc.", price: 249.80, change: 3.10, sector: "Automotive & Energy", volume: "64.5M" },
  { ticker: "MSFT", name: "Microsoft Corporation", price: 432.50, change: 0.85, sector: "Cloud & Software", volume: "18.9M" },
  { ticker: "AMZN", name: "Amazon.com Inc.", price: 187.60, change: 1.65, sector: "E-Commerce & Cloud", volume: "26.1M" },
  { ticker: "META", name: "Meta Platforms", price: 582.30, change: 1.95, sector: "Social Media & AI", volume: "14.8M" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.40, change: -0.45, sector: "Internet & Search", volume: "21.4M" },
  { ticker: "AMD", name: "Advanced Micro Devices", price: 154.20, change: -1.15, sector: "Semiconductors", volume: "38.7M" },
];

/* Percentages arrive from several upstream shapes, some with long float tails.
   Normalise to two decimals so the tables and chips never overflow. */
function pct(n) {
  const v = Number(n);
  if (!isFinite(v)) return "0.00";
  return v.toFixed(2);
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  /* Read the preference on mount, then keep listening — the user can flip it
     from the OS while the page is open. */
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(REDUCE_QUERY).matches === true
  );

  useEffect(() => {
    const mq = window.matchMedia?.(REDUCE_QUERY);
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/* Reveals its children once, the first time they scroll into view. */
function Reveal({ children, delay = 0, as: Tag = "div", className = "", ...rest }) {
  const ref = useRef(null);
  /* No IntersectionObserver means no reveal to schedule, so start visible. */
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`stake-reveal ${shown ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--i": delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* =============================================================================
   SIGNATURE ELEMENT — live order book.
   This is what a trader actually watches, so it doubles as the product demo:
   resting size is drawn as a depth bar behind each level, and the most recent
   fill prints along the bottom. Pauses when the tab is hidden, and freezes
   entirely under reduced motion.
   ============================================================================= */
function useOrderBook(basePrice, paused) {
  const seed = Number(basePrice) > 0 ? Number(basePrice) : 138.25;

  const build = useCallback((mid) => {
    const tick = mid > 200 ? 0.05 : 0.02;
    const rows = (side) =>
      Array.from({ length: 3 }, (_, i) => {
        const level = i + 1;
        return {
          px: side === "ask" ? mid + tick * level : mid - tick * level,
          size: Math.round(240 + Math.random() * 1500),
          orders: Math.round(3 + Math.random() * 22),
        };
      });
    return { asks: rows("ask").reverse(), bids: rows("bid") };
  }, []);

  const [book, setBook] = useState(() => build(seed));
  const [last, setLast] = useState(() => ({ px: seed, dir: "up", n: 0 }));
  const [print, setPrint] = useState(() => ({ time: "", px: seed, size: 400, dir: "up" }));

  /* The running price lives in a ref so a tick can read it synchronously —
     nesting setState calls inside an updater would make the updater impure. */
  const pxRef = useRef(seed);

  useEffect(() => {
    if (paused) return;

    /* When a fresh quote arrives the book snaps to it on the next tick rather
       than in the effect body, which would cascade a render. */
    let resync = true;

    const step = () => {
      if (document.hidden) return;

      const prev = pxRef.current;
      let next;
      if (resync) {
        resync = false;
        next = seed;
      } else {
        const drift = (Math.random() - 0.47) * (seed > 200 ? 0.16 : 0.07);
        next = Math.max(seed * 0.985, Math.min(seed * 1.015, prev + drift));
      }
      const dir = next >= prev ? "up" : "down";
      pxRef.current = next;

      setBook(build(next));
      setLast((p) => ({ px: next, dir, n: p.n + 1 }));
      setPrint({
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        px: next,
        size: Math.round(1 + Math.random() * 18) * 100,
        dir,
      });
    };

    const timer = setInterval(step, 1600);
    return () => clearInterval(timer);
  }, [paused, seed, build]);

  const bestAsk = book.asks[book.asks.length - 1]?.px ?? seed;
  const bestBid = book.bids[0]?.px ?? seed;
  const maxSize = Math.max(...book.asks.map((r) => r.size), ...book.bids.map((r) => r.size), 1);

  return { book, last, print, spread: bestAsk - bestBid, maxSize };
}

function OrderBookPanel({ stock, reduced }) {
  const { book, last, print, spread, maxSize } = useOrderBook(stock?.price, reduced);

  const row = (r, side, i) => (
    <div
      key={`${side}-${i}`}
      className={`stake-book-row ${side}`}
      style={{ "--d": `${Math.round((r.size / maxSize) * 100)}%`, "--i": i }}
    >
      <span className="stake-book-px">{r.px.toFixed(2)}</span>
      <span className="stake-book-sz">{r.size.toLocaleString("en-US")}</span>
      <span className="stake-book-mkt">{r.orders} ord</span>
    </div>
  );

  return (
    <div className="stake-book-stack">
      <div className="stake-panel">
        <div className="stake-panel-head">
          <span>
            Order book · <strong>{stock?.ticker || "selected market"}</strong>
          </span>
          <span className="stake-live">
            <span className="stake-live-dot" aria-hidden="true" />
            Level 2
          </span>
        </div>

        <div className="stake-book-rows">{book.asks.map((r, i) => row(r, "ask", i))}</div>

        <div className="stake-book-spread">
          <span>Spread {spread.toFixed(2)}</span>
          <span key={last.n} className={`stake-book-last stake-num tick-${last.dir}`}>
            {last.px.toFixed(2)}
          </span>
        </div>

        <div className="stake-book-rows">{book.bids.map((r, i) => row(r, "bid", i))}</div>

        <div className="stake-book-foot">
          <span>Last print</span>
          <span key={last.n} className={`stake-book-print ${print.dir}`}>
            {print.time || "--:--:--"} · {print.px.toFixed(2)} ×{" "}
            {print.size.toLocaleString("en-US")}
          </span>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a, id }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`stake-faq-item ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        className="stake-faq-q"
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${id}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span>{q}</span>
        <span className="stake-faq-icon" aria-hidden="true">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <div className="stake-faq-a" id={`faq-panel-${id}`} role="region" hidden={!isOpen}>
        <div>
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onOpenLogin, onOpenSignup, onOpenAuth }) {
  const [activeModal, setActiveModal] = useState(null);
  const [liveStocks, setLiveStocks] = useState(FALLBACK_STOCKS);
  const [index, setIndex] = useState({ val: 5964.8, chg: 84.2, pct: 1.43 });
  const reduced = useReducedMotion();
  const closeRef = useRef(null);
  const lastFocused = useRef(null);

  /* Live quotes. Skips the request while the tab is hidden so a backgrounded
     landing page stops polling the API. */
  useEffect(() => {
    let isMounted = true;

    const loadStocks = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchStocks();
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        setLiveStocks(
          data.map((s) => ({
            ticker: s.ticker || s.symbol,
            name: s.name || s.companyName || s.ticker,
            price: Number(s.price || s.ltp || s.currentPrice || 100),
            change: Number(
              s.change ??
                s.changePercent ??
                (s.price && s.prevClose ? ((s.price - s.prevClose) / s.prevClose) * 100 : 1.25)
            ),
            sector: s.sector || "Equities",
            volume: s.volume
              ? typeof s.volume === "number"
                ? `${(s.volume / 1e6).toFixed(1)}M`
                : s.volume
              : "24.5M",
          }))
        );
      } catch (err) {
        console.warn("Could not pull live landing stocks:", err);
      }
    };

    loadStocks();
    const interval = setInterval(loadStocks, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* The benchmark ticks rather than counting up: a quote that animates from zero
     would read as decoration, whereas drift reads as a live feed. */
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setIndex((p) => {
        const val = p.val + (Math.random() - 0.48) * 1.9;
        const chg = val - 5880.6;
        return { val, chg, pct: (chg / 5880.6) * 100 };
      });
    }, 2400);
    return () => clearInterval(t);
  }, [reduced]);

  const handleOpenLogin = () => {
    if (onOpenLogin) onOpenLogin();
    else if (onOpenAuth) onOpenAuth("login");
  };

  const handleOpenSignup = () => {
    if (onOpenSignup) onOpenSignup();
    else if (onOpenAuth) onOpenAuth("signup");
  };

  const handleEnter = handleOpenSignup;

  /* Modal: close on Escape, lock the page behind it, and return focus on exit. */
  useEffect(() => {
    if (!activeModal) return;
    lastFocused.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [activeModal]);

  const privacyContent = `
    <p><strong>Effective date:</strong> January 1, 2026</p>
    <p>Stake Global Inc. collects only what it needs to run your account. This policy explains what we hold, why we hold it, and the choices you have.</p>
    <h4>What we collect</h4>
    <p>Information you give us when you open an account, fund it, or contact the desk: your name, email address, phone number, financial details, and government-issued identification.</p>
    <h4>How we use it</h4>
    <ul>
      <li>Run and improve the trading platform</li>
      <li>Settle transactions and send you the records</li>
      <li>Send product email, only if you opt in</li>
      <li>Detect and stop fraudulent activity</li>
      <li>Meet our regulatory obligations</li>
    </ul>
    <h4>Who sees it</h4>
    <p>We do not sell personal information. We share it with service providers who help us operate, with regulators when required, and with an acquirer if the business transfers.</p>
    <h4>How we protect it</h4>
    <p>Data is encrypted in transit and at rest, and access is limited to staff who need it to do their job.</p>
    <h4>Your choices</h4>
    <p>You can access, correct, export, or delete your personal information, and unsubscribe from product email at any time.</p>
    <h4>Reach us</h4>
    <p>Email privacy@stakeglobal.com and we will respond within 30 days.</p>
  `;

  const termsContent = `
    <p><strong>Effective date:</strong> January 1, 2026</p>
    <p>These terms govern your use of the Stake Global Inc. platform. Opening an account means you accept them.</p>
    <h4>Who can open an account</h4>
    <p>You must be 18 or older and able to enter binding contracts where you live.</p>
    <h4>Your account</h4>
    <p>Keep your credentials private. Activity under your account is treated as yours, so tell us immediately if you suspect someone else has access.</p>
    <h4>Trading risk</h4>
    <p>Equities trading carries a substantial risk of loss and is not suitable for every investor. You trade at your own risk and remain responsible for every order you or your agents place.</p>
    <h4>Fees</h4>
    <p>Equities trades carry no commission. Some services — wire transfers, paper statements, regulatory pass-through charges — do carry a fee. The current schedule is published on our site.</p>
    <h4>What you may not do</h4>
    <p>No market manipulation, no fraudulent activity, and nothing that breaks the law or exchange rules.</p>
    <h4>Ending the relationship</h4>
    <p>You can close your account at any time. We may suspend or close an account for a breach of these terms or for activity we are required to escalate.</p>
    <h4>Limits on our liability</h4>
    <p>We are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.</p>
  `;

  const risksContent = `
    <p><strong>Last updated:</strong> January 1, 2026</p>
    <p>Read this before you place your first order. Every item below can cost you money.</p>
    <h4>Market risk</h4>
    <p>Prices move with market conditions, the economy, and company news. You can lose part or all of the capital you commit.</p>
    <h4>Liquidity risk</h4>
    <p>Some securities are hard to sell quickly at a fair price, and spreads widen fastest exactly when you most want out.</p>
    <h4>Volatility risk</h4>
    <p>Prices can move sharply in seconds. Rapid moves produce outsized losses, especially on margin.</p>
    <h4>Automated trading risk</h4>
    <p>Autonomous agents act on algorithms and historical data. Past performance does not predict future results, and a strategy that worked in one market regime can fail in the next. Limits and stop-losses reduce exposure but cannot eliminate it.</p>
    <h4>We do not advise</h4>
    <p>Stake Global Inc. does not give investment advice. Every decision on this platform is yours.</p>
  `;

  const supportContent = `
    <h4>Reach the desk</h4>
    <p>Support is staffed 24 hours a day, five days a week, tracking the US market week.</p>
    <h4>Channels</h4>
    <ul>
      <li><strong>Email</strong> — support@stakeglobal.com</li>
      <li><strong>Live chat</strong> — in the trading terminal, bottom right</li>
      <li><strong>Help centre</strong> — documentation and guided tours</li>
    </ul>
    <h4>When to expect a reply</h4>
    <p>Within two hours during market hours, within 24 hours at weekends. Anything touching an open position is escalated first.</p>
  `;

  const modalConfig = {
    faq: {
      icon: <HelpCircle size={20} color="var(--mint-text)" />,
      title: "Common questions",
      subtitle: "Help",
      content: (
        <div className="stake-faq">
          {[
            {
              q: "What is Stake?",
              a: "A US equities trading terminal with Level 2 market depth, fast order routing, an integrated cash wallet, and an optional autonomous trading agent.",
            },
            {
              q: "How does the autonomous agent work?",
              a: "The agent watches order flow and price anomalies against a strategy you pick — Dip Buyer, Momentum Breakout, or Value DCA. You set the capital limit and can pause it mid-session; it never exceeds the allocation you give it.",
            },
            {
              q: "How do I add funds?",
              a: "Deposit through the unified wallet, then assign a capital pool to any agent strategy. Allocations, positions, and the full ledger stay visible in one place.",
            },
            {
              q: "Does it work on mobile?",
              a: "Yes. The terminal is responsive down to phone widths, with the same charts, order entry, and live quotes as the desktop layout.",
            },
          ].map((f, i) => (
            <FaqItem key={i} id={i} q={f.q} a={f.a} />
          ))}
        </div>
      ),
    },
    privacy: {
      icon: <FileText size={20} color="var(--mint-text)" />,
      title: "Privacy policy",
      subtitle: "Legal",
      content: <div dangerouslySetInnerHTML={{ __html: privacyContent }} />,
    },
    terms: {
      icon: <Scale size={20} color="var(--mint-text)" />,
      title: "Terms of service",
      subtitle: "Legal",
      content: <div dangerouslySetInnerHTML={{ __html: termsContent }} />,
    },
    risks: {
      icon: <AlertTriangle size={20} color="var(--mint-text)" />,
      title: "Risk disclosures",
      subtitle: "Important",
      content: <div dangerouslySetInnerHTML={{ __html: risksContent }} />,
    },
    support: {
      icon: <MessageCircle size={20} color="var(--mint-text)" />,
      title: "Support",
      subtitle: "Help centre",
      content: <div dangerouslySetInnerHTML={{ __html: supportContent }} />,
    },
  };

  const currentModal = activeModal ? modalConfig[activeModal] : null;
  const heroStock = liveStocks[0] || FALLBACK_STOCKS[0];

  return (
    <div className="stake-landing-root">
      {/* ===================================================================
          HERO — argument on the left, live market microstructure on the right
          =================================================================== */}
      <section className="stake-hero-section">
        <header className="stake-landing-nav">
          <button
            id="landing-logo"
            type="button"
            className="stake-nav-mark"
            onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
            title="Stake Global Equities"
          >
            <Logo size={32} textSize={20} dark />
          </button>

          <div className="stake-landing-nav-actions">
            <button
              id="landing-header-login-btn"
              type="button"
              onClick={handleOpenLogin}
              className="stake-glass-button stake-glass-button-quiet"
            >
              Log in
            </button>
            <button
              id="landing-header-signup-btn"
              type="button"
              onClick={handleOpenSignup}
              className="stake-glass-button stake-glass-button-primary"
            >
              Get started <ArrowRight size={15} />
            </button>
          </div>
        </header>

        <div className="stake-hero-grid">
          <div className="stake-hero-copy">
            <h1 className="stake-hero-title">
              <span className="stake-line">Invest with precision.</span>
              <span className="stake-line">
                <em>Equities powered by AI.</em>
              </span>
            </h1>

            <p className="stake-hero-subtitle">
              Trade US equities on live order flow with zero commission — or hand the desk to an
              autonomous agent that works your strategy while the market moves.
            </p>

            <div className="stake-hero-actions">
              <button id="hero-start-trading-btn" className="stake-btn-mint" onClick={handleOpenSignup}>
                Start trading <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <OrderBookPanel stock={heroStock} reduced={reduced} />
        </div>
      </section>

      {/* =================================================================== */}
      <div className="stake-content-section">
        {/* The proof figures open the white page rather than crowding the hero. */}
        <dl className="stake-proof-strip">
          {[
            ["$0.00", "Commission per trade"],
            ["T+1", "Settlement cycle"],
            ["24/5", "Desk coverage"],
            ["Level 2", "Depth included"],
          ].map(([val, key]) => (
            <div className="stake-proof-item" key={key}>
              <dt className="stake-proof-val">{val}</dt>
              <dd className="stake-proof-key">{key}</dd>
            </div>
          ))}
        </dl>
        {/* Terminal snapshot */}
        <section id="live-terminal" className="stake-section" style={{ scrollMarginTop: 20 }}>
          <Reveal className="stake-term">
            <div className="stake-term-bar">
              <span style={{ display: "flex", alignItems: "center" }}>
                <span className="stake-term-dots" aria-hidden="true">
                  <span className="stake-term-dot" style={{ background: "#ff5f56" }} />
                  <span className="stake-term-dot" style={{ background: "#ffbd2e" }} />
                  <span className="stake-term-dot" style={{ background: "#00E599" }} />
                </span>
                Stake terminal · live feed
              </span>
              <span className="stake-live">
                <span className="stake-live-dot" aria-hidden="true" />
                Real-time stream
              </span>
            </div>

            <div className="stake-term-body">
              <div className="stake-term-top">
                <div>
                  <div className="stake-stat-key">Global market condition</div>
                  <div className="stake-index-val">
                    {index.val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span>S&amp;P 500 / Nasdaq</span>
                  </div>
                  <div className="stake-index-move">
                    <span>
                      ▲ +{fmt(index.chg)} (+{pct(index.pct)}%) today
                    </span>
                    <span style={{ color: "var(--fog-dim)" }}>·</span>
                    <span style={{ color: "var(--mint-bright)" }}>Risk-on bullish flow</span>
                  </div>
                </div>

                <div className="stake-stat-row">
                  {[
                    ["Market breadth", "82% advancing", "var(--mint)"],
                    ["24h volume", "$448.2B", "#fff"],
                    ["VIX volatility", "13.85 low", "var(--sky)"],
                  ].map(([k, v, c]) => (
                    <div className="stake-stat" key={k}>
                      <div className="stake-stat-key">{k}</div>
                      <div className="stake-stat-val" style={{ color: c }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stake-quote-grid">
                {liveStocks.slice(0, 4).map((s, i) => (
                  <Reveal key={s.ticker} delay={i}>
                    <button className="stake-quote" onClick={handleEnter} type="button">
                      <span>
                        <span className="stake-quote-sym">{s.ticker}</span>
                        <span className="stake-quote-name" style={{ display: "block" }}>
                          {s.name}
                        </span>
                      </span>
                      <span>
                        <span className="stake-quote-px" style={{ display: "block" }}>
                          ${fmt(s.price)}
                        </span>
                        <span
                          className={`stake-quote-chg ${s.change >= 0 ? "stake-up" : "stake-down"}`}
                          style={{ display: "block" }}
                        >
                          {s.change >= 0 ? "+" : ""}
                          {pct(s.change)}%
                        </span>
                      </span>
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Agentic showcase */}
        <div id="agentic-platform">
          <AgenticShowcaseCards onGetStarted={handleOpenSignup} />
        </div>

        {/* Execution engine */}
        <section className="stake-section stake-band">
          <Reveal className="stake-section-head stake-section-head-center">
            <div className="stake-eyebrow" style={{ justifyContent: "center" }}>
              <Zap size={13} /> Live terminal benchmark
            </div>
            <h2 className="stake-section-title">High-speed execution engine</h2>
            <p className="stake-section-lede">
              Direct access to live order flow, sub-second routing, and interactive charts you can
              scrub tick by tick.
            </p>
          </Reveal>

          <Reveal delay={1} style={{ maxWidth: 1040, margin: "0 auto" }}>
            <MarketMainChart height={260} />
          </Reveal>
        </section>

        {/* Market table */}
        <section id="markets" className="stake-section">
          <Reveal
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 26,
            }}
          >
            <div>
              <div className="stake-eyebrow">
                <Activity size={13} /> Live market highlights
              </div>
              <h2 className="stake-section-title">Active market scrips</h2>
            </div>
            <button className="stake-btn-light" onClick={handleEnter}>
              View full market grid <ChevronRight size={15} />
            </button>
          </Reveal>

          <Reveal delay={1} className="stake-table-wrap">
            <div className="stake-table-scroll">
              <table className="stake-table">
                <thead>
                  <tr>
                    <th>Scrip / company</th>
                    <th>Sector</th>
                    <th>LTP</th>
                    <th>24h change</th>
                    <th>Volume</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStocks.slice(0, 10).map((s) => (
                    <tr key={s.ticker}>
                      <td>
                        <div className="stake-cell-sym">{s.ticker}</div>
                        <div className="stake-cell-name">{s.name}</div>
                      </td>
                      <td>{s.sector}</td>
                      <td className="stake-num" style={{ fontWeight: 700, color: "var(--text-1)" }}>
                        ${fmt(s.price)}
                      </td>
                      <td>
                        <span className={`stake-chip ${s.change >= 0 ? "up" : "down"}`}>
                          {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {s.change >= 0 ? "+" : ""}
                          {pct(s.change)}%
                        </span>
                      </td>
                      <td className="stake-num">{s.volume}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="stake-trade-btn" onClick={handleEnter}>
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        {/* Onboarding — a genuine sequence, so the numbering carries meaning */}
        <section className="stake-section stake-band">
          <Reveal className="stake-section-head stake-section-head-center">
            <div className="stake-eyebrow" style={{ justifyContent: "center" }}>
              Onboarding
            </div>
            <h2 className="stake-section-title">From signup to first fill</h2>
            <p className="stake-section-lede">Three steps, in order. Most accounts clear step three the same day.</p>
          </Reveal>

          <div className="stake-steps">
            {[
              [
                "Step 01",
                "Open your account",
                "Sign up with an email address and get a simulated balance wired to live market data — no deposit needed to look around.",
              ],
              [
                "Step 02",
                "Fund the wallet",
                "Move cash in through the unified wallet. Every deposit, fill, and fee lands on one ledger you can audit line by line.",
              ],
              [
                "Step 03",
                "Trade, or delegate",
                "Place market and limit orders yourself, or allocate capital to an agent strategy and set the ceiling it cannot cross.",
              ],
            ].map(([n, h, p], i) => (
              <Reveal key={n} delay={i}>
                <div className="stake-step">
                  <div className="stake-step-n">{n}</div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="stake-section stake-section-tight">
          <Reveal className="stake-cta">
            <span className="stake-pill">
              <Shield size={13} /> Zero commission · institutional speed
            </span>
            <h2 className="stake-cta-title">Ready to take control of your financial future?</h2>
            <p className="stake-cta-lede">
              Join traders running US equities on Stake with sub-second execution, autonomous
              strategies, and no commission on the trade.
            </p>
            <div className="stake-cta-actions">
              <button className="stake-btn-mint" onClick={handleOpenSignup}>
                Create your account <ArrowRight size={18} />
              </button>
              <button
                className="stake-glass-button stake-glass-button-quiet"
                onClick={() => setActiveModal("faq")}
              >
                <HelpCircle size={16} /> Common questions
              </button>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="stake-footer">
          <div className="stake-footer-inner">
            <div className="stake-footer-top">
              <button
                type="button"
                className="stake-nav-mark"
                onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
                title="Stake Global Equities"
              >
                <Logo size={28} textSize={20} dark />
              </button>

              <nav className="stake-footer-links">
                {[
                  ["faq", <HelpCircle size={14} key="i" />, "Questions"],
                  ["privacy", <FileText size={14} key="i" />, "Privacy"],
                  ["terms", <Scale size={14} key="i" />, "Terms"],
                  ["risks", <AlertTriangle size={14} key="i" />, "Risk disclosures"],
                  ["support", <MessageCircle size={14} key="i" />, "Support"],
                ].map(([key, icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="stake-footer-link"
                    onClick={() => setActiveModal(key)}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="stake-footer-fine">
              <p>© 2026 Stake Global Inc. All rights reserved. Self-directed equities trading platform.</p>
              <p>
                Fractional share trading lets you buy part of a share. System response and execution
                times vary with market conditions, volatility, and order routing.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* ===================================================================
          MODAL — shared by FAQ, privacy, terms, risks and support
          =================================================================== */}
      {activeModal && currentModal && (
        <div className="stake-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="stake-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stake-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stake-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {currentModal.icon}
                <div>
                  <div className="stake-modal-eyebrow">{currentModal.subtitle}</div>
                  <h3 className="stake-modal-title" id="stake-modal-title">
                    {currentModal.title}
                  </h3>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="stake-modal-close"
                aria-label="Close"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="stake-modal-body">{currentModal.content}</div>

            {activeModal === "faq" && (
              <div className="stake-modal-foot">
                <p>Still stuck? Open the terminal and the live chat is bottom right.</p>
                <button
                  className="stake-btn-mint"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setActiveModal(null);
                    handleEnter();
                  }}
                >
                  Open the terminal <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const IndexPage = LandingPage;
