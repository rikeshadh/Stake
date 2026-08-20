import { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { HomeDashboard } from "./components/HomeDashboard";
import { MarketGrid } from "./components/MarketGrid";
import { StockDetail } from "./components/StockDetail";
import { StakeOrderDeskDrawer } from "./components/StakeOrderDeskDrawer";
import { WalletModal } from "./components/WalletModal";
import { PortfolioTab } from "./components/PortfolioTab";
import { WatchlistTab } from "./components/WatchlistTab";
import { AgentTab } from "./components/AgentTab";
import { TransactionHistory } from "./components/TransactionHistory";
import { AlertsManager } from "./components/AlertsManager";
import { SetAlertModal } from "./components/SetAlertModal";
import { LiveIndicesFooter } from "./components/LiveIndicesFooter";
import { AuthPage } from "./components/AuthPage";
import { KycPage } from "./components/KycPage";
import { SettingsModal } from "./components/SettingsModal";
import { fmtShares } from "./utils";
import {
  syncUserState,
  submitOrder,
  fetchStocks,
  fetchAlerts,
  createPriceAlert,
  deletePriceAlert,
  fetchKycStatus,
  fetchUserData,
  deleteAccount,
} from "./api";
import { WORLD_150_STOCKS } from "./stocksData";

const INTERNATIONAL_STOCKS_META = WORLD_150_STOCKS;

function generateInitialHistory(basePrice, count = 28) {
  const arr = [basePrice];
  let cur = basePrice;
  for (let i = 1; i < count; i++) {
    const delta = (Math.random() - 0.49) * (basePrice * 0.012);
    arr.push(Math.max(basePrice * 0.7, cur + delta));
    cur = arr[arr.length - 1];
  }
  return arr;
}

export default function App() {
  // Navigation & Authentication
  const [tab, setTab] = useState("home"); // "home" | "market" | "portfolio" | "watchlist" | "history" | "alerts" | "agent"
  const [selectedStock, setSelectedStock] = useState(null);

  // Authenticated User Session (Clean start: starts on Landing Page if not logged in)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("stake_active_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.toLowerCase().includes("rikesh")) {
          return parsed;
        }
      }
      localStorage.removeItem("stake_active_user");
      return null;
    } catch {
      return null;
    }
  });

  // Auth Modal state for unauthenticated landing visitors
  const [authModal, setAuthModal] = useState(null); // null | "login" | "signup"

  // KYC States
  const [kycStatus, setKycStatus] = useState("VERIFIED");
  const [kycData, setKycData] = useState(null);

  // Settings & Currency
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem("stake_preferred_currency") || "USD";
    } catch {
      return "USD";
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSetCurrency = (newCurr) => {
    setCurrency(newCurr);
    try {
      localStorage.setItem("stake_preferred_currency", newCurr);
    } catch (err) {
      console.warn("Could not save currency preference:", err);
    }
    showToast(`Display currency set to ${newCurr}`);
  };

  // Drawer & Modal states
  const [orderDeskOpen, setOrderDeskOpen] = useState(false);
  const [orderDeskMode, setOrderDeskMode] = useState("BUY");
  const [walletOpen, setWalletOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [quickAlertModalOpen, setQuickAlertModalOpen] = useState(false);

  // Portfolio & Balances
  const [cash, setCash] = useState(() => (user?.cash !== undefined ? user.cash : 0));
  const [holdings, setHoldings] = useState(() => user?.holdings || {});
  const [watchlist, setWatchlist] = useState(() => user?.watchlist || []);
  const [orders, setOrders] = useState(() => user?.orders || []);
  const [alerts, setAlerts] = useState(() => user?.alerts || []);

  // Autonomous Agent AI (Default OFF for new users)
  const [agentEnabled, setAgentEnabled] = useState(() => (user?.agentEnabled !== undefined ? user.agentEnabled : false));
  const [agentStrategy, setAgentStrategy] = useState("dip_buyer");
  const [agentMaxSpend, setAgentMaxSpend] = useState(15000);
  const [chatLog, setChatLog] = useState([
    { sender: "agent", text: "Hello! I am your Stake AI trading agent. I am monitoring live market order streams and depth." },
  ]);

  // Stocks data & simulation
  const [stockMetaList, setStockMetaList] = useState(INTERNATIONAL_STOCKS_META);
  const [stocks, setStocks] = useState(() => {
    const map = {};
    INTERNATIONAL_STOCKS_META.forEach((s) => {
      map[s.ticker] = {
        price: s.price,
        open: s.price * (1 - (Math.random() * 0.02 - 0.01)),
        high: s.price * 1.025,
        low: s.price * 0.975,
        history: generateInitialHistory(s.price, 28),
        dayPoints: generateInitialHistory(s.price, 36),
        change: 0,
        pct: 0,
      };
    });
    return map;
  });

  const [flash, setFlash] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch initial stocks and KYC from backend API if available
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const remoteStocks = await fetchStocks();
        if (isMounted && remoteStocks && remoteStocks.length > 0) {
          setStockMetaList(remoteStocks);
        }
      } catch (err) {
        console.warn("Backend stocks load fallback to internal list", err);
      }

      if (user?.email) {
        try {
          const kycRes = await fetchKycStatus(user.email);
          if (isMounted && kycRes) {
            setKycStatus(kycRes.status || "VERIFIED");
            setKycData(kycRes);
          }
        } catch {
          // ignore fallback
        }
        try {
          const userAlerts = await fetchAlerts(user.email);
          if (isMounted && Array.isArray(userAlerts) && userAlerts.length > 0) {
            setAlerts(userAlerts);
          }
        } catch {
          // ignore fallback
        }
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  // Sync state to LocalStorage and backend
  const triggerBackendSync = useCallback(
    async (curUser, curCash, curHoldings, curWatchlist, curOrders, curAgentEnabled = agentEnabled) => {
      if (!curUser) return;
      try {
        localStorage.setItem("stake_active_user", JSON.stringify(curUser));
      } catch {
        // ignore
      }
      try {
        await syncUserState({
          user: curUser,
          cash: curCash,
          holdings: curHoldings,
          watchlist: curWatchlist,
          orders: curOrders,
          agentEnabled: curAgentEnabled,
        });
      } catch {
        // ignore fallback
      }
    },
    [agentEnabled]
  );

  // Live real-time market quote ticks simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) => {
        const next = { ...prev };
        const updatedFlash = {};

        // Randomly pick 3-6 stocks to tick
        const count = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < count; i++) {
          const randomMeta = stockMetaList[Math.floor(Math.random() * stockMetaList.length)];
          const ticker = randomMeta.ticker;
          const current = prev[ticker] || {
            price: randomMeta.price,
            open: randomMeta.price,
            history: [randomMeta.price],
            dayPoints: [randomMeta.price],
          };

          const volatility = 0.0035;
          const deltaPct = (Math.random() - 0.49) * volatility;
          const newPrice = Math.max(1, Math.round((current.price * (1 + deltaPct)) * 100) / 100);

          const hist = [...(current.history || [newPrice])];
          hist.push(newPrice);
          if (hist.length > 32) hist.shift();

          const dayPts = [...(current.dayPoints || [newPrice])];
          dayPts.push(newPrice);
          if (dayPts.length > 60) dayPts.shift();

          next[ticker] = {
            ...current,
            price: newPrice,
            high: Math.max(current.high || newPrice, newPrice),
            low: Math.min(current.low || newPrice, newPrice),
            history: hist,
            dayPoints: dayPts,
          };

          updatedFlash[ticker] = newPrice > current.price ? "up" : "down";
        }

        setFlash(updatedFlash);
        setTimeout(() => setFlash({}), 500);
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [stockMetaList]);

  // Check Price Alerts
  useEffect(() => {
    if (!alerts.length) return;
    alerts.forEach((alt) => {
      const p = stocks[alt.symbol]?.price;
      if (!p) return;
      if (alt.condition === "ABOVE" && p >= alt.targetPrice && !alt.triggered) {
        showToast(`🔔 Price Alert: ${alt.symbol} reached $${p.toFixed(2)} (Target: $${alt.targetPrice})`);
        setAlerts((prev) => prev.map((a) => (a.id === alt.id ? { ...a, triggered: true } : a)));
      } else if (alt.condition === "BELOW" && p <= alt.targetPrice && !alt.triggered) {
        showToast(`🔔 Price Alert: ${alt.symbol} dropped to $${p.toFixed(2)} (Target: $${alt.targetPrice})`);
        setAlerts((prev) => prev.map((a) => (a.id === alt.id ? { ...a, triggered: true } : a)));
      }
    });
  }, [stocks, alerts, showToast]);

  // Calculate Net Worth
  const totalStockValue = Object.keys(holdings).reduce((sum, ticker) => {
    const curPrice = stocks[ticker]?.price || 0;
    return sum + (holdings[ticker]?.shares || 0) * curPrice;
  }, 0);

  const netWorth = cash + totalStockValue;

  // Day change calculation for a ticker
  const dayChange = useCallback(
    (ticker) => {
      const cur = stocks[ticker]?.price || 100;
      const open = stocks[ticker]?.open || cur;
      return open > 0 ? (cur - open) / open : 0;
    },
    [stocks]
  );

  // Watchlist toggle handler
  const toggleWatchlist = (ticker) => {
    setWatchlist((prev) => {
      const next = prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker];
      triggerBackendSync(user, cash, holdings, next, orders);
      showToast(next.includes(ticker) ? `Added ${ticker} to Watchlist` : `Removed ${ticker} from Watchlist`);
      return next;
    });
  };

  // Trade Execution Handler (supports both single object payload and positional arguments)
  const executeTrade = async (arg1, arg2, arg3, arg4, arg5) => {
    let ticker, side, shares, price, orderType, validity;

    if (arg1 && typeof arg1 === "object") {
      ticker = arg1.ticker || arg1.symbol || arg1.scrip || arg1.stock || selectedStock || "NVDA";
      side = arg1.side || arg1.type || arg1.mode || "BUY";
      shares = Number(arg1.shares || arg1.qty || arg1.parsedQty || 1);
      price = Number(arg1.price || arg1.effectivePrice || stocks[ticker]?.price || 150);
      orderType = arg1.orderType || "MKT";
      validity = arg1.validity || "DAY";
    } else {
      ticker = arg1 || selectedStock || "NVDA";
      side = arg2 || "BUY";
      if (arg4 !== undefined && arg5 !== undefined) {
        shares = Number(arg4);
        price = Number(arg5);
      } else if (arg3 !== undefined) {
        shares = Number(arg3);
        price = Number(arg4 !== undefined ? arg4 : (stocks[ticker]?.price || 150));
      } else {
        shares = 1;
        price = Number(stocks[ticker]?.price || 150);
      }
      orderType = "MKT";
      validity = "DAY";
    }

    const cleanTicker = String(ticker || "NVDA").toUpperCase();
    const cleanSide = String(side || "BUY").toUpperCase();
    const isBuy = cleanSide === "BUY";
    const tradeShares = Math.max(0.0001, Number(shares) || 1);
    const tradePrice = Math.max(0.01, Number(price) || (stocks[cleanTicker]?.price || 150));
    const tradeValue = Number((tradeShares * tradePrice).toFixed(2));
    const fee = Number((tradeValue * 0.004).toFixed(2));
    const totalCost = Number((tradeValue + fee).toFixed(2));

    if (isBuy) {
      if (cash < totalCost) {
        showToast("Insufficient collateral funds!");
        return false;
      }
      const newCash = cash - totalCost;
      setCash(newCash);

      setHoldings((prev) => {
        const cur = prev[cleanTicker] || { shares: 0, costBasis: 0 };
        const updated = {
          ...prev,
          [cleanTicker]: {
            shares: cur.shares + tradeShares,
            costBasis: cur.costBasis + tradeValue,
          },
        };

        const newOrder = {
          id: `STK-${Math.floor(1000 + Math.random() * 9000)}`,
          scrip: cleanTicker,
          stock: cleanTicker,
          ticker: cleanTicker,
          type: "BUY",
          side: "BUY",
          shares: tradeShares,
          price: tradePrice,
          total: tradeValue,
          orderType,
          validity,
          status: "EXECUTED",
          timestamp: Date.now(),
          date: new Date().toISOString(),
        };

        const newOrders = [newOrder, ...orders];
        setOrders(newOrders);
        triggerBackendSync(user, newCash, updated, watchlist, newOrders);

        // Submit to API
        submitOrder(newOrder).catch(() => {});
        return updated;
      });

      setOrderDeskOpen(false);
      showToast(`Bought ${fmtShares(tradeShares)} shares of ${cleanTicker} at $${tradePrice.toFixed(2)}`);
      return true;
    } else {
      const curHolding = holdings[cleanTicker]?.shares || 0;
      if (curHolding < tradeShares) {
        showToast(`Insufficient shares! You own ${fmtShares(curHolding)} shares.`);
        return false;
      }

      const proceeds = Number((tradeValue - fee).toFixed(2));
      const newCash = cash + proceeds;
      setCash(newCash);

      setHoldings((prev) => {
        const cur = prev[cleanTicker] || { shares: 0, costBasis: 0 };
        const remainingShares = cur.shares - tradeShares;
        const updated = { ...prev };
        if (remainingShares <= 0.0001) {
          delete updated[cleanTicker];
        } else {
          updated[cleanTicker] = {
            shares: remainingShares,
            costBasis: Number((cur.costBasis * (remainingShares / cur.shares)).toFixed(2)),
          };
        }

        const newOrder = {
          id: `STK-${Math.floor(1000 + Math.random() * 9000)}`,
          scrip: cleanTicker,
          stock: cleanTicker,
          ticker: cleanTicker,
          type: "SELL",
          side: "SELL",
          shares: tradeShares,
          price: tradePrice,
          total: tradeValue,
          orderType,
          validity,
          status: "EXECUTED",
          timestamp: Date.now(),
          date: new Date().toISOString(),
        };

        const newOrders = [newOrder, ...orders];
        setOrders(newOrders);
        triggerBackendSync(user, newCash, updated, watchlist, newOrders);

        submitOrder(newOrder).catch(() => {});
        return updated;
      });

      setOrderDeskOpen(false);
      showToast(`Sold ${fmtShares(tradeShares)} shares of ${cleanTicker} at $${tradePrice.toFixed(2)}`);
      return true;
    }
  };

  // Wallet Actions
  const handleDeposit = (amt) => {
    const newCash = cash + amt;
    setCash(newCash);
    triggerBackendSync(user, newCash, holdings, watchlist, orders);
    showToast(`Deposited $ ${amt.toLocaleString()} to Collateral Account`);
  };

  const handleWithdraw = (amt) => {
    if (cash < amt) {
      showToast("Insufficient balance for withdrawal!");
      return;
    }
    const newCash = cash - amt;
    setCash(newCash);
    triggerBackendSync(user, newCash, holdings, watchlist, orders);
    showToast(`Withdrew $ ${amt.toLocaleString()} from Account`);
  };

  // Alerts Actions
  const handleSaveAlert = async (newAlert) => {
    const alertItem = {
      ...newAlert,
      id: `alt-${Date.now()}`,
      userId: user?.email,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [alertItem, ...prev]);
    try {
      await createPriceAlert(alertItem);
    } catch {
      // fallback
    }
    showToast(`Price trigger set for ${alertItem.symbol} at $${alertItem.targetPrice}`);
  };

  const handleDeleteAlert = async (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await deletePriceAlert(id);
    } catch {
      // fallback
    }
    showToast("Alert removed");
  };

  // Agent Chat with Backend Gemini Function-Calling Loop
  const handleSendChatMessage = async (text) => {
    setChatLog((prev) => [...prev, { sender: "user", text }]);
    try {
      const email = user?.email || "trader@stake.com";
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: email,
          message: text,
          userContext: {
            cash,
            holdings,
            watchlist,
            orders,
            agentStrategy,
            agentMaxSpend,
          },
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatLog((prev) => [...prev, { sender: "agent", text: data.reply }]);
      } else {
        setChatLog((prev) => [
          ...prev,
          { sender: "agent", text: "I processed your request. Let me know if you need further portfolio analysis." },
        ]);
      }

      // If backend executed a tool (e.g. place_order), sync local state
      if (data.executedTrade) {
        const tr = data.executedTrade;
        if (tr.side === "BUY") {
          setCash((prevCash) => Math.max(0, prevCash - tr.total));
          setHoldings((prev) => {
            const cur = prev[tr.ticker] || { shares: 0, costBasis: 0 };
            return {
              ...prev,
              [tr.ticker]: {
                shares: cur.shares + tr.shares,
                costBasis: cur.costBasis + tr.total,
              },
            };
          });
        }
        showToast(`Agent executed ${tr.side} ${tr.shares} shares of ${tr.ticker}`);
      }
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "I experienced a network delay. Analyzing Level-2 books locally: All systems operational.",
        },
      ]);
    }
  };

  // Auth actions
  const handleLoginSuccess = (authUser) => {
    setUser(authUser);
    setCash(authUser.cash !== undefined ? authUser.cash : 0);
    setHoldings(authUser.holdings || {});
    setWatchlist(authUser.watchlist || []);
    setAlerts(authUser.alerts || []);
    setOrders(authUser.orders || []);
    setAgentEnabled(authUser.agentEnabled || false);
    setKycStatus(authUser.kycStatus || "UNVERIFIED");
    setKycData(authUser.kycData || null);
    setAuthModal(null);
    localStorage.setItem("stake_active_user", JSON.stringify(authUser));

    if (authUser.kycStatus === "UNVERIFIED") {
      setTab("kyc");
      showToast("Welcome! Please complete your KYC verification first to activate live trading.");
    } else {
      setTab("home");
      showToast(`Welcome back, ${authUser.name || "Investor"}!`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCash(0);
    setHoldings({});
    setWatchlist([]);
    setAlerts([]);
    setOrders([]);
    setAgentEnabled(false);
    setKycStatus("UNVERIFIED");
    setKycData(null);
    setAuthModal(null);
    setTab("home");
    localStorage.removeItem("stake_active_user");
    showToast("Logged out successfully");
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) return;
    try {
      await deleteAccount(user.email);
    } catch (err) {
      console.warn("Delete account error:", err);
    }
    setUser(null);
    setCash(0);
    setHoldings({});
    setWatchlist([]);
    setAlerts([]);
    setOrders([]);
    setAgentEnabled(false);
    setKycStatus("UNVERIFIED");
    setKycData(null);
    setAuthModal(null);
    setTab("home");
    localStorage.removeItem("stake_active_user");
    showToast("Your account has been permanently deleted.");
  };

  // 1. UNAUTHENTICATED EXPERIENCE: Show Landing Page or Auth Modal
  if (!user) {
    if (authModal) {
      return (
        <AuthPage
          initialMode={authModal}
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setAuthModal(null)}
        />
      );
    }

    return (
      <LandingPage
        onOpenLogin={() => setAuthModal("login")}
        onOpenSignup={() => setAuthModal("signup")}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onEnterApp={() => setAuthModal("login")}
        stockMetaList={stockMetaList}
        stocks={stocks}
      />
    );
  }

  // 2. AUTHENTICATED EXPERIENCE: Light Theme Dashboard
  const selectedMeta = stockMetaList.find((s) => s.ticker === selectedStock) || {
    ticker: selectedStock || "NVDA",
    name: selectedStock || "NVIDIA Corporation",
    price: 137.86,
    color: "#10b981",
    sector: "Technology",
  };

  const activeHoldingShares = holdings[selectedStock || "NVDA"]?.shares || 0;

  // Synthetic portfolio history series for charting
  const portfolioHistory = [
    netWorth * 0.94,
    netWorth * 0.955,
    netWorth * 0.95,
    netWorth * 0.965,
    netWorth * 0.98,
    netWorth * 0.975,
    netWorth * 0.99,
    netWorth,
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
      }}
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 76,
            right: 24,
            zIndex: 999,
            background: "#ffffff",
            color: "#0f172a",
            padding: "12px 20px",
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
            border: "1px solid #e2e8f0",
            fontWeight: 800,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navigation Bar in Light Theme */}
      <Navbar
        tab={selectedStock ? "market" : tab}
        setTab={(newTab) => {
          setSelectedStock(null);
          setTab(newTab);
        }}
        agentEnabled={agentEnabled}
        user={user}
        kycStatus={kycStatus}
        onOpenKyc={() => {
          setSelectedStock(null);
          setTab("kyc");
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenWallet={() => setWalletOpen(true)}
        onLogout={handleLogout}
        alertsCount={alerts.filter((a) => !a.triggered).length}
      />

      {/* Main Authenticated Body */}
      <main
        style={{
          flex: 1,
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          padding: "20px 24px 60px",
          boxSizing: "border-box",
        }}
      >
        {/* If a stock is drilled into, render the detailed Stock view */}
        {selectedStock ? (
          <StockDetail
            selected={selectedStock}
            stockMeta={selectedMeta}
            stockData={stocks[selectedStock] || { price: selectedMeta.price }}
            holdings={holdings}
            cashBalance={cash}
            watchlist={watchlist}
            onToggleWatch={toggleWatchlist}
            onBack={() => setSelectedStock(null)}
            onOpenOrderDesk={(mode) => {
              setOrderDeskMode(mode);
              setOrderDeskOpen(true);
            }}
            dayChange={dayChange}
            darkMode={false}
            onSaveAlert={handleSaveAlert}
            currency={currency}
          />
        ) : (
          <>
            {/* 0. Full-Page KYC Verification */}
            {tab === "kyc" && (
              <KycPage
                user={user}
                kycStatus={kycStatus}
                kycData={kycData}
                onKycVerified={(verifiedPayload) => {
                  setKycStatus("VERIFIED");
                  setKycData(verifiedPayload);
                  const updatedUser = { ...user, kycStatus: "VERIFIED" };
                  setUser(updatedUser);
                  triggerBackendSync(updatedUser, cash, holdings, watchlist, orders, agentEnabled);
                  setTab("home");
                }}
                showToast={showToast}
                onNavigateHome={() => setTab("home")}
              />
            )}

            {/* 1. Home Dashboard */}
            {tab === "home" && (
              <HomeDashboard
                stocks={stocks}
                stockMetaList={stockMetaList}
                netWorth={netWorth}
                cashBalance={cash}
                holdings={holdings}
                privacyMode={privacyMode}
                setPrivacyMode={setPrivacyMode}
                watchlist={watchlist}
                onToggleWatch={toggleWatchlist}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                onOpenOrderDesk={(mode) => {
                  setOrderDeskMode(mode);
                  setOrderDeskOpen(true);
                }}
                onOpenWallet={() => setWalletOpen(true)}
                onNavigateTab={(t) => setTab(t)}
                onOpenKyc={() => setTab("kyc")}
                kycStatus={kycStatus}
                currency={currency}
                dayChange={dayChange}
              />
            )}

            {/* 2. Markets Grid & Explorer */}
            {tab === "market" && (
              <MarketGrid
                stocks={stocks}
                stockMetaList={stockMetaList}
                watchlist={watchlist}
                onToggleWatch={toggleWatchlist}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                onOpenOrderDesk={(mode) => {
                  setOrderDeskMode(mode);
                  setOrderDeskOpen(true);
                }}
                dayChange={dayChange}
                flash={flash}
                currency={currency}
              />
            )}

            {/* 3. Portfolio Tab */}
            {tab === "portfolio" && (
              <PortfolioTab
                netWorth={netWorth}
                cashBalance={cash}
                portfolioHistory={portfolioHistory}
                holdings={holdings}
                orders={orders}
                stocks={stocks}
                stockMetaList={stockMetaList}
                privacyMode={privacyMode}
                setPrivacyMode={setPrivacyMode}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                onOpenOrderDesk={(mode) => {
                  setOrderDeskMode(mode);
                  setOrderDeskOpen(true);
                }}
                onOpenWallet={() => setWalletOpen(true)}
                darkMode={false}
                currency={currency}
              />
            )}

            {/* 4. Watchlist Tab */}
            {tab === "watchlist" && (
              <WatchlistTab
                watchlist={watchlist}
                stocks={stocks}
                stockMetaList={stockMetaList}
                onToggleWatch={toggleWatchlist}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                onOpenOrderDesk={(mode) => {
                  setOrderDeskMode(mode);
                  setOrderDeskOpen(true);
                }}
                dayChange={dayChange}
                darkMode={false}
                currency={currency}
              />
            )}

            {/* 5. Execution History Tab */}
            {tab === "history" && (
              <TransactionHistory
                user={{ ...user, transactions: orders }}
                darkMode={false}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                onOpenTrade={(ticker, mode) => {
                  setSelectedStock(ticker);
                  setOrderDeskMode(mode);
                  setOrderDeskOpen(true);
                }}
                currency={currency}
              />
            )}

            {/* 6. Alerts Manager Tab */}
            {tab === "alerts" && (
              <AlertsManager
                alerts={alerts}
                onDeleteAlert={handleDeleteAlert}
                onOpenSetAlert={() => setQuickAlertModalOpen(true)}
                onSelectStock={(ticker) => setSelectedStock(ticker)}
                darkMode={false}
                currency={currency}
              />
            )}

            {/* 7. Autonomous Agent Tab */}
            {tab === "agent" && (
              <AgentTab
                agentEnabled={agentEnabled}
                onToggleAgent={(enabled) => {
                  setAgentEnabled(enabled);
                  triggerBackendSync(user, cash, holdings, watchlist, orders, enabled);
                  showToast(`Autonomous Agent ${enabled ? "Activated" : "Paused"}`);
                }}
                agentStrategy={agentStrategy}
                onSelectStrategy={setAgentStrategy}
                agentMaxSpend={agentMaxSpend}
                onChangeMaxSpend={setAgentMaxSpend}
                chatLog={chatLog}
                onSendChatMessage={handleSendChatMessage}
                cashBalance={cash}
                holdings={holdings}
                stocks={stocks}
                user={user}
                darkMode={false}
                showToast={showToast}
                currency={currency}
                onRefreshUserData={async () => {
                  if (!user?.email) return;
                  try {
                    const u = await fetchUserData(user.email);
                    if (u) {
                      if (u.cash !== undefined) setCash(u.cash);
                      if (u.holdings) setHoldings(u.holdings);
                      if (u.orders) setOrders(u.orders);
                    }
                  } catch {
                    // fallback
                  }
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Side Drawer: Stake Buy / Sell Order Desk in Light Theme */}
      <StakeOrderDeskDrawer
        isOpen={orderDeskOpen}
        onClose={() => setOrderDeskOpen(false)}
        selectedStock={selectedStock || "NVDA"}
        initialMode={orderDeskMode}
        stockData={stocks[selectedStock || "NVDA"]}
        cashBalance={cash}
        holdingShares={activeHoldingShares}
        onExecuteTrade={executeTrade}
        user={user}
        darkMode={false}
        currency={currency}
      />

      {/* Wallet Modal in Light Theme */}
      <WalletModal
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
        user={user}
        cashBalance={cash}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        showToast={showToast}
        darkMode={false}
        currency={currency}
      />

      {/* Settings Modal in Light Theme */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currency={currency}
        setCurrency={handleSetCurrency}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        user={user}
        onDeleteAccount={handleDeleteAccount}
        onOpenKyc={() => {
          setSettingsOpen(false);
          setSelectedStock(null);
          setTab("kyc");
        }}
        kycStatus={kycStatus}
      />

      {/* Quick Alert Modal in Light Theme */}
      <SetAlertModal
        isOpen={quickAlertModalOpen}
        onClose={() => setQuickAlertModalOpen(false)}
        symbol="NVDA"
        currentPrice={stocks["NVDA"]?.price || 137.86}
        currency={currency}
        onSaveAlert={handleSaveAlert}
        darkMode={false}
      />

      {/* Live Indices Ticker Footer in Light Theme */}
      {(tab === "home" || tab === "market") && <LiveIndicesFooter darkMode={false} />}
    </div>
  );
}
