import { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Bot,
  Wallet,
  Globe,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
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
      title: isGuest ? "Welcome to Guest Sandbox" : "Welcome to Stake Trading Platform",
      badge: isGuest ? "SANDBOX MODE" : "PRO TRADING",
      desc: isGuest
        ? "You are currently in a risk-free paper trading sandbox with $100,000 in virtual capital. Explore 200+ live US stocks and learn before trading live."
        : "Trade fractional US equities with zero commissions, institutional-grade analytics, and real-time live streaming quotes from NYSE & NASDAQ.",
      icon: Sparkles,
      iconColor: "#10b981",
      actionLabel: "Explore Markets",
      actionTab: "market",
    },
    {
      title: "Interactive Charts & Recharts Trend Lines",
      badge: "LIVE DATA",
      desc: "Click on any stock to view historical trend lines powered by Recharts, switch between Smooth Line and Candlestick modes, inspect volume histograms, and set custom price alerts.",
      icon: TrendingUp,
      iconColor: "#0284c7",
      actionLabel: "View Markets Explorer",
      actionTab: "market",
    },
    {
      title: "Global Multi-Currency Conversion",
      badge: "NPR & USD",
      desc: "Toggle seamlessly between US Dollar ($) and Nepalese Rupee (Rs) in Settings. Every stock price, holding valuation, order total, and collateral balance automatically recalculates instantly.",
      icon: Globe,
      iconColor: "#f59e0b",
      actionLabel: "Check Portfolio",
      actionTab: "portfolio",
    },
    {
      title: "Autonomous AI Quant Agent (Manual & Off by Default)",
      badge: "AI ENGINE",
      desc: "The AI agent is disabled by default in both guest and live accounts so you retain total control. When you're ready, activate strategies like Momentum Breakout or VWAP Mean Reversion with backtested alpha.",
      icon: Bot,
      iconColor: "#8b5cf6",
      actionLabel: "Inspect Agent Engine",
      actionTab: "agent",
    },
    {
      title: "Collateral Wallet & Order Desk",
      badge: "INSTANT EXECUTION",
      desc: "Deposit collateral, place Market or Limit orders with fractional dollar amounts, and review order executions in real time with comprehensive transaction history.",
      icon: Wallet,
      iconColor: "#10b981",
      actionLabel: "Ready to Trade",
      actionTab: "home",
    },
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (onNavigateTab && step.actionTab) onNavigateTab(step.actionTab);
      onClose();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      if (onNavigateTab && steps[nextIdx].actionTab) {
        onNavigateTab(steps[nextIdx].actionTab);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      if (onNavigateTab && steps[prevIdx].actionTab) {
        onNavigateTab(steps[prevIdx].actionTab);
      }
    }
  };

  return (
    <div
      id="stake-interactive-tour-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          borderRadius: 24,
          padding: "26px 28px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          position: "relative",
          textAlign: "left",
        }}
      >
        {/* Close / Skip button */}
        <button
          id="tour-skip-x-btn"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "#f1f5f9",
            border: "none",
            borderRadius: 10,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748b",
            transition: "all 0.15s ease",
          }}
          title="Skip Tour"
        >
          <X size={16} />
        </button>

        {/* Step Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: `${step.iconColor}16`,
              color: step.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={24} />
          </div>
          <div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: step.iconColor,
                background: `${step.iconColor}14`,
                padding: "2px 8px",
                borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {step.badge} • STEP {currentStep + 1} OF {steps.length}
            </span>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0f172a",
                margin: "4px 0 0",
                lineHeight: 1.3,
              }}
            >
              {step.title}
            </h2>
          </div>
        </div>

        {/* Step Body */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "#475569",
            margin: "0 0 24px",
          }}
        >
          {step.desc}
        </p>

        {/* Step Progress Indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: currentStep === idx ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: currentStep === idx ? "#10b981" : "#e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#94a3b8",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Step Footer Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button
            id="tour-skip-text-btn"
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            Skip Tutorial
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
                  gap: 5,
                  padding: "9px 16px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
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
                gap: 6,
                padding: "9px 20px",
                borderRadius: 12,
                border: "none",
                background: "#10b981",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              }}
            >
              <span>{isLast ? "Start Trading" : "Next Step"}</span>
              {isLast ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
