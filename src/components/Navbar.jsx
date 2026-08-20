import { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  PieChart,
  Bot,
  Wallet,
  User,
  LogOut,
  LayoutDashboard,
  History,
  ChevronDown,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { Logo } from "./Charts";

export function Navbar({
  tab,
  setTab,
  agentEnabled,
  user,
  onOpenWallet,
  onOpenKyc,
  onOpenSettings,
  onLogout,
  kycStatus = "UNVERIFIED",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Clean, crisp Light Theme Navbar
  const navBg = "rgba(255, 255, 255, 0.98)";
  const borderCol = "rgba(0, 0, 0, 0.08)";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const dropdownBg = "#ffffff";
  const profileBtnBg = "#f8fafc";

  const navItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "market", label: "Markets", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
    { id: "history", label: "History", icon: History },
    { id: "agent", label: "Agent AI", icon: Bot, badge: agentEnabled ? "ON" : "OFF" },
  ];

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <nav
        id="main-navbar"
        style={{
          background: navBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${borderCol}`,
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Hanken Grotesk', sans-serif",
        }}
      >
        {/* Brand Logo & Desktop Nav Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div id="nav-brand-logo" style={{ cursor: "pointer" }} onClick={() => setTab("home")}>
            <Logo size={28} textSize={18} dark={false} />
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {navItems.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`nav-tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    background: active ? "rgba(16, 185, 129, 0.12)" : "transparent",
                    color: active ? "#059669" : textSecondary,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 900,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: agentEnabled ? "#10b981" : "#94a3b8",
                        color: "#ffffff",
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Action: Single Name / Profile Dropdown Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              id="nav-user-profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 6px 8px",
                borderRadius: 9999,
                border: `1px solid ${borderCol}`,
                background: profileBtnBg,
                cursor: "pointer",
                color: textPrimary,
                fontWeight: 800,
                fontSize: 13,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={14} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>
                {user?.name ? user.name.split(" ")[0] : "Demo Trader"}
              </span>
              <ChevronDown size={14} color={textSecondary} />
            </button>

            {menuOpen && (
              <div
                id="nav-user-dropdown"
                style={{
                  position: "absolute",
                  top: 46,
                  right: 0,
                  width: 250,
                  borderRadius: 16,
                  padding: 12,
                  background: dropdownBg,
                  boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
                  border: `1px solid ${borderCol}`,
                  zIndex: 60,
                  textAlign: "left",
                }}
              >
                {/* Account summary header */}
                <div style={{ paddingBottom: 10, borderBottom: `1px solid ${borderCol}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{user?.name || "Active Trader"}</div>
                  <div style={{ fontSize: 11.5, color: textSecondary }}>{user?.email || "trader@stake.com"}</div>
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {user?.accountNumber || "STK-LIVE-884210"}
                  </div>
                </div>

                {/* Wallet */}
                <button
                  id="profile-menu-wallet-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenWallet();
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Wallet size={14} color="#059669" /> Wallet
                </button>

                {/* KYC Verification */}
                <button
                  id="profile-menu-kyc-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenKyc) onOpenKyc();
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={14} color="#059669" /> KYC Verification
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: kycStatus === "VERIFIED" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: kycStatus === "VERIFIED" ? "#059669" : "#ef4444",
                    }}
                  >
                    {kycStatus === "VERIFIED" ? "Verified" : "Pending"}
                  </span>
                </button>

                {/* Settings */}
                <button
                  id="profile-menu-settings-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Sliders size={14} color="#059669" /> Settings
                </button>

                {/* History */}
                <button
                  id="profile-menu-history-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    setTab("history");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <History size={14} color="#059669" /> Transaction History
                </button>

                {/* Log Out */}
                <button
                  id="profile-menu-logout-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(239,68,68,0.08)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
</div>
  );
}

