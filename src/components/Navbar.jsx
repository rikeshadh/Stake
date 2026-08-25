import { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
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
  Bell,
  Check,
  Trash2,
  BellRing,
  ArrowLeft,
} from "lucide-react";
import { Logo } from "./Charts";

export function Navbar({
  tab,
  setTab,
  agentEnabled,
  user,
  isGuestMode = false,
  onOpenAuth,
  onOpenWallet,
  onOpenKyc,
  onOpenSettings,
  onLogout,
  onExitGuest,
  kycStatus = "UNVERIFIED",
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  onSelectStock,
  onOpenTrade,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("ALL"); // ALL, AUTH_TRADE, GUEST_ALERT, AGENT

  const isGuest = Boolean(isGuestMode || user?.isGuest || user?.isDemo);

  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (menuOpen || notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, notifOpen]);

  const navItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "market", label: "Markets", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
    { id: "history", label: "History", icon: History },
    { id: "agent", label: "Agent", icon: Bot, badge: agentEnabled ? "ON" : "OFF" },
  ];

  const unreadCount = notifications.filter(
    (n) => n.unread === true || n.read === false || (!n.read && n.unread !== false)
  ).length;

  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === "ALL") return true;
    const isTrade =
      n.type === "TRADE" ||
      n.category === "TRADE" ||
      n.type === "buy" ||
      n.type === "sell" ||
      n.side === "BUY" ||
      n.side === "SELL";
    const isPriceAlert =
      n.type === "PRICE_ALERT" ||
      n.category === "PRICE_ALERT" ||
      n.type === "price_alert" ||
      n.type === "alert";
    const isAgent =
      n.type === "AGENT" ||
      n.category === "AGENT" ||
      n.type === "agent";

    if (notifFilter === "AUTH_TRADE" || notifFilter === "TRADE") return isTrade;
    if (notifFilter === "GUEST_ALERT" || notifFilter === "PRICE_ALERT") return isPriceAlert;
    if (notifFilter === "AGENT") return isAgent;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <div
            id="nav-brand-logo"
            className="cursor-pointer flex-shrink-0"
            onClick={() => setTab("home")}
          >
            <Logo size={28} textSize={18} dark={false} />
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`nav-tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        agentEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Notification Button + User Profile */}
        <div className="flex items-center gap-2.5">
          {/* =========================================================
              NOTIFICATION BUTTON & CENTER POPOVER
             ========================================================= */}
          <div ref={notifDropdownRef} className="relative">
            <button
              id="nav-notification-btn"
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                notifOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title="Trade & Price Watch Notifications"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  id="nav-notification-badge"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white font-black text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {notifOpen && (
              <div
                id="nav-notification-popover"
                className="absolute right-0 sm:right-0 top-12 w-[calc(100vw-32px)] max-w-[400px] sm:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 font-sans text-slate-900 animate-in fade-in zoom-in-95 duration-100"
                style={{ right: "min(0px, max(-120px, calc(100vw - 380px)))" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <BellRing size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        Notifications
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-50 cursor-pointer"
                        title="Mark all as read"
                      >
                        <Check size={12} /> Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearNotifications}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-50 cursor-pointer"
                        title="Clear all notifications"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Categories */}
                <div className="flex items-center gap-1 mb-2.5 pb-2 border-b border-slate-100 overflow-x-auto">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "AUTH_TRADE", label: "Auth (Trades)" },
                    { id: "GUEST_ALERT", label: "Guest (Alerts)" },
                    { id: "AGENT", label: "Agent AI" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNotifFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                        notifFilter === f.id
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {filteredNotifs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Bell size={24} className="mx-auto mb-1.5 text-slate-300" />
                      <p className="text-xs font-semibold">No notifications in this tab</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Trading executions and price triggers will appear here.
                      </p>
                    </div>
                  ) : (
                    filteredNotifs.map((notif) => {
                      const isTrade = notif.type === "TRADE";
                      const isBuy = notif.side === "BUY";
                      const isPriceAlert = notif.type === "PRICE_ALERT";

                      return (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-xl border transition-all text-left flex items-start gap-2.5 ${
                            notif.read
                              ? "bg-white border-slate-100 text-slate-600"
                              : "bg-emerald-50/40 border-emerald-100 text-slate-900 font-medium"
                          }`}
                        >
                          {/* Notification Type Icon */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isTrade
                                ? isBuy
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                                : isPriceAlert
                                ? "bg-amber-100 text-amber-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {isTrade ? (
                              isBuy ? (
                                <TrendingUp size={14} />
                              ) : (
                                <TrendingDown size={14} />
                              )
                            ) : isPriceAlert ? (
                              <BellRing size={14} />
                            ) : (
                              <Bot size={14} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                              <span>{formatNotifTime(notif.timestamp)}</span>
                              {notif.ticker && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotifOpen(false);
                                    if (onSelectStock) onSelectStock(notif.ticker);
                                    if (onOpenTrade) onOpenTrade(notif.ticker, notif.side || "BUY");
                                  }}
                                  className="font-bold text-emerald-600 hover:underline cursor-pointer"
                                >
                                  View {notif.ticker} →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================
              USER PROFILE (AUTHENTICATED) OR GUEST ACTIONS
             ========================================================= */}
          {user ? (
            <div className="flex items-center gap-2">
              <div ref={dropdownRef} className="relative">
                <button
                  id="nav-user-profile-btn"
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer font-bold text-xs text-slate-800 shadow-2xs transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-black text-xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={13} />}
                  </div>
                  <span className="hidden sm:inline font-bold text-slate-800">
                    {user?.name ? user.name.split(" ")[0] : "Trader"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {menuOpen && (
                  <div
                    id="nav-user-dropdown"
                    className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 text-left animate-in fade-in zoom-in-95 duration-100"
                  >
                    {/* Account info */}
                    <div className="pb-3 border-b border-slate-100 mb-2">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user?.name || "Active Trader"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user?.email || "trader@stake.com"}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 font-bold mt-1">
                        {user?.accountNumber || "STK-PRO-884210"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        id="profile-menu-wallet-btn"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenWallet();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Wallet size={14} className="text-emerald-600" /> Collateral Wallet
                      </button>

                      <button
                        id="profile-menu-kyc-btn"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (onOpenKyc) onOpenKyc();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={14} className="text-emerald-600" /> KYC Verification
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            kycStatus === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {kycStatus === "VERIFIED" ? "Verified" : "Pending"}
                        </span>
                      </button>

                      <button
                        id="profile-menu-settings-btn"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (onOpenSettings) onOpenSettings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Sliders size={14} className="text-emerald-600" /> Settings & Cluster
                      </button>

                      <button
                        id="profile-menu-history-btn"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setTab("history");
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <History size={14} className="text-emerald-600" /> Order History
                      </button>

                      {isGuest && (
                        <button
                          id="profile-menu-landing-btn"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            if (onExitGuest) onExitGuest();
                            else if (onLogout) onLogout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <ArrowLeft size={14} className="text-slate-500" /> Back to Landing Page
                        </button>
                      )}

                      <button
                        id="profile-menu-logout-btn"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (isGuest) {
                            if (onExitGuest) onExitGuest();
                            else if (onLogout) onLogout();
                          } else {
                            onLogout();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/60 hover:bg-rose-100/70 flex items-center gap-2.5 cursor-pointer mt-1"
                      >
                        <LogOut size={14} /> {isGuest ? "Exit Sandbox" : "Log Out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {isGuest && (
                <button
                  id="nav-guest-back-landing-btn"
                  type="button"
                  onClick={() => {
                    if (onExitGuest) onExitGuest();
                    else if (onLogout) onLogout();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
                  title="Return to Landing Page"
                >
                  <ArrowLeft size={13} />
                  <span>Landing</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="nav-guest-sandbox-landing-btn"
                type="button"
                onClick={() => {
                  if (onExitGuest) onExitGuest();
                  else if (onLogout) onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
                title="Return to Landing Page"
              >
                <ArrowLeft size={13} />
                <span className="hidden sm:inline">Landing</span>
              </button>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Guest Sandbox</span>
              </div>
              <button
                id="nav-unauth-login-btn"
                type="button"
                onClick={() => onOpenAuth && onOpenAuth("login")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all"
              >
                Log In
              </button>
              <button
                id="nav-unauth-signup-btn"
                type="button"
                onClick={() => onOpenAuth && onOpenAuth("signup")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer transition-all"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Pills Bar (Responsive) */}
      <div className="md:hidden border-t border-slate-100 px-3 py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar bg-slate-50/80">
        {navItems.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                active
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] font-black px-1 rounded ${
                    active ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function formatNotifTime(ts) {
  if (!ts) return "Just now";
  const diff = Date.now() - Number(ts);
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
