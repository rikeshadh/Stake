import { useState, useRef, useEffect } from "react";
import { HelpCircle, Info } from "lucide-react";

export function TooltipBadge({
  text,
  title,
  icon = "help", // "help" | "info"
  position = "top", // "top" | "bottom" | "left" | "right"
  size = 13,
  color = "#94a3b8",
  activeColor = "#059669",
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleDocClick = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("touchstart", handleDocClick);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("touchstart", handleDocClick);
    };
  }, [open]);

  const IconComp = icon === "info" ? Info : HelpCircle;

  return (
    <span
      ref={triggerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        cursor: "pointer",
        marginLeft: 4,
        ...style,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      <IconComp
        size={size}
        color={open ? activeColor : color}
        style={{
          transition: "color 0.15s ease, transform 0.15s ease",
          transform: open ? "scale(1.15)" : "scale(1)",
        }}
      />

      {open && (
        <span
          style={{
            position: "absolute",
            zIndex: 9999,
            bottom: position === "top" ? "calc(100% + 8px)" : "auto",
            top: position === "bottom" ? "calc(100% + 8px)" : "auto",
            left: position === "right" ? "calc(100% + 8px)" : "50%",
            transform: position === "right" ? "none" : "translateX(-50%)",
            background: "#0f172a",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: "11.5px",
            lineHeight: "1.45",
            fontWeight: 500,
            fontFamily: "system-ui, -apple-system, sans-serif",
            width: "max-content",
            maxWidth: "240px",
            textAlign: "left",
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            pointerEvents: "none",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {title && (
            <span
              style={{
                display: "block",
                fontWeight: 700,
                color: "#34d399",
                marginBottom: 3,
                fontSize: "11.5px",
                letterSpacing: "0.01em",
              }}
            >
              {title}
            </span>
          )}
          <span style={{ display: "block", color: "#e2e8f0" }}>{text}</span>
        </span>
      )}
    </span>
  );
}
