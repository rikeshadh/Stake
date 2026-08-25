import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Bot,
  Globe,
  BellRing,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Layers,
  HelpCircle,
} from "lucide-react";

export function InteractiveTour({
  isOpen,
  onClose,
  isGuest = false,
  onNavigateTab,
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: "welcome",
      title: isGuest ? "Welcome to Stake Guest Sandbox" : "Welcome to Stake Global Equities",
      badge: isGuest ? "SANDBOX MODE" : "INSTITUTIONAL PLATFORM",
      desc: isGuest
        ? "You've entered the risk-free paper trading sandbox with $100,000 in virtual collateral. Practice execution, test automated AI strategies, and explore global markets before trading live."
        : "Trade fractional US equities with zero commissions, institutional-grade analytics, and real-time streaming quotes from NYSE & NASDAQ.",
      icon: Sparkles,
      iconColor: "#00e599",
      accentBg: "rgba(0, 229, 153, 0.12)",
      targetFeature: "Market Feed & Live Overview",
      actionTab: "home",
    },
    {
      id: "markets",
      title: "Interactive Charts & Level 2 Depth",
      badge: "REAL-TIME DATA",
      desc: "Click on any stock to view historical trend lines powered by Recharts, switch between Smooth Line and Candlestick modes, inspect Level 2 order book liquidity, and analyze volume distributions.",
      icon: TrendingUp,
      iconColor: "#0284c7",
      accentBg: "rgba(2, 132, 199, 0.12)",
      targetFeature: "Markets & Chart Analytics",
      actionTab: "market",
    },
    {
      id: "orderdesk",
      title: "Instant Order Desk & Fractional Trading",
      badge: "ONE-CLICK EXECUTION",
      desc: "Execute Market or Limit orders instantly. Buy fractional shares by entering exact dollar amounts or share quantities with customizable DAY or GTC time-in-force validity.",
      icon: Layers,
      iconColor: "#10b981",
      accentBg: "rgba(16, 185, 129, 0.12)",
      targetFeature: "Quick Trade Desk",
      actionTab: "home",
    },
    {
      id: "agent",
      title: "Autonomous AI Quant Agent",
      badge: "AGENTIC AI",
      desc: "The autonomous agent runs algorithmic quant strategies like Momentum Breakout, VWAP Mean Reversion, and Growth Trend Following with strict stop-loss limits and automated capital allocation.",
      icon: Bot,
      iconColor: "#8b5cf6",
      accentBg: "rgba(139, 92, 246, 0.12)",
      targetFeature: "Autonomous Trading Engine",
      actionTab: "agent",
    },
    {
      id: "currency",
      title: "Multi-Currency Collateral & Instant Wallet",
      badge: "USD & NPR DUAL-CURRENCY",
      desc: "Seamlessly convert your account display and collateral between US Dollars ($) and Nepalese Rupees (Rs). Manage instant deposits, collateral balances, and track live transaction receipts.",
      icon: Globe,
      iconColor: "#f59e0b",
      accentBg: "rgba(245, 158, 11, 0.12)",
      targetFeature: "Multi-Currency Wallet",
      actionTab: "portfolio",
    },
    {
      id: "alerts",
      title: "Smart Watchlists & Breakout Alerts",
      badge: "SMART MONITORING",
      desc: "Add stocks to your custom watchlist and set automated price breakout alerts with notifications to capture high-probability trade setups the moment they trigger.",
      icon: BellRing,
      iconColor: "#06b6d4",
      accentBg: "rgba(6, 182, 212, 0.12)",
      targetFeature: "Watchlists & Alerts",
      actionTab: "home",
    },
  ];

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem("stake_tutorial_completed", "true");
    } catch {
      // ignore
    }
    onClose();
  }, [onClose]);

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem("stake_tutorial_completed", "true");
    } catch {
      // ignore
    }
    if (onNavigateTab && steps[currentStep]?.actionTab) {
      onNavigateTab(steps[currentStep].actionTab);
    }
    onClose();
  }, [currentStep, onNavigateTab, onClose, steps]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      if (onNavigateTab && steps[nextIdx].actionTab) {
        onNavigateTab(steps[nextIdx].actionTab);
      }
    }
  }, [currentStep, isLast, handleComplete, onNavigateTab, steps]);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      if (onNavigateTab && steps[prevIdx].actionTab) {
        onNavigateTab(steps[prevIdx].actionTab);
      }
    }
  }, [currentStep, isFirst, onNavigateTab, steps]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSkip, handleNext, handlePrev]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <div
        id="stake-interactive-tour-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "rgba(5, 14, 10, 0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            width: "100%",
            maxWidth: 540,
            background: "#ffffff",
            borderRadius: 24,
            padding: "28px 30px",
            boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)",
            position: "relative",
            textAlign: "left",
          }}
        >
          {/* Close / Skip button */}
          <button
            id="tour-skip-x-btn"
            type="button"
            onClick={handleSkip}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "#f1f5f9",
              border: "none",
              borderRadius: 12,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.15s ease",
            }}
            title="Skip Walkthrough (Esc)"
          >
            <X size={17} />
          </button>

          {/* Step Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: step.accentBg,
                color: step.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 8px 20px ${step.accentBg}`,
              }}
            >
              <Icon size={26} />
            </div>
            <div style={{ paddingRight: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: step.iconColor,
                    background: step.accentBg,
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {step.badge}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  STEP {currentStep + 1} OF {steps.length}
                </span>
              </div>
              <h2
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "6px 0 0",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}
              >
                {step.title}
              </h2>
            </div>
          </div>

          {/* Step Body */}
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "#475569",
              margin: "0 0 24px",
            }}
          >
            {step.desc}
          </p>

          {/* Interactive Feature Focus Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              marginBottom: 22,
            }}
          >
            <HelpCircle size={15} className="text-emerald-600" />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Feature: <strong style={{ color: "#0f172a" }}>{step.targetFeature}</strong>
            </span>
          </div>

          {/* Step Progress Indicators */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentStep(idx);
                    if (onNavigateTab && steps[idx].actionTab) {
                      onNavigateTab(steps[idx].actionTab);
                    }
                  }}
                  style={{
                    width: currentStep === idx ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: currentStep === idx ? "#059669" : "#e2e8f0",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          {/* Step Footer Actions with Next & Skip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingTop: 8,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              id="tour-skip-text-btn"
              type="button"
              onClick={handleSkip}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: 8,
                transition: "color 0.15s ease",
              }}
            >
              Skip Walkthrough
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              {!isFirst && (
                <button
                  id="tour-prev-btn"
                  type="button"
                  onClick={handlePrev}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}

              <button
                id="tour-next-btn"
                type="button"
                onClick={handleNext}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{isLast ? "Start Trading" : "Next"}</span>
                {isLast ? <CheckCircle2 size={17} /> : <ChevronRight size={17} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

