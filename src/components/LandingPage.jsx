import { useState } from "react";
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
} from "lucide-react";
import { Logo, MarketMainChart } from "./Charts";
import { AgenticShowcaseCards } from "./AgenticShowcaseCards";
import { LegalAndSupportModals } from "./LegalAndSupportModals";
import { fmt } from "../utils";
import "../styles/landing.css";

const HIGHLIGHT_STOCKS = [
  { ticker: "NVDA", name: "NVIDIA Corporation", price: 137.86, change: 2.14, sector: "Semiconductors & AI", volume: "48.2M" },
  { ticker: "AAPL", name: "Apple Inc.", price: 228.45, change: 1.12, sector: "Consumer Tech", volume: "32.0M" },
  { ticker: "TSLA", name: "Tesla Inc.", price: 248.50, change: -1.45, sector: "Automotive & Energy", volume: "64.5M" },
  { ticker: "MSFT", name: "Microsoft Corporation", price: 430.20, change: 0.85, sector: "Cloud & Software", volume: "18.9M" },
  { ticker: "AMZN", name: "Amazon.com Inc.", price: 186.40, change: 1.65, sector: "E-Commerce & Cloud", volume: "26.1M" },
  { ticker: "META", name: "Meta Platforms", price: 580.40, change: 1.95, sector: "Social Media & AI", volume: "14.8M" },
];

