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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
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
  onOpenAiInsights,
  alerts = [],
  onLogout,
  onExitGuest,
  kycStatus = "UNVERIFIED",
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  onSelectStock,
  onOpenTrade,
  layout = "top",
  sidebarCollapsed = false,
  onToggleSidebarCollapse,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("ALL");
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = sidebarCollapsed !== undefined ? sidebarCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    if (onToggleSidebarCollapse) {
      onToggleSidebarCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const isGuest = Boolean(isGuestMode || user?.isGuest || user?.isDemo);
  const isSidebar = layout === "sidebar";

  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

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

  const navItemsTrading = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "market", label: "Markets", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
    { id: "history", label: "History", icon: History },
  ];

  const navItemsAgent = [
    {
      id: "agent",
      label: "AI Trade",
      icon: Bot,
      badge: agentEnabled ? "ACTIVE" : "PAUSED",
      badgeColor: agentEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600",
    },
  ];

  const unreadCount = notifications.filter(
    (n) => n.unread === true || n.read === false || (!n.read && n.unread !== false)
  ).length;
  const activeAlerts = alerts.filter((alert) => !alert.triggered && alert.active !== false);

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

    if (notifFilter === "TRADE") return isTrade;
    if (notifFilter === "ALERTS") return isPriceAlert;
    if (notifFilter === "AGENT") return isAgent;
    return true;
  });

  // =========================================================================
  // NOTIFICATIONS FLYOUT / POPOVER
  // =========================================================================
  const renderNotificationsPopover = (positionClass = "right-0 top-12") => (
    <div
      id="nav-notification-popover"
      className={`stake-notification-popover absolute ${positionClass} w-[calc(100vw-32px)] max-w-[390px] sm:w-[390px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 font-sans text-slate-900 animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <BellRing size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Notifications & Triggers
            </h3>
            <p className="text-[11px] text-slate-400">
              {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
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

      <div className="stake-notification-filters flex items-center gap-1 my-2.5 pb-2 border-b border-slate-100 overflow-x-auto">
        {[
          { id: "ALL", label: "All" },
          { id: "TRADE", label: "Trades" },
          { id: "ALERTS", label: "Price Alerts" },
          { id: "AGENT", label: "AI Agent" },
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

      {activeAlerts.length > 0 && (
        <div className="mb-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
            Active price alerts
          </div>
          {activeAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between py-1 text-[11px] font-semibold text-slate-700"
            >
              <span>
                {alert.ticker} {alert.condition === "BELOW" ? "below" : "above"} $
                {Number(alert.targetPrice).toFixed(2)}
              </span>
              <BellRing size={12} className="text-emerald-600" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {filteredNotifs.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Bell size={24} className="mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs font-semibold">No notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Trading executions and price triggers will appear here.
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isTrade =
              notif.type === "TRADE" ||
              notif.category === "TRADE" ||
              notif.type === "buy" ||
              notif.type === "sell";
            const isBuy = notif.side === "BUY" || notif.type === "buy";
            const isPriceAlert =
              notif.type === "PRICE_ALERT" ||
              notif.category === "PRICE_ALERT" ||
              notif.type === "alert";

            return (
              <div
                key={notif.id}
                className={`stake-notification-item p-2.5 rounded-xl border transition-all text-left flex items-start gap-2.5 ${
                  notif.read || notif.unread === false
                    ? "bg-white border-slate-100 text-slate-600"
                    : "bg-emerald-50/40 border-emerald-100 text-slate-900 font-medium"
                }`}
              >
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                    {!notif.read && notif.unread !== false && (
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
  );

  // =========================================================================
  // VIEW A: SIDEBAR (LEFT BAR) LAYOUT
  // =========================================================================
  if (isSidebar) {
    return (
      <aside
        id="stake-left-sidebar"
        className={`fixed left-0 top-0 bottom-0 z-50 ${
          isCollapsed ? "w-16" : "w-52"
        } bg-white border-r border-slate-200 shadow-md flex flex-col justify-between select-none transition-all duration-200`}
      >
        {/* Top Header & Navigation Scrollable Area */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${isCollapsed ? "px-2 py-3" : "px-3 py-3"} space-y-3`}>
          {/* Brand & Collapse Header */}
          <div className={`flex items-center ${isCollapsed ? "flex-col gap-2 pb-2" : "justify-between pb-2.5"} border-b border-slate-100`}>
            <div
              id="sidebar-brand-logo"
              className="cursor-pointer flex-shrink-0 flex items-center gap-1.5"
              onClick={() => setTab("home")}
              title="Stake Home"
            >
              <Logo size={isCollapsed ? 26 : 24} textSize={isCollapsed ? 0 : 17} dark={false} />
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Navigation Section 1: Core Platform */}
          <div>
            {!isCollapsed ? (
              <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1">
                Trading Desk
              </div>
            ) : (
              <div className="h-px bg-slate-100 my-1 mx-1" />
            )}
            <nav className="space-y-1">
              {navItemsTrading.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    id={`sidebar-nav-${t.id}`}
                    onClick={() => setTab(t.id)}
                    title={t.label}
                    className={`flex items-center transition-all cursor-pointer ${
                      isCollapsed
                        ? "w-10 h-10 mx-auto justify-center rounded-xl"
                        : "w-full justify-between px-2.5 py-2 rounded-xl text-xs font-bold"
                    } ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-black border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2"}`}>
                      <Icon size={isCollapsed ? 17 : 15} className={active ? "text-emerald-600" : "text-slate-500"} />
                      {!isCollapsed && <span className="truncate">{t.label}</span>}
                    </div>
                    {!isCollapsed && active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Navigation Section 2: Algorithmic Suite */}
          <div>
            {!isCollapsed ? (
              <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1">
                AI Trade Desk
              </div>
            ) : (
              <div className="h-px bg-slate-100 my-1 mx-1" />
            )}
            <nav className="space-y-1">
              {navItemsAgent.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    id={`sidebar-nav-${t.id}`}
                    onClick={() => setTab(t.id)}
                    title={t.label}
                    className={`flex items-center transition-all cursor-pointer ${
                      isCollapsed
                        ? "w-10 h-10 mx-auto justify-center rounded-xl"
                        : "w-full justify-between px-2.5 py-2 rounded-xl text-xs font-bold"
                    } ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-black border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2 min-w-0"}`}>
                      <Icon size={isCollapsed ? 17 : 15} className={active ? "text-emerald-600" : "text-slate-500 flex-shrink-0"} />
                      {!isCollapsed && <span className="truncate">{t.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${t.badgeColor}`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Dock: User Profile & System Controls */}
        <div className={`border-t border-slate-200 ${isCollapsed ? "p-2 space-y-2" : "p-2.5 space-y-2"} bg-white relative`}>
          {/* Stake AI Button - Positioned Down Directly Above Notifications */}
          {onOpenAiInsights && (
            <div className={isCollapsed ? "flex justify-center" : "px-0.5"}>
              <button
                id="sidebar-stake-ai-btn"
                type="button"
                onClick={onOpenAiInsights}
                title="Stake AI"
                aria-label="Open Stake AI"
                className={`cursor-pointer transition-all ${
                  isCollapsed
                    ? "w-10 h-10 rounded-xl bg-slate-950 text-[#15F7A6] hover:bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xs"
                    : "w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 text-white shadow-xs border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900"
                }`}
              >
                <Sparkles size={isCollapsed ? 18 : 15} className="text-[#15F7A6] animate-pulse flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-xs font-black text-white truncate">
                    Stake AI
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Quick Action Bar (Notifications, Settings, Wallet) */}
          <div className={isCollapsed ? "flex flex-col items-center gap-1.5" : "flex items-center justify-between px-0.5"}>
            <div ref={notifDropdownRef} className="relative">
              <button
                id="sidebar-notification-btn"
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className={`rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
                  isCollapsed ? "w-10 h-10" : "p-1.5"
                } ${
                  notifOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
                title="Notifications & Triggers"
                aria-label="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-emerald-600 text-white font-black text-[8.5px] rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && renderNotificationsPopover("left-full bottom-0 ml-3")}
            </div>

            <div className={isCollapsed ? "flex flex-col items-center gap-1.5" : "flex items-center gap-1"}>
              {onOpenWallet && (
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className={`rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer flex items-center justify-center ${
                    isCollapsed ? "w-10 h-10" : "p-1.5"
                  }`}
                  title="Open Wallet"
                >
                  <Wallet size={15} />
                </button>
              )}

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={`rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer flex items-center justify-center ${
                    isCollapsed ? "w-10 h-10" : "p-1.5"
                  }`}
                  title="Settings & Layout"
                >
                  <Sliders size={15} />
                </button>
              )}
            </div>
          </div>

          {/* User Account / Guest Pill */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setMenuOpen(!menuOpen)}
                title={user?.name || "Active Trader"}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? "justify-center p-1 rounded-xl hover:bg-slate-50"
                    : "justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100"
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={14} />}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user?.name || "Active Trader"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span>{user?.accountNumber || "STK-88421"}</span>
                        {kycStatus === "VERIFIED" && (
                          <ShieldCheck size={11} className="text-emerald-500" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {!isCollapsed && <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />}
              </div>

              {menuOpen && (
                <div className="absolute left-full bottom-0 ml-3 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 text-left animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-2 border-b border-slate-100 mb-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || "Trader"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onOpenKyc) onOpenKyc();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-600" /> Identity / KYC
                      </span>
                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.2 rounded ${
                          kycStatus === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {kycStatus}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setTab("portfolio");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <PieChart size={14} className="text-emerald-600" /> View Portfolio
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setTab("history");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <History size={14} className="text-emerald-600" /> Order History
                    </button>

                    {isGuest && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (onExitGuest) onExitGuest();
                          else if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                      >
                        <ArrowLeft size={14} className="text-slate-500" /> Exit Sandbox
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (isGuest) {
                          if (onExitGuest) onExitGuest();
                          else if (onLogout) onLogout();
                        } else {
                          if (onLogout) onLogout();
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/60 hover:bg-rose-100/70 flex items-center gap-2 cursor-pointer mt-1"
                    >
                      <LogOut size={14} /> {isGuest ? "Exit Sandbox" : "Log Out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth("login")}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth("signup")}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW B: TOP BAR (STANDARD) LAYOUT
  // =========================================================================
  const allNavItems = [...navItemsTrading, ...navItemsAgent];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="w-full px-3 sm:px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            id="nav-brand-logo"
            className="cursor-pointer flex-shrink-0"
            onClick={() => setTab("home")}
          >
            <Logo size={28} textSize={18} dark={false} />
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.map((t) => {
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

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Stake AI Copilot Button */}
          {onOpenAiInsights && (
            <button
              id="nav-ai-insights-btn"
              type="button"
              onClick={onOpenAiInsights}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Open Stake AI Copilot"
            >
              <Sparkles size={14} className="text-[#15F7A6]" />
              <span className="hidden sm:inline">Stake AI</span>
            </button>
          )}

          {/* Notification Button & Popover */}
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
              title="Notifications & Triggers"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  id="nav-notification-badge"
                  className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-emerald-600 text-white font-black text-[9.5px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && renderNotificationsPopover("right-0 top-12")}
          </div>

          {/* User Profile or Guest Actions */}
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
                          if (onOpenWallet) onOpenWallet();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Wallet size={14} className="text-emerald-600" /> Deposit / Wallet
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
                        <span className="flex items-center gap-2.5">
                          <ShieldCheck size={14} className="text-emerald-600" /> Identity
                          Verification
                        </span>
                        <span
                          className={`text-[9.5px] font-black px-1.5 py-0.2 rounded ${
                            kycStatus === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {kycStatus}
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
                        <Sliders size={14} className="text-emerald-600" /> Settings
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
                  className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                  title="Exit Sandbox & Return to Landing"
                  aria-label="Exit Sandbox"
                >
                  <LogOut size={16} />
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
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                title="Exit to Landing"
                aria-label="Exit to Landing"
              >
                <LogOut size={16} />
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden border-t border-slate-100 px-3 py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar bg-slate-50/80">
        {allNavItems.map((t) => {
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

// Helper function
function formatNotifTime(ts) {
  if (!ts) return "Just now";
  if (typeof ts === "string" && isNaN(Number(ts))) return ts;
  const diff = Date.now() - Number(ts);
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
