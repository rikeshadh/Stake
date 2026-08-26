import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  Sliders,
  BarChart2,
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Layers,
  Minimize2,
  Maximize2,
  Wallet,
} from "lucide-react";

export function InteractiveTour({
  isOpen,
  onClose,
  onNavigateTab,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  const steps = useMemo(() => [
    {
      id: "welcome",
      title: "Your Portfolio Dashboard",
      badge: "PORTFOLIO DESK",
      desc: "Track your cash balance, holdings, and net worth here in real time.",
      icon: Sparkles,
      iconColor: "#059669",
      accentBg: "rgba(5, 150, 105, 0.12)",
      targetId: "main-portfolio-overview",
      actionTab: "home",
      tip: "Use the Wallet button to deposit or withdraw funds anytime.",
    },
    {
      id: "quick_trade",
      title: "Trade 30+ US Stocks",
      badge: "QUICK TRADE",
      desc: "Buy fractional shares from just $1 at live market prices.",
      icon: Layers,
      iconColor: "#0284c7",
      accentBg: "rgba(2, 132, 199, 0.12)",
      targetId: "market-grid-container",
      actionTab: "market",
      tip: "Click 'Quick Trade' on a stock card for instant Market or Limit orders.",
    },
    {
      id: "agent_strategies",
      title: "AI Trading Strategies",
      badge: "AUTOMATION",
      desc: "Deploy strategies like Momentum Breakout or Dip Buyer DCA with custom risk limits.",
      icon: Bot,
      iconColor: "#8b5cf6",
      accentBg: "rgba(139, 92, 246, 0.12)",
      targetId: "agent-strategy-deploy-bar",
      actionTab: "agent",
      tip: "Pick a strategy, allocate capital, and let AI trade for you.",
    },
    {
      id: "agent_benchmark",
      title: "Performance vs S&P 500",
      badge: "BENCHMARK",
      desc: "Compare your strategy's returns against the S&P 500 benchmark.",
      icon: BarChart2,
      iconColor: "#059669",
      accentBg: "rgba(5, 150, 105, 0.12)",
      targetId: "agent-benchmark-card",
      actionTab: "agent",
      tip: "Toggle SPY comparison across 1M, 3M, and 1Y timeframes.",
    },
    {
      id: "agent_radar",
      title: "Live Trade Signals",
      badge: "SIGNAL RADAR",
      desc: "High-conviction setups with entry prices and confidence scores.",
      icon: BrainCircuit,
      iconColor: "#f59e0b",
      accentBg: "rgba(245, 158, 11, 0.12)",
      targetId: "agent-radar-card",
      actionTab: "agent",
      tip: "Signals refresh automatically on every market tick.",
    },
    {
      id: "agent_execution",
      title: "Execution Audit Trail",
      badge: "AUDIT LOG",
      desc: "Every automated trade is logged with price, time, and rationale.",
      icon: Sliders,
      iconColor: "#10b981",
      accentBg: "rgba(16, 185, 129, 0.12)",
      targetId: "agent-audit-card",
      actionTab: "agent",
      tip: "Revert any order with one click to unwind a position.",
    },
  ], []);

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep] || steps[0];
  const Icon = step.icon;

  // Handle target element highlighting and scrolling
  const updateHighlight = useCallback(() => {
    if (!isOpen || !step) return;

    if (onNavigateTab && step.actionTab) {
      onNavigateTab(step.actionTab);
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Viewport-relative coords: root overlay container is position:fixed
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Smooth scroll if element is outside comfortable viewing area
        const inView =
          rect.top >= 70 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 120;
        if (!inView) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setTargetRect(null);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [isOpen, step, onNavigateTab]);

  useEffect(() => {
    updateHighlight();
  }, [currentStep, isOpen, updateHighlight]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => updateHighlight();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [isOpen, updateHighlight]);

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
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [isLast, handleComplete, steps.length]);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  }, [isFirst]);

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

  // Place the guide card adjacent to the highlighted section (fallback: bottom-right)
  const CARD_GAP = 14;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const cardWidth = Math.min(420, vw - 32);
  let cardStyle;
  if (targetRect) {
    const spaceBelow = vh - (targetRect.top + targetRect.height);
    const placeBelow = spaceBelow >= 330;
    const top = placeBelow
      ? Math.min(targetRect.top + targetRect.height + CARD_GAP, vh - 170)
      : Math.max(12, targetRect.top - CARD_GAP - 300);
    const left = Math.max(
      16,
      Math.min(targetRect.left + targetRect.width - cardWidth, vw - cardWidth - 16)
    );
    cardStyle = { top, left, width: cardWidth };
  } else {
    cardStyle = { bottom: 24, right: 24, width: cardWidth };
  }

  return (
    <div
      id="stake-interactive-walkthrough-hud"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        pointerEvents: "none",
      }}
    >
      {/* 1. Subtle, Clean Focus Outline (No overlapping labels) */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: Math.max(0, targetRect.top - 6),
            left: Math.max(6, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 24,
            border: `2.5px solid ${step.iconColor}`,
            boxShadow: `0 0 0 6px ${step.accentBg}, 0 12px 32px rgba(0,0,0,0.08)`,
            pointerEvents: "none",
            zIndex: 8001,
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      )}

      {/* 2. Sleek Bottom Floating HUD Card */}
      <AnimatePresence>
        <motion.div
          drag
          dragConstraints={{ left: -600, right: 600, top: -600, bottom: 600 }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: cardStyle.top,
            left: cardStyle.left,
            bottom: cardStyle.bottom,
            right: cardStyle.right,
            width: cardStyle.width,
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.8)",
            pointerEvents: "auto",
            zIndex: 8002,
            overflow: "hidden",
            textAlign: "left",
            transition: "top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header Strip with Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: step.accentBg,
                  color: step.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={15} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: step.iconColor,
                    letterSpacing: "0.06em",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {step.badge}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#94a3b8",
                    marginLeft: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {currentStep + 1} of {steps.length}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 6px",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title={isMinimized ? "Expand Guide" : "Minimize Guide"}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>

              <button
                id="tour-close-hud-btn"
                type="button"
                onClick={handleSkip}
                style={{
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
                title="Close Walkthrough (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content Body */}
          {!isMinimized && (
            <div style={{ padding: "16px 18px" }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 6px",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: "#475569",
                  margin: "0 0 12px",
                }}
              >
                {step.desc}
              </p>

              {/* Practical Tip */}
              {step.tip && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 10px",
                    background: step.accentBg,
                    borderRadius: 9,
                    marginBottom: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  <Wallet size={12} style={{ color: step.iconColor, flexShrink: 0 }} />
                  <span>{step.tip}</span>
                </div>
              )}

              {/* Step Indicators & Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                {/* Progress pills */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      style={{
                        width: currentStep === idx ? 16 : 5,
                        height: 5,
                        borderRadius: 3,
                        background: currentStep === idx ? step.iconColor : "#cbd5e1",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title={`Step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div style={{ display: "flex", gap: 6 }}>
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <ChevronLeft size={13} /> Back
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 14px",
                      borderRadius: 7,
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 3px 8px rgba(5, 150, 105, 0.25)",
                    }}
                  >
                    <span>{isLast ? "Done" : "Next"}</span>
                    {isLast ? <CheckCircle2 size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
