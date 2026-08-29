import { useState, useEffect } from "react";
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
  Plus,
  Minus,
  FileText,
  Scale,
  AlertTriangle,
  MessageCircle,
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

function FaqItem({ q, a }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        background: isOpen ? "#f8fafc" : "#ffffff",
        transition: "all 0.15s ease",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: "none",
          border: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontSize: 14.5,
          fontWeight: 700,
          color: "#191c1e",
          textAlign: "left",
          gap: 8,
          fontFamily: "var(--font-body)",
        }}
      >
        <span>{q}</span>
        <span style={{ color: "#00E599", flexShrink: 0 }}>
          {isOpen ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 18px 16px", fontSize: 13.5, color: "#475569", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
          {a}
        </div>
      )}
    </div>
  );
}

export function LandingPage({
  onOpenLogin,
  onOpenSignup,
  onOpenAuth,
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [liveStocks, setLiveStocks] = useState(FALLBACK_STOCKS);

  // Fetch real-time stock data from API
  useEffect(() => {
    let isMounted = true;
    const loadStocks = async () => {
      try {
        const data = await fetchStocks();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          const formatted = data.map((s) => ({
            ticker: s.ticker || s.symbol,
            name: s.name || s.companyName || s.ticker,
            price: Number(s.price || s.ltp || s.currentPrice || 100),
            change: Number(s.change || s.changePercent || (s.price && s.prevClose ? (((s.price - s.prevClose) / s.prevClose) * 100).toFixed(2) : 1.25)),
            sector: s.sector || "Equities",
            volume: s.volume ? (typeof s.volume === "number" ? `${(s.volume / 1e6).toFixed(1)}M` : s.volume) : "24.5M",
          }));
          setLiveStocks(formatted);
        }
      } catch (err) {
        console.warn("Could not pull live landing stocks:", err);
      }
    };

    loadStocks();
    const interval = setInterval(loadStocks, 15000); // Polling every 15s for live updates
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpenLogin = () => {
    if (onOpenLogin) onOpenLogin();
    else if (onOpenAuth) onOpenAuth("login");
  };

  const handleOpenSignup = () => {
    if (onOpenSignup) onOpenSignup();
    else if (onOpenAuth) onOpenAuth("signup");
  };

  const handleEnter = () => {
    if (onOpenSignup) onOpenSignup();
    else if (onOpenAuth) onOpenAuth("signup");
    else if (onOpenLogin) onOpenLogin();
  };

  const privacyContent = `
    <p><strong>Effective Date:</strong> January 1, 2026</p>
    <p>At Stake Global Inc., we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading platform.</p>
    
    <h4>Information We Collect</h4>
    <p>We collect personal information you provide directly to us, such as when you create an account, deposit funds, or contact support. This may include your name, email address, phone number, financial information, and government-issued identification.</p>
    
    <h4>How We Use Your Information</h4>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Provide, maintain, and improve our trading services</li>
      <li>Process transactions and send related information</li>
      <li>Send promotional communications (with your consent)</li>
      <li>Monitor and analyze trends, usage, and activities</li>
      <li>Detect, investigate, and prevent fraudulent transactions</li>
      <li>Comply with legal obligations</li>
    </ul>
    
    <h4>Information Sharing</h4>
    <p>We do not sell your personal information. We may share your information with service providers, regulatory authorities, and in connection with business transfers.</p>
    
    <h4>Data Security</h4>
    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
    
    <h4>Your Rights</h4>
    <p>You have the right to access, correct, or delete your personal information. You may also opt-out of promotional communications at any time.</p>
    
    <h4>Contact Us</h4>
    <p>If you have questions about this Privacy Policy, please contact us at privacy@stakeglobal.com</p>
  `;

  const termsContent = `
    <p><strong>Effective Date:</strong> January 1, 2026</p>
    <p>These Terms of Service govern your access to and use of the Stake Global Inc. trading platform and services.</p>
    
    <h4>Acceptance of Terms</h4>
    <p>By accessing or using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
    
    <h4>Eligibility</h4>
    <p>You must be at least 18 years old and have the legal capacity to enter into binding contracts to use our services.</p>
    
    <h4>Account Responsibilities</h4>
    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
    
    <h4>Trading Risks</h4>
    <p>Equities trading involves substantial risk of loss and is not suitable for every investor. You acknowledge that you trade at your own risk.</p>
    
    <h4>Fees and Commissions</h4>
    <p>While we offer zero-commission trading, certain fees may apply for specific services. Current fee schedules are available on our website.</p>
    
    <h4>Prohibited Conduct</h4>
    <p>You agree not to engage in market manipulation, fraudulent activities, or any conduct that violates applicable laws or regulations.</p>
    
    <h4>Termination</h4>
    <p>We reserve the right to suspend or terminate your account at our discretion for violation of these terms or suspicious activity.</p>
    
    <h4>Limitation of Liability</h4>
    <p>Stake Global Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>
  `;

  const risksContent = `
    <p><strong>Last Updated:</strong> January 1, 2026</p>
    <p>Investing in securities involves significant risks. Before trading, please carefully consider the following risk disclosures:</p>
    
    <h4>Market Risk</h4>
    <p>The value of your investments may fluctuate due to market conditions, economic factors, and company-specific events. You may lose part or all of your invested capital.</p>
    
    <h4>Liquidity Risk</h4>
    <p>Certain securities may be difficult to sell quickly at a fair price, especially during periods of market volatility.</p>
    
    <h4>Volatility Risk</h4>
    <p>Stock prices can be highly volatile. Rapid price movements may result in significant losses, particularly when using leverage or trading on margin.</p>
    
    <h4>AI Trading Risk</h4>
    <p>Autonomous AI trading agents operate based on algorithms and quantitative historical data. Past performance does not guarantee future results, and AI strategies may underperform in certain market regimes.</p>
    
    <h4>No Investment Advice</h4>
    <p>Stake Global Inc. does not provide investment advice. All trading decisions are made by you at your own discretion and risk.</p>
  `;

  const supportContent = `
    <h4>Contact Our Support Team</h4>
    <p>Our dedicated support team is available 24/5 to assist you with any questions or concerns.</p>
    
    <h4>Support Channels</h4>
    <ul>
      <li><strong>Email:</strong> support@stakeglobal.com</li>
      <li><strong>Live Chat:</strong> Available directly within the trading terminal</li>
      <li><strong>Help Center:</strong> Comprehensive documentation and interactive tours</li>
    </ul>
    
    <h4>Response Times</h4>
    <p>We strive to respond to all inquiries within 2 hours during market hours and within 24 hours on weekends.</p>
  `;

  const modalConfig = {
    faq: {
      icon: <HelpCircle size={20} color="#00E599" />,
      title: "Frequently Asked Questions",
      subtitle: "HELP & ANSWERS",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              q: "What is Stake AI Equities Platform?",
              a: "Stake AI is a high-speed equities trading terminal equipped with autonomous AI trading intelligence, real-time Level 2 market depth, fast order execution, and integrated cash wallet clearing.",
            },
            {
              q: "How does the Autonomous Stake AI Agent work?",
              a: "The Stake AI Trading Agent continuously scans order flow and market price anomalies. You can select custom quantitative strategies (such as Dip Buyer, Momentum Breakout, or Value DCA), set capital deployment limits, and activate or pause autonomous executions in real time.",
            },
            {
              q: "How do I deposit or deploy capital?",
              a: "You can deposit instant collateral using the unified wallet, deploy custom capital allocation pools into Stake AI strategies, and manage positions with full transparency and safety rollbacks.",
            },
            {
              q: "Is Stake AI compatible with mobile and desktop?",
              a: "Yes! Stake AI features a responsive, desktop-first and mobile-optimized interface with smooth interactive charts, quick order execution, and live tickers.",
            },
          ].map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      ),
    },
    privacy: {
      icon: <FileText size={20} color="#00E599" />,
      title: "Privacy Policy",
      subtitle: "LEGAL",
      content: (
        <div
          style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, fontFamily: "var(--font-body)" }}
          dangerouslySetInnerHTML={{ __html: privacyContent }}
        />
      ),
    },
    terms: {
      icon: <Scale size={20} color="#00E599" />,
      title: "Terms of Service",
      subtitle: "LEGAL",
      content: (
        <div
          style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, fontFamily: "var(--font-body)" }}
          dangerouslySetInnerHTML={{ __html: termsContent }}
        />
      ),
    },
    risks: {
      icon: <AlertTriangle size={20} color="#00E599" />,
      title: "Risk Disclosures",
      subtitle: "IMPORTANT",
      content: (
        <div
          style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, fontFamily: "var(--font-body)" }}
          dangerouslySetInnerHTML={{ __html: risksContent }}
        />
      ),
    },
    support: {
      icon: <MessageCircle size={20} color="#00E599" />,
      title: "Support & Assistance",
      subtitle: "HELP CENTER",
      content: (
        <div
          style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, fontFamily: "var(--font-body)" }}
          dangerouslySetInnerHTML={{ __html: supportContent }}
        />
      ),
    },
  };

  const currentModal = activeModal ? modalConfig[activeModal] : null;

  return (
    <div className="stake-landing-root">
      {/* =========================================================================
          HERO SECTION - #15F7A6 Green Animated Cyber Field
          ========================================================================= */}
      <section className="stake-hero-section">
        {/* Top Navbar */}
        <header className="stake-landing-nav">
          {/* Logo */}
          <div
            id="landing-logo"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Stake Global Equities"
          >
            <Logo size={32} textSize={20} dark={true} />
          </div>

          {/* Action Buttons */}
          <div className="stake-landing-nav-actions">
            <button
              id="landing-header-login-btn"
              type="button"
              onClick={handleOpenLogin}
              className="stake-glass-button stake-glass-button-quiet"
            >
              Log In
            </button>

            <button
              id="landing-header-signup-btn"
              type="button"
              onClick={handleOpenSignup}
              className="stake-glass-button stake-glass-button-primary"
            >
              Get Started <ArrowRight size={15} />
            </button>
          </div>
        </header>

        {/* Brand New Green Animated Cyber Beams */}
        <div className="stake-hero-bg-animation">
          <div className="stake-hero-energy-beam beam-1" />
          <div className="stake-hero-energy-beam beam-2" />
          <div className="stake-hero-energy-beam beam-3" />
          <div className="stake-hero-energy-beam beam-4" />
        </div>

        {/* Brand New Green Animated Radar Nodes */}
        <div className="stake-hero-radar-nodes">
          <div className="stake-radar-circle radar-1" />
          <div className="stake-radar-circle radar-2" />
          <div className="stake-radar-circle radar-3" />
        </div>

        {/* Center Hero Content */}
        <div className="stake-hero-center">

          <h1 className="stake-hero-title">
            Invest with precision.<br />
            <em>Equities powered by AI.</em>
          </h1>

          <p className="stake-hero-subtitle">
            Trade US equities with real-time order flow and zero commissions, or deploy the autonomous Stake AI agent to continuously navigate market opportunities.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button
              id="hero-start-trading-btn"
              className="stake-btn-mint"
              onClick={handleOpenLogin}
            >
              Start Trading Now <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Bottom subtle indicator */}
        <div style={{ textAlign: "center", zIndex: 10, paddingBottom: 16 }}>
          <button
            id="landing-scroll-explore-btn"
            onClick={() => {
              const el = document.getElementById("live-terminal");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s ease",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00E599")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <span>Scroll for live markets</span>
            <ChevronDown size={15} />
          </button>
        </div>
      </section>

      {/* =========================================================================
          CONTENT SECTION
          ========================================================================= */}
      <div className="stake-content-section">
        {/* Interactive Live Terminal Card Mockup */}
        <section id="live-terminal" style={{ maxWidth: 1240, margin: "0 auto", padding: "56px 24px 40px", scrollMarginTop: "20px" }}>
          <div
            style={{
              background: "#04140b",
              borderRadius: 24,
              border: "1px solid rgba(0, 229, 153, 0.25)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.45), 0 0 30px rgba(0, 229, 153, 0.08)",
              overflow: "hidden",
              color: "#ffffff",
            }}
          >
            {/* Terminal Window Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 28px",
                background: "rgba(0,0,0,0.5)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00E599" }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#94a3b8", marginLeft: 14, letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                  STAKE TERMINAL • LIVE FEED
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#00E599", fontFamily: "var(--font-mono)" }}>
                <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse inline-block" /> REAL-TIME STREAM
              </div>
            </div>

            {/* Terminal Card Body */}
            <div style={{ padding: "36px 40px 40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    GLOBAL MARKET CONDITION
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: 6, letterSpacing: "-0.02em" }}>
                    5,964.80 <span style={{ fontSize: 16, color: "#94a3b8", fontWeight: 600 }}>S&P 500 / NASDAQ</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#00E599", display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontFamily: "var(--font-mono)" }}>
                    <span>▲ +84.20 (+1.43%) today</span>
                    <span style={{ color: "#64748b" }}>•</span>
                    <span style={{ color: "#a7f3d0" }}>Risk-On Bullish Flow</span>
                  </div>
                </div>

                {/* Market Breadth & Turnover Badges */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>MARKET BREADTH</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#00E599", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      82% Advancing (4.1:1)
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>24H VOLUME</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      $ 448.2 B
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>VIX VOLATILITY</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      13.85 (Low)
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Stock Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
                {liveStocks.slice(0, 4).map((s) => (
                  <div
                    key={s.ticker}
                    onClick={handleEnter}
                    style={{
                      padding: "18px 22px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 16,
                      border: "1px solid rgba(0, 229, 153, 0.15)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    className="hover:border-[#00E599] hover:bg-white/[0.08]"
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>{s.ticker}</div>
                      <div style={{ fontSize: 12.5, color: "#94a3b8", fontFamily: "var(--font-body)", marginTop: 2 }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono)" }}>${fmt(s.price)}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: s.change >= 0 ? "#00E599" : "#f87171", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                        {s.change >= 0 ? "+" : ""}{s.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            AGENTIC SHOWCASE CARDS
            ========================================================================= */}
        <div id="agentic-platform">
          <AgenticShowcaseCards onGetStarted={handleOpenSignup} />
        </div>

        {/* High-Speed Execution Engine Section */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(21,247,166,0.12)", color: "#065f46", fontSize: 12, fontWeight: 800, marginBottom: 8, fontFamily: "var(--font-body)" }}>
              <Zap size={14} className="text-[#00E599]" /> LIVE TERMINAL BENCHMARK
            </div>
            <h2 className="stake-section-title" style={{ textAlign: "center" }}>
              High-Speed Execution Engine
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0, fontFamily: "var(--font-body)" }}>
              Direct access to live order flow, sub-second routing, and real-time interactive charts.
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 1040, margin: "0 auto" }}>
            <MarketMainChart height={260} />
          </div>
        </section>

        {/* Top Traded Scrips Table Section - Dynamic API Data */}
        <section
          id="markets"
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            padding: "54px 24px",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#00E599", letterSpacing: "0.08em", fontFamily: "var(--font-body)" }}>
                  LIVE MARKET HIGHLIGHTS (API STREAM)
                </div>
                <h2 className="stake-section-title" style={{ margin: "4px 0 0" }}>
                  Active Market Scrips
                </h2>
              </div>
              <button
                onClick={handleEnter}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#191c1e",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-body)",
                }}
              >
                View Full Market Grid <ChevronRight size={15} />
              </button>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 18,
                border: "1px solid #e2e8f0",
                overflowX: "auto",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, textAlign: "left", fontFamily: "var(--font-body)" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "14px 20px" }}>SCRIP / COMPANY</th>
                    <th style={{ padding: "14px 20px" }}>SECTOR</th>
                    <th style={{ padding: "14px 20px" }}>LTP ($)</th>
                    <th style={{ padding: "14px 20px" }}>24H CHANGE</th>
                    <th style={{ padding: "14px 20px" }}>VOLUME</th>
                    <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStocks.slice(0, 10).map((s) => (
                    <tr key={s.ticker} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: 800, color: "#191c1e", fontFamily: "var(--font-mono)" }}>{s.ticker}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{s.name}</div>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#475569", fontWeight: 500 }}>{s.sector}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        $ {fmt(s.price)}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            background: s.change >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                            color: s.change >= 0 ? "#00E599" : "#b61722",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {s.change >= 0 ? "+" : ""}{s.change}%
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                        {s.volume}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <button
                          onClick={handleEnter}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "rgba(16,185,129,0.12)",
                            color: "#00E599",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3 Step Onboarding */}
        <section
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "60px 24px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#00E599", letterSpacing: "0.08em", fontFamily: "var(--font-body)" }}>
              SIMPLE ONBOARDING
            </div>
            <h2 className="stake-section-title" style={{ textAlign: "center" }}>
              Get Started in 3 Easy Steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00E599", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                01
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>
                Create Your Account
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)" }}>
                Sign up with your email or username and access instant simulated trading balances with live market data feeds.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00E599", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                02
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>
                Fund Unified Wallet
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)" }}>
                Deposit cash with our dedicated wallet portal supporting instant transfers and simulated ledger tracking.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00E599", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                03
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>
                Trade & Automate
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)" }}>
                Place direct Limit and Market orders or activate the AI Agent to continuously capture price momentum.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section
          style={{
            maxWidth: 1080,
            margin: "20px auto 60px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #04140b 0%, #062315 100%)",
              border: "1px solid rgba(0, 229, 153, 0.35)",
              borderRadius: 24,
              padding: "48px 40px",
              color: "#ffffff",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 229, 153, 0.15)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(0, 229, 153, 0.15)",
                color: "#00E599",
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 16,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body)",
              }}
            >
              <Shield size={14} /> ZERO COMMISSIONS • INSTITUTIONAL SPEED
            </div>

            <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>
              Ready to take control of your financial future?
            </h2>

            <p style={{ fontSize: 15.5, color: "#94a3b8", lineHeight: 1.6, maxWidth: 620, margin: "0 auto 28px", fontFamily: "var(--font-body)" }}>
              Join traders using Stake to trade US equities with sub-second execution, autonomous intelligence, and zero commissions.
            </p>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={handleOpenSignup}
                className="stake-btn-mint"
              >
                Create Account in 2 Minutes <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setActiveModal("faq")}
                className="stake-glass-button stake-glass-button-quiet"
              >
                <HelpCircle size={16} color="#00E599" /> Frequently Asked Questions
              </button>
            </div>
          </div>
        </section>

        {/* Institutional Dark Footer */}
        <footer
          style={{
            background: "#030a07",
            color: "#94a3b8",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "48px 36px 40px",
            textAlign: "left",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 20,
                paddingBottom: 24,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Stake Global Equities">
                <Logo size={28} textSize={20} dark={true} />
              </div>

              <div style={{ display: "flex", gap: 24, fontSize: 13.5, fontWeight: 600, color: "#cbd5e1", flexWrap: "wrap" }}>
                <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveModal("faq")}><HelpCircle size={14} /> FAQ</span>
                <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveModal("privacy")}><FileText size={14} /> Privacy Policy</span>
                <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveModal("terms")}><Scale size={14} /> Terms of Service</span>
                <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveModal("risks")}><AlertTriangle size={14} /> Risk Disclosures</span>
                <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveModal("support")}><MessageCircle size={14} /> Support</span>
              </div>
            </div>

            {/* Regulatory Disclaimer Text */}
            <div style={{ marginTop: 20, fontSize: 12, lineHeight: 1.7, color: "#64748b" }}>
              <p style={{ margin: "0 0 8px" }}>
                © 2026 Stake Global Inc. All rights reserved. Self-directed equities trading platform.
              </p>
              <p style={{ margin: 0 }}>
                Fractional share trading allows customers to buy fractional stock amounts. System response and execution times may vary based on market conditions, volatility, and order routing parameters.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MODAL DIALOG (Shared for FAQ, Privacy, Terms, Risks, Support)
          ========================================================================= */}
      {activeModal && currentModal && (
        <div className="stake-faq-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="stake-faq-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {currentModal.icon}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#00E599", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>
                    {currentModal.subtitle}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: "#191c1e", fontFamily: "var(--font-display)" }}>
                    {currentModal.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {currentModal.content}
            </div>

            {activeModal === "faq" && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", fontFamily: "var(--font-body)" }}>
                  Still have questions? Jump straight into the live terminal.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleEnter();
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    background: "#00E599",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Launch Terminal
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
