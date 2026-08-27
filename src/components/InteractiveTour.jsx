import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Wallet,
  PieChart,
  List,
} from "lucide-react";

export function InteractiveTour({
  isOpen,
  onClose,
  onNavigateTab,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  // Steps: Portfolio (overview, holdings, allocation) + Market
  const steps = useMemo(() => [
    {
      id: "portfolio_overview",
      title: "Your Portfolio Overview",
      badge: "PORTFOLIO DESK",
      desc: "Track your net worth, cash balance, and all-time returns in one glance.",
      icon: Sparkles,
      iconColor: "#059669",
      accentBg: "rgba(5, 150, 105, 0.12)",
      targetId: "main-portfolio-overview", // ID of the top banner
      actionTab: "home",
      tip: "Use the Wallet button to deposit or withdraw funds anytime.",
    },
    {
      id: "holdings_list",
      title: "Active Holdings",
      badge: "POSITIONS",
      desc: "See all your stocks, their current value, and daily P&L at a glance.",
      icon: List,
      iconColor: "#0284c7",
      accentBg: "rgba(2, 132, 199, 0.12)",
      targetId: "holdings-list-container", // add ID to the holdings wrapper
      actionTab: "home",
      tip: "Click Buy/Sell to trade directly from your holdings.",
    },
    {
      id: "asset_allocation",
      title: "Asset Allocation",
      badge: "DIVERSIFICATION",
      desc: "Understand how your capital is distributed across sectors and cash.",
      icon: PieChart,
      iconColor: "#8b5cf6",
      accentBg: "rgba(139, 92, 246, 0.12)",
      targetId: "asset-allocation-donut", // ID for the donut chart container
      actionTab: "home",
      tip: "A balanced portfolio helps manage risk effectively.",
    },
    {
      id: "quick_trade",
      title: "Trade 30+ US Stocks",
      badge: "MARKET",
      desc: "Buy fractional shares from just $1 at live market prices.",
      icon: Layers,
      iconColor: "#f59e0b",
      accentBg: "rgba(245, 158, 11, 0.12)",
      targetId: "market-grid-container",
      actionTab: "market",
      tip: "Click 'Quick Trade' on a stock card for instant Market or Limit orders.",
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
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Do NOT scroll when on Market tab
        if (step.actionTab !== "market") {
          const inView =
            rect.top >= 70 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 120;
          if (!inView) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
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

  // Positioning logic (unchanged)
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
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
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
            transition: "top 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        />
      )}

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
          }}
        >
          {/* Header */}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ padding: "16px 18px" }}
              >
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

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      id="tour-skip-btn"
                      type="button"
                      onClick={handleSkip}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "5px 8px",
                      }}
                    >
                      Skip
                    </button>

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
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>
    </div>

    
  );
}