export function LandingPage({
  onEnterApp,
  onOpenLogin,
  onOpenSignup,
  onOpenAuth,
}) {
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const handleOpenLogin = () => {
    if (onOpenLogin) onOpenLogin();
    else if (onOpenAuth) onOpenAuth("login");
  };

  const handleOpenSignup = () => {
    if (onOpenSignup) onOpenSignup();
    else if (onOpenAuth) onOpenAuth("signup");
  };

  const handleEnter = () => {
    if (onEnterApp) onEnterApp();
    else if (onOpenAuth) onOpenAuth("login");
  };

  const faqs = [
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
  ];

  return (
    <div className="stake-landing-root">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="stake-hero-section">
        {/* Top Navbar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 36px",
            width: "100%",
            boxSizing: "border-box",
            zIndex: 20,
          }}
        >
          {/* Logo */}
          <div style={{ cursor: "pointer" }} onClick={handleEnter}>
            <Logo size={34} textSize={22} dark={true} />
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              id="landing-header-login-btn"
              onClick={handleOpenLogin}
              style={{
                padding: "8px 22px",
                borderRadius: 9999,
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: "rgba(255, 255, 255, 0.06)",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-body)",
              }}
            >
              Log in
            </button>

            <button
              id="landing-header-signup-btn"
              onClick={handleOpenSignup}
              style={{
                padding: "8px 22px",
                borderRadius: 9999,
                border: "none",
                background: "#00e599",
                fontSize: 13.5,
                fontWeight: 700,
                color: "#06110c",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 4px 14px rgba(0, 229, 153, 0.25)",
                fontFamily: "var(--font-body)",
              }}
            >
              Get started
            </button>
          </div>
        </header>

        {/* Hero Centerpiece */}
        <div className="stake-hero-center" style={{ margin: "40px auto 30px" }}>
          <h1 className="stake-hero-title">
            Trade Global Equities.<br />
            Powered by Agentic AI.
          </h1>

          <p className="stake-hero-subtitle">
            Trade fractional US shares with zero commissions, real-time Level 2 order books, and autonomous AI agents designed to execute with algorithmic precision.
          </p>

          <div className="stake-hero-actions" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button id="hero-start-trading-btn" className="stake-btn-mint" onClick={handleOpenSignup}>
              Start Trading Now <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* Bottom subtle indicator */}
        <div style={{ textAlign: "center", zIndex: 10, paddingBottom: 12 }}>
          <button
            id="landing-scroll-explore-btn"
            onClick={() => {
              const el = document.getElementById("live-terminal");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.15s ease",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00e599")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <span>Scroll to explore</span>
            <ChevronDown size={15} />
          </button>
        </div>
      </section>

      {/* =========================================================================
          CONTENT SECTION
          ========================================================================= */}
      <div className="stake-content-section">
        {/* Interactive Live Terminal Card Mockup (Shows Global Market Condition) */}
        <section id="live-terminal" style={{ maxWidth: 1240, margin: "0 auto", padding: "56px 24px 40px", scrollMarginTop: "20px" }}>
          <div
            style={{
              background: "#081510",
              borderRadius: 24,
              border: "1px solid rgba(0,229,153,0.25)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
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
                background: "rgba(0,0,0,0.4)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginLeft: 14, letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                  STAKE TERMINAL • LIVE FEED
                </span>
              </div>
            </div>

            {/* Terminal Card Body - Market Condition Overview */}
            <div style={{ padding: "36px 40px 40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    GLOBAL MARKET CONDITION
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: 6, letterSpacing: "-0.02em" }}>
                    5,948.72 <span style={{ fontSize: 18, color: "#94a3b8", fontWeight: 600 }}>S&P 500 / NASDAQ</span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontFamily: "var(--font-mono)" }}>
                    <span>▲ +78.40 (+1.34%) today</span>
                    <span style={{ color: "#64748b" }}>•</span>
                    <span style={{ color: "#a7f3d0" }}>Risk-On Bullish Sentiment</span>
                  </div>
                </div>

                {/* Market Breadth & Turnover Badges */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>MARKET BREADTH</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      78% Advancing (3.5:1)
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>24H TURNOVER</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      $ 428.6 B
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: 14, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>VIX VOLATILITY</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      14.28 (Low)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Snapshot Grid (Global Market Leaders) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
                {[
                  { ticker: "NVDA", name: "NVIDIA Corp.", price: "$137.86", chg: "+2.84%", isUp: true, vol: "48.2M" },
                  { ticker: "AAPL", name: "Apple Inc.", price: "$228.45", chg: "+1.42%", isUp: true, vol: "32.0M" },
                  { ticker: "TSLA", name: "Tesla Inc.", price: "$248.50", chg: "+3.10%", isUp: true, vol: "64.5M" },
                  { ticker: "MSFT", name: "Microsoft Corp.", price: "$430.20", chg: "+0.85%", isUp: true, vol: "18.9M" },
                ].map((s) => (
                  <div
                    key={s.ticker}
                    style={{
                      padding: "18px 22px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>{s.ticker}</div>
                      <div style={{ fontSize: 12.5, color: "#94a3b8", fontFamily: "var(--font-body)", marginTop: 2 }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono)" }}>{s.price}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.chg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            AGENTIC SHOWCASE CARDS (LIGHT THEME)
            ========================================================================= */}
        <AgenticShowcaseCards onGetStarted={handleOpenSignup} />

        {/* High-Speed Execution Engine Section */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(16,185,129,0.1)", color: "#006c49", fontSize: 12, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-body)" }}>
              <Zap size={14} /> LIVE TERMINAL BENCHMARK
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

        {/* Top Traded Scrips Table Section */}
        <section
          id="markets"
          style={{
            background: "#f1f5f9",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            padding: "54px 24px",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#006c49", letterSpacing: "0.08em", fontFamily: "var(--font-body)" }}>
                  LIVE MARKET HIGHLIGHTS
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
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
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
                  {HIGHLIGHT_STOCKS.map((s) => (
                    <tr key={s.ticker} style={{ borderBottom: "1px solid #f1f5f9" }} className="menu-item-hover">
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
                            color: s.change >= 0 ? "#006c49" : "#b61722",
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
                            color: "#006c49",
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "#006c49", letterSpacing: "0.08em", fontFamily: "var(--font-body)" }}>
              SIMPLE ONBOARDING
            </div>
            <h2 className="stake-section-title" style={{ textAlign: "center" }}>
              Get Started in 3 Easy Steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#006c49", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                01
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>
                Create Your Account
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)" }}>
                Sign up with your username and access instant simulated trading balances with live market data feeds.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#006c49", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                02
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>
                Fund Wallet
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)" }}>
                Deposit cash with our dedicated wallet portal supporting instant simulated transfers and ledger tracking.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#006c49", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
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

        {/* Final CTA with Side FAQ Trigger Button */}
        <section
          style={{
            maxWidth: 1080,
            margin: "20px auto 60px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0e2a1e 0%, #061910 100%)",
              border: "1px solid rgba(0,229,153,0.3)",
              borderRadius: 24,
              padding: "48px 40px",
              color: "#ffffff",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 108, 73, 0.2)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(0,229,153,0.15)",
                color: "#00e599",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body)",
              }}
            >
              <Shield size={14} /> ZERO COMMISSIONS • INSTITUTIONAL SPEED
            </div>

            <h2 style={{ fontSize: 34, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>
              Ready to take control of your financial future?
            </h2>

            <p style={{ fontSize: 15.5, color: "#94a3b8", lineHeight: 1.6, maxWidth: 620, margin: "0 auto 28px", fontFamily: "var(--font-body)" }}>
              Join traders using Stake to build lasting wealth with institutional speed and zero commissions.
            </p>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={handleOpenSignup}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  borderRadius: 9999,
                  border: "none",
                  background: "#00e599",
                  color: "#06110c",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 24px rgba(0,229,153,0.35)",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-body)",
                }}
              >
                Create Account in 2 Minutes <ArrowRight size={18} />
              </button>

              {/* Side FAQ Trigger */}
              <button
                onClick={() => setIsFaqOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-body)",
                }}
              >
                <HelpCircle size={16} color="#00e599" /> Frequently Asked Questions
              </button>
            </div>
          </div>
        </section>

        {/* Institutional Dark Footer */}
        <footer
          style={{
            background: "#06110c",
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
              <Logo size={28} textSize={20} dark={true} />

              <div style={{ display: "flex", gap: 24, fontSize: 13.5, fontWeight: 600, color: "#cbd5e1", flexWrap: "wrap" }}>
                <span style={{ cursor: "pointer" }} onClick={() => setIsFaqOpen(true)}>FAQ</span>
                <span style={{ cursor: "pointer" }} onClick={() => setActiveLegalModal("privacy")}>Privacy Policy</span>
                <span style={{ cursor: "pointer" }} onClick={() => setActiveLegalModal("terms")}>Terms of Service</span>
                <span style={{ cursor: "pointer" }} onClick={() => setActiveLegalModal("risks")}>Risk Disclosures</span>
                <span style={{ cursor: "pointer" }} onClick={() => setActiveLegalModal("support")}>Support</span>
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
          LEGAL & SUPPORT MODAL DIALOGS
          ========================================================================= */}
      <LegalAndSupportModals
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        onOpenSignup={handleOpenSignup}
      />

      {/* =========================================================================
          SIDE-OPENING FAQ DRAWER
          ========================================================================= */}
      {isFaqOpen && (
        <div className="stake-faq-drawer-overlay" onClick={() => setIsFaqOpen(false)}>
          <div className="stake-faq-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#006c49", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>
                  HELP & ANSWERS
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: "#191c1e", fontFamily: "var(--font-display)" }}>
                  Frequently Asked Questions
                </h3>
              </div>
              <button
                onClick={() => setIsFaqOpen(false)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {faqs.map((f, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: activeFaq === i ? "#f8fafc" : "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
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
                    <span>{f.q}</span>
                    <span style={{ color: "#006c49", flexShrink: 0 }}>
                      {activeFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  {activeFaq === i && (
                    <div style={{ padding: "0 18px 16px", fontSize: 13.5, color: "#475569", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", fontFamily: "var(--font-body)" }}>
                Still have questions? Jump straight into the live terminal.
              </p>
              <button
                onClick={() => {
                  setIsFaqOpen(false);
                  handleEnter();
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#006c49",
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
          </div>
        </div>
      )}
    </div>
  );
}
