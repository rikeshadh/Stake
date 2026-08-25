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
import { InteractiveTour } from "./components/InteractiveTour";
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
  setStoredAuthToken,
  clearAuthSession,
} from "./api";

function generateInitialHistory(basePrice, count = 28) {
  const arr = [basePrice];
  let cur = basePrice;

  for (let i = 1; i < count; i++) {
    const delta =
      (Math.random() - 0.49) * (basePrice * 0.012);

    arr.push(
      Math.max(basePrice * 0.7, cur + delta)
    );

    cur = arr[arr.length - 1];
  }

  return arr;
}

export default function App() {
  // =========================================================
  // Navigation & Authentication
  // =========================================================

  const [tab, setTab] = useState("home");
  const [selectedStock, setSelectedStock] =
    useState(null);

  // =========================================================
  // Authenticated User Session
  // =========================================================

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("stake_active_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.startsWith("guest") && !parsed.isGuest && !parsed.isDemo) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [guestMode, setGuestMode] = useState(false);
  const [authModal, setAuthModal] =
    useState(null);

  // =========================================================
  // KYC
  // =========================================================

  const [kycStatus, setKycStatus] =
    useState("VERIFIED");

  const [kycData, setKycData] =
    useState(null);

  // =========================================================
  // Settings & Currency
  // =========================================================

  const [currency, setCurrency] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "stake_preferred_currency"
          ) || "USD"
        );
      } catch {
        return "USD";
      }
    });

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  // =========================================================
  // Drawer & Modal States
  // =========================================================

  const [orderDeskOpen, setOrderDeskOpen] =
    useState(false);

  const [orderDeskMode, setOrderDeskMode] =
    useState("BUY");

  const [walletOpen, setWalletOpen] =
    useState(false);

  const [privacyMode, setPrivacyMode] =
    useState(false);

  const [
    quickAlertModalOpen,
    setQuickAlertModalOpen,
  ] = useState(false);

  const [tourOpen, setTourOpen] = useState(false);

  // Auto-trigger guided tutorial for first-time users or guest sandbox
  useEffect(() => {
    if (user) {
      try {
        const completed = localStorage.getItem("stake_tutorial_completed");
        if (!completed) {
          const timer = setTimeout(() => {
            setTourOpen(true);
          }, 700);
          return () => clearTimeout(timer);
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  // =========================================================
  // Portfolio & Balances
  // =========================================================

  const [cash, setCash] = useState(() =>
    user?.cash !== undefined
      ? user.cash
      : 0
  );

  const [holdings, setHoldings] =
    useState(
      () => user?.holdings || {}
    );

  const [watchlist, setWatchlist] =
    useState(
      () => user?.watchlist || []
    );

  const [orders, setOrders] =
    useState(
      () => user?.orders || []
    );

  const [alerts, setAlerts] =
    useState(
      () => user?.alerts || []
    );

  // Notification Inbox State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("stake_notifications");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: "notif-welcome",
        category: "TRADE",
        type: "buy",
        title: "Trading Terminal Active",
        message: "Welcome to Stake Equities. Live feed and order router are operational.",
        timestamp: "Just now",
        unread: true,
      },
    ];
  });

  const addNotification = useCallback((notif) => {
    const item = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: notif.category || "PRICE_ALERT",
      type: notif.type || "alert",
      title: notif.title || "Notification",
      message: notif.message || "",
      ticker: notif.ticker,
      timestamp: notif.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: true,
    };
    setNotifications((prev) => {
      const updated = [item, ...prev.slice(0, 49)];
      try {
        localStorage.setItem("stake_notifications", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      try {
        localStorage.setItem("stake_notifications", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem("stake_notifications");
    } catch {
      // ignore
    }
  }, []);

  // =========================================================
  // Autonomous Agent
  // =========================================================

  const [agentEnabled, setAgentEnabled] =
    useState(() =>
      user?.agentEnabled !== undefined
        ? user.agentEnabled
        : false
    );

  const [agentStrategy, setAgentStrategy] =
    useState(() => user?.agentStrategy || null);

  const [agentMaxSpend, setAgentMaxSpend] =
    useState(() => user?.agentMaxSpend || 5000);

  // =========================================================
  // Stocks Data & Simulation - Fetched dynamically from /api/stocks
  // =========================================================

  const [stockMetaList, setStockMetaList] = useState([]);

  const [stocks, setStocks] = useState({});

  const [flash, setFlash] =
    useState({});

  const [toast, setToast] =
    useState(null);

  const toastTimeoutRef =
    useRef(null);

  // =========================================================
  // Toast
  // =========================================================

  const showToast = useCallback(
    (msg) => {
      setToast(msg);

      if (
        toastTimeoutRef.current
      ) {
        clearTimeout(
          toastTimeoutRef.current
        );
      }

      toastTimeoutRef.current =
        setTimeout(
          () => setToast(null),
          3500
        );
    },
    []
  );

  // =========================================================
  // Currency
  // =========================================================

  const handleSetCurrency = (
    newCurr
  ) => {
    setCurrency(newCurr);

    try {
      localStorage.setItem(
        "stake_preferred_currency",
        newCurr
      );
    } catch (err) {
      console.warn(
        "Could not save currency preference:",
        err
      );
    }

    showToast(
      `Display currency set to ${newCurr}`
    );
  };

  // =========================================================
  // Fetch Initial Data
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const remoteStocks =
          await fetchStocks();

        if (
          isMounted &&
          remoteStocks &&
          remoteStocks.length > 0
        ) {
          setStockMetaList(
            remoteStocks
          );

          const map = {};
          remoteStocks.forEach((s) => {
            map[s.ticker] = {
              price: s.price,
              open: s.open || s.price,
              high: s.high || s.price * 1.025,
              low: s.low || s.price * 0.975,
              previousClose: s.previousClose || s.price,
              history: generateInitialHistory(s.price, 28),
              dayPoints: generateInitialHistory(s.price, 36),
              change: s.change || 0,
              pct: s.changePercent || 0,
            };
          });

          setStocks((prev) => ({ ...map, ...prev }));
        }
      } catch (err) {
        console.warn(
          "Backend stocks load error:",
          err
        );
      }

      if (user?.email) {
        try {
          const liveUser = await fetchUserData(user.email);
          if (isMounted && liveUser) {
            setUser((prev) => ({ ...(prev || {}), ...liveUser }));
            if (liveUser.cash !== undefined) setCash(liveUser.cash);
            if (liveUser.holdings) setHoldings(liveUser.holdings);
            if (liveUser.watchlist) setWatchlist(liveUser.watchlist);
            if (liveUser.orders) setOrders(liveUser.orders);
            if (liveUser.agentEnabled !== undefined) setAgentEnabled(liveUser.agentEnabled);
          }
        } catch (err) {
          console.warn("User data sync fallback:", err);
        }

        try {
          const kycRes =
            await fetchKycStatus(
              user.email
            );

          if (
            isMounted &&
            kycRes
          ) {
            setKycStatus(
              kycRes.status ||
                "VERIFIED"
            );

            setKycData(
              kycRes
            );
          }
        } catch {
          // Ignore fallback
        }

        try {
          const userAlerts =
            await fetchAlerts(
              user.email
            );

          if (
            isMounted &&
            Array.isArray(
              userAlerts
            ) &&
            userAlerts.length >
              0
          ) {
            setAlerts(
              userAlerts
            );
          }
        } catch {
          // Ignore fallback
        }
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  // =========================================================
  // Sync State
  // =========================================================

  const triggerBackendSync =
    useCallback(
      async (
        curUser,
        curCash,
        curHoldings,
        curWatchlist,
        curOrders,
        curAgentEnabled = false
      ) => {
        if (!curUser) return;

        try {
          localStorage.setItem(
            "stake_active_user",
            JSON.stringify(
              curUser
            )
          );
        } catch {
          // Ignore
        }

        try {
          await syncUserState({
            user: curUser,
            cash: curCash,
            holdings:
              curHoldings,
            watchlist:
              curWatchlist,
            orders: curOrders,
            agentEnabled:
              curAgentEnabled,
          });
        } catch {
          // Ignore fallback
        }
      },
      []
    );

  // =========================================================
  // Live Market Simulation
  // =========================================================

  useEffect(() => {
    const interval =
      setInterval(() => {
        setStocks((prev) => {
          const next = {
            ...prev,
          };

          const updatedFlash = {};

          const count =
            Math.floor(
              Math.random() * 4
            ) + 3;

          for (
            let i = 0;
            i < count;
            i++
          ) {
            const randomMeta =
              stockMetaList[
                Math.floor(
                  Math.random() *
                    stockMetaList.length
                )
              ];

            if (!randomMeta)
              continue;

            const ticker =
              randomMeta.ticker;

            const current =
              prev[ticker] || {
                price:
                  randomMeta.price,

                open:
                  randomMeta.price,

                history: [
                  randomMeta.price,
                ],

                dayPoints: [
                  randomMeta.price,
                ],
              };

            const volatility =
              0.0035;

            const deltaPct =
              (Math.random() -
                0.49) *
              volatility;

            const newPrice =
              Math.max(
                1,
                Math.round(
                  current.price *
                    (1 +
                      deltaPct) *
                    100
                ) / 100
              );

            const hist = [
              ...(current.history ||
                [newPrice]),
            ];

            hist.push(
              newPrice
            );

            if (
              hist.length >
              32
            ) {
              hist.shift();
            }

            const dayPts = [
              ...(current.dayPoints ||
                [newPrice]),
            ];

            dayPts.push(
              newPrice
            );

            if (
              dayPts.length >
              60
            ) {
              dayPts.shift();
            }

            next[ticker] = {
              ...current,

              price:
                newPrice,

              high:
                Math.max(
                  current.high ||
                    newPrice,
                  newPrice
                ),

              low:
                Math.min(
                  current.low ||
                    newPrice,
                  newPrice
                ),

              history:
                hist,

              dayPoints:
                dayPts,
            };

            updatedFlash[ticker] =
              newPrice >
              current.price
                ? "up"
                : "down";
          }

          setFlash(
            updatedFlash
          );

          setTimeout(
            () =>
              setFlash({}),
            500
          );

          return next;
        });
      }, 2000);

    return () =>
      clearInterval(
        interval
      );
  }, [stockMetaList]);

  // =========================================================
  // Price Alerts
  // =========================================================

  useEffect(() => {
    if (!alerts.length)
      return;

    alerts.forEach((alt) => {
      const p =
        stocks[alt.symbol]
          ?.price;

      if (!p) return;

      if (
        alt.condition ===
          "ABOVE" &&
        p >=
          alt.targetPrice &&
        !alt.triggered
      ) {
        showToast(
          `🔔 Price Alert: ${alt.symbol} reached $${p.toFixed(
            2
          )} (Target: $${alt.targetPrice})`
        );

        addNotification({
          category: "PRICE_ALERT",
          type: "alert",
          ticker: alt.symbol,
          title: `Price Alert: ${alt.symbol} Breached Target`,
          message: `${alt.symbol} reached $${p.toFixed(2)} rising above your target of $${alt.targetPrice.toFixed(2)}.`,
        });

        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alt.id
              ? {
                  ...a,
                  triggered:
                    true,
                }
              : a
          )
        );
      } else if (
        alt.condition ===
          "BELOW" &&
        p <=
          alt.targetPrice &&
        !alt.triggered
      ) {
        showToast(
          `🔔 Price Alert: ${alt.symbol} dropped to $${p.toFixed(
            2
          )} (Target: $${alt.targetPrice})`
        );

        addNotification({
          category: "PRICE_ALERT",
          type: "alert",
          ticker: alt.symbol,
          title: `Price Alert: ${alt.symbol} Dropped Below Target`,
          message: `${alt.symbol} dropped to $${p.toFixed(2)} hitting your support trigger of $${alt.targetPrice.toFixed(2)}.`,
        });

        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alt.id
              ? {
                  ...a,
                  triggered:
                    true,
                }
              : a
          )
        );
      }
    });
  }, [
    stocks,
    alerts,
    showToast,
    addNotification,
  ]);

  // =========================================================
  // Net Worth
  // =========================================================

  const totalStockValue =
    Object.keys(
      holdings
    ).reduce(
      (
        sum,
        ticker
      ) => {
        const curPrice =
          stocks[ticker]
            ?.price || 0;

        return (
          sum +
          (holdings[
            ticker
          ]?.shares || 0) *
            curPrice
        );
      },
      0
    );

  const netWorth =
    cash +
    totalStockValue;

  // =========================================================
  // Day Change
  // =========================================================

  const dayChange =
    useCallback(
      (ticker) => {
        const cur =
          stocks[ticker]
            ?.price || 100;

        const open =
          stocks[ticker]
            ?.open || cur;

        return open > 0
          ? (cur - open) /
              open
          : 0;
      },
      [stocks]
    );

  // =========================================================
  // Watchlist
  // =========================================================

  const toggleWatchlist =
    (ticker) => {
      setWatchlist((prev) => {
        const next =
          prev.includes(
            ticker
          )
            ? prev.filter(
                (t) =>
                  t !== ticker
              )
            : [
                ...prev,
                ticker,
              ];

        triggerBackendSync(
          user,
          cash,
          holdings,
          next,
          orders,
          agentEnabled
        );

        showToast(
          next.includes(
            ticker
          )
            ? `Added ${ticker} to Watchlist`
            : `Removed ${ticker} from Watchlist`
        );

        return next;
      });
    };

  // =========================================================
  // Trade Execution
  // =========================================================

  const executeTrade =
    async (
      arg1,
      arg2,
      arg3,
      arg4,
      arg5
    ) => {
      let ticker;
      let side;
      let shares;
      let price;
      let orderType;
      let validity;

      if (
        arg1 &&
        typeof arg1 ===
          "object"
      ) {
        ticker =
          arg1.ticker ||
          arg1.symbol ||
          arg1.scrip ||
          arg1.stock ||
          selectedStock ||
          "NVDA";

        side =
          arg1.side ||
          arg1.type ||
          arg1.mode ||
          "BUY";

        shares =
          Number(
            arg1.shares ||
              arg1.qty ||
              arg1.parsedQty ||
              1
          );

        price =
          Number(
            arg1.price ||
              arg1.effectivePrice ||
              stocks[ticker]
                ?.price ||
              150
          );

        orderType =
          arg1.orderType ||
          "MKT";

        validity =
          arg1.validity ||
          "DAY";
      } else {
        ticker =
          arg1 ||
          selectedStock ||
          "NVDA";

        side =
          arg2 || "BUY";

        if (
          arg4 !==
            undefined &&
          arg5 !==
            undefined
        ) {
          shares =
            Number(arg4);

          price =
            Number(arg5);
        } else if (
          arg3 !==
          undefined
        ) {
          shares =
            Number(arg3);

          price =
            Number(
              arg4 !==
                undefined
                ? arg4
                : stocks[ticker]
                    ?.price ||
                  150
            );
        } else {
          shares = 1;

          price =
            Number(
              stocks[
                ticker
              ]?.price ||
                150
            );
        }

        orderType =
          "MKT";

        validity =
          "DAY";
      }

      const cleanTicker =
        String(
          ticker ||
            "NVDA"
        ).toUpperCase();

      const cleanSide =
        String(
          side || "BUY"
        ).toUpperCase();

      const isBuy =
        cleanSide ===
        "BUY";

      const tradeShares =
        Math.max(
          0.0001,
          Number(shares) ||
            1
        );

      const tradePrice =
        Math.max(
          0.01,
          Number(price) ||
            stocks[
              cleanTicker
            ]?.price ||
            150
        );

      const tradeValue =
        Number(
          (
            tradeShares *
            tradePrice
          ).toFixed(2)
        );

      const fee =
        Number(
          (
            tradeValue *
            0.004
          ).toFixed(2)
        );

      const totalCost =
        Number(
          (
            tradeValue +
            fee
          ).toFixed(2)
        );

      if (isBuy) {
        if (
          cash <
          totalCost
        ) {
          showToast(
            "Insufficient collateral funds!"
          );

          return false;
        }

        const newCash =
          cash -
          totalCost;

        setCash(
          newCash
        );

        setHoldings(
          (prev) => {
            const cur =
              prev[
                cleanTicker
              ] || {
                shares: 0,
                costBasis:
                  0,
              };

            const updated = {
              ...prev,

              [cleanTicker]: {
                shares:
                  cur.shares +
                  tradeShares,

                costBasis:
                  cur.costBasis +
                  tradeValue,
              },
            };

            const newOrder =
              {
                id: `STK-${Math.floor(
                  1000 +
                    Math.random() *
                      9000
                )}`,

                scrip:
                  cleanTicker,

                stock:
                  cleanTicker,

                ticker:
                  cleanTicker,

                type:
                  "BUY",

                side:
                  "BUY",

                shares:
                  tradeShares,

                price:
                  tradePrice,

                total:
                  tradeValue,

                orderType,

                validity,

                status:
                  "EXECUTED",

                timestamp:
                  Date.now(),

                date:
                  new Date().toISOString(),
              };

            const newOrders =
              [
                newOrder,
                ...orders,
              ];

            setOrders(
              newOrders
            );

            triggerBackendSync(
              user,
              newCash,
              updated,
              watchlist,
              newOrders,
              agentEnabled
            );

            submitOrder(
              newOrder
            ).catch(
              () => {}
            );

            return updated;
          }
        );

        setOrderDeskOpen(
          false
        );

        showToast(
          `Bought ${fmtShares(
            tradeShares
          )} shares of ${cleanTicker} at $${tradePrice.toFixed(
            2
          )}`
        );

        addNotification({
          category: "TRADE",
          type: "buy",
          ticker: cleanTicker,
          title: `Buy Order Executed: ${cleanTicker}`,
          message: `Purchased ${fmtShares(tradeShares)} shares of ${cleanTicker} at $${tradePrice.toFixed(2)} ($${tradeValue.toFixed(2)} total).`,
        });

        return true;
      }

      const curHolding =
        holdings[
          cleanTicker
        ]?.shares || 0;

      if (
        curHolding <
        tradeShares
      ) {
        showToast(
          `Insufficient shares! You own ${fmtShares(
            curHolding
          )} shares.`
        );

        return false;
      }

      const proceeds =
        Number(
          (
            tradeValue -
            fee
          ).toFixed(2)
        );

      const newCash =
        cash +
        proceeds;

      setCash(
        newCash
      );

      setHoldings(
        (prev) => {
          const cur =
            prev[
              cleanTicker
            ] || {
              shares: 0,
              costBasis:
                0,
            };

          const remainingShares =
            cur.shares -
            tradeShares;

          const updated = {
            ...prev,
          };

          if (
            remainingShares <=
            0.0001
          ) {
            delete updated[
              cleanTicker
            ];
          } else {
            updated[
              cleanTicker
            ] = {
              shares:
                remainingShares,

              costBasis:
                Number(
                  (
                    cur.costBasis *
                    (remainingShares /
                      cur.shares)
                  ).toFixed(2)
                ),
            };
          }

          const newOrder =
            {
              id: `STK-${Math.floor(
                1000 +
                  Math.random() *
                    9000
              )}`,

              scrip:
                cleanTicker,

              stock:
                cleanTicker,

              ticker:
                cleanTicker,

              type:
                "SELL",

              side:
                "SELL",

              shares:
                tradeShares,

              price:
                tradePrice,

              total:
                tradeValue,

              orderType,

              validity,

              status:
                "EXECUTED",

              timestamp:
                Date.now(),

              date:
                new Date().toISOString(),
            };

          const newOrders =
            [
              newOrder,
              ...orders,
            ];

          setOrders(
            newOrders
          );

          triggerBackendSync(
            user,
            newCash,
            updated,
            watchlist,
            newOrders,
            agentEnabled
          );

          submitOrder(
            newOrder
          ).catch(
            () => {}
          );

          return updated;
        }
      );

      setOrderDeskOpen(
        false
      );

      showToast(
        `Sold ${fmtShares(
          tradeShares
        )} shares of ${cleanTicker} at $${tradePrice.toFixed(
          2
        )}`
      );

      addNotification({
        category: "TRADE",
        type: "sell",
        ticker: cleanTicker,
        title: `Sell Order Executed: ${cleanTicker}`,
        message: `Sold ${fmtShares(tradeShares)} shares of ${cleanTicker} at $${tradePrice.toFixed(2)} ($${proceeds.toFixed(2)} proceeds).`,
      });

      return true;
    };

  // =========================================================
  // Wallet Actions
  // =========================================================

  const handleDeposit =
    (amt) => {
      const newCash =
        cash + amt;

      setCash(
        newCash
      );

      triggerBackendSync(
        user,
        newCash,
        holdings,
        watchlist,
        orders,
        agentEnabled
      );

      showToast(
        `Deposited $ ${amt.toLocaleString()} to Collateral Account`
      );
    };

  const handleWithdraw =
    (amt) => {
      if (cash < amt) {
        showToast(
          "Insufficient balance for withdrawal!"
        );

        return;
      }

      const newCash =
        cash - amt;

      setCash(
        newCash
      );

      triggerBackendSync(
        user,
        newCash,
        holdings,
        watchlist,
        orders,
        agentEnabled
      );

      showToast(
        `Withdrew $ ${amt.toLocaleString()} from Account`
      );
    };

  // =========================================================
  // Alerts
  // =========================================================

  const handleSaveAlert =
    async (
      newAlert
    ) => {
      const alertItem =
        {
          ...newAlert,

          id: `alt-${Date.now()}`,

          userId:
            user?.email,

          createdAt:
            Date.now(),
        };

      setAlerts(
        (prev) => [
          alertItem,
          ...prev,
        ]
      );

      try {
        await createPriceAlert(
          alertItem
        );
      } catch {
        // Fallback
      }

      showToast(
        `Price trigger set for ${alertItem.symbol} at $${alertItem.targetPrice}`
      );
    };

  const handleDeleteAlert =
    async (id) => {
      setAlerts((prev) =>
        prev.filter(
          (a) => a.id !== id
        )
      );

      try {
        await deletePriceAlert(
          id
        );
      } catch {
        // Fallback
      }

      showToast(
        "Alert removed"
      );
    };

  // =========================================================
  // Authentication
  // =========================================================

  const handleLoginSuccess = useCallback(
    (authUser, token) => {
      setUser(
        authUser
      );

      setCash(
        authUser.cash !==
          undefined
          ? authUser.cash
          : 0
      );

      setHoldings(
        authUser.holdings ||
          {}
      );

      setWatchlist(
        authUser.watchlist ||
          []
      );

      setAlerts(
        authUser.alerts ||
          []
      );

      setOrders(
        authUser.orders ||
          []
      );

      setAgentEnabled(
        authUser.agentEnabled ||
          false
      );

      setKycStatus(
        authUser.kycStatus ||
          "UNVERIFIED"
      );

      setKycData(
        authUser.kycData ||
          null
      );

      setAuthModal(
        null
      );

      if (token) {
        setStoredAuthToken(token);
      }

      try {
        localStorage.setItem(
          "stake_active_user",
          JSON.stringify(
            authUser
          )
        );
      } catch {
        // ignore
      }

      setSelectedStock(null);

      if (authUser.kycStatus === "UNVERIFIED") {
        setTab("kyc");
        showToast(
          "Welcome! Please complete your KYC verification first to activate live trading."
        );
      } else {
        setTab("home");
        showToast(
          `Welcome back, ${
            authUser.name ||
            "Investor"
          }!`
        );
      }
    },
    [showToast]
  );

  const handleLogout = () => {
    setUser(null);
    setGuestMode(false);
    setSelectedStock(null);
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
    clearAuthSession();
    showToast("Logged out successfully");
  };

  const handleDeleteAccount =
    async () => {
      if (!user?.email)
        return;

      try {
        await deleteAccount(
          user.email
        );
      } catch (err) {
        console.warn(
          "Delete account error:",
          err
        );
      }

      setUser(
        null
      );

      setCash(
        0
      );

      setHoldings(
        {}
      );

      setWatchlist(
        []
      );

      setAlerts(
        []
      );

      setOrders(
        []
      );

      setAgentEnabled(
        false
      );

      setKycStatus(
        "UNVERIFIED"
      );

      setKycData(
        null
      );

      setAuthModal(
        null
      );

      setTab(
        "home"
      );

      clearAuthSession();

      showToast(
        "Your account has been permanently deleted."
      );
    };

  const handleDemoGuestLogin = useCallback(() => {
    const demoUser = {
      email: "guest.trader@stake.com",
      name: "Guest Trader",
      accountNumber: "STK-GUEST-001",
      cash: 100000.0,
      kycStatus: "VERIFIED",
      isGuest: true,
      isDemo: true,
      watchlist: [],
      agentEnabled: false,
      agentStrategy: null,
      holdings: {},
      orders: [],
      alerts: [],
      transactions: [
        { type: "DEPOSIT", amount: 100000, gateway: "Instant Sandbox Collateral", timestamp: new Date().toISOString() }
      ],
    };
    const demoToken = `stk_guest_${Date.now()}`;
    setStoredAuthToken(demoToken);
    try {
      sessionStorage.setItem("stake_guest_session", JSON.stringify(demoUser));
      localStorage.removeItem("stake_active_user");
    } catch {
      // ignore
    }
    handleLoginSuccess(demoUser, demoToken);
  }, [handleLoginSuccess]);

  // =========================================================
  // Unauthenticated / Auth Modal / Guest Routing
  // =========================================================

  if (!user && !guestMode) {
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
      <div className="relative min-h-screen">
        <LandingPage
          onOpenLogin={() => setAuthModal("login")}
          onOpenSignup={() => setAuthModal("signup")}
          onOpenAuth={(mode) => setAuthModal(mode)}
          onEnterApp={handleDemoGuestLogin}
          stockMetaList={stockMetaList}
          stocks={stocks}
        />
      </div>
    );
  }

  if (authModal) {
    return (
      <AuthPage
        initialMode={authModal}
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setAuthModal(null)}
      />
    );
  }

  // =========================================================
  // Authenticated Experience
  // =========================================================

  const selectedMeta =
    stockMetaList.find(
      (s) =>
        s.ticker ===
        selectedStock
    ) || {
      ticker:
        selectedStock ||
        "NVDA",

      name:
        selectedStock ||
        "NVIDIA Corporation",

      price:
        137.86,

      color:
        "#10b981",

      sector:
        "Technology",
    };

  const activeHoldingShares =
    holdings[
      selectedStock ||
        "NVDA"
    ]?.shares || 0;

  // =========================================================
  // Portfolio History
  // =========================================================

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

  // =========================================================
  // Main UI
  // =========================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",

        background:
          "#f8fafc",

        color:
          "#0f172a",

        fontFamily:
          "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

        display:
          "flex",

        flexDirection:
          "column",

        textAlign:
          "left",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position:
              "fixed",

            top: 76,

            right: 24,

            zIndex: 999,

            background:
              "#ffffff",

            color:
              "#0f172a",

            padding:
              "12px 20px",

            borderRadius:
              14,

            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.12)",

            border:
              "1px solid #e2e8f0",

            fontWeight:
              800,

            fontSize:
              13,

            display:
              "flex",

            alignItems:
              "center",

            gap: 10,

            animation:
              "fadeIn 0.2s ease",
          }}
        >
          <span
            style={{
              display:
                "inline-block",

              width:
                8,

              height:
                8,

              borderRadius:
                "50%",

              background:
                "#10b981",
            }}
          />

          <span>
            {toast}
          </span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        tab={
          selectedStock
            ? "market"
            : tab
        }

        setTab={(newTab) => {
          setSelectedStock(
            null
          );

          setTab(
            newTab
          );
        }}

        agentEnabled={
          agentEnabled
        }

        user={
          user
        }

        isGuestMode={
          !user && guestMode
        }

        onOpenAuth={(mode) =>
          setAuthModal(mode)
        }

        onExitGuest={() => {
          clearAuthSession();
          setUser(null);
          setGuestMode(false);
          setSelectedStock(null);
          setTab("home");
        }}

        kycStatus={
          kycStatus
        }

        onOpenKyc={() => {
          setSelectedStock(
            null
          );

          setTab(
            "kyc"
          );
        }}

        onOpenSettings={() =>
          setSettingsOpen(
            true
          )
        }

        onOpenTour={() =>
          setTourOpen(
            true
          )
        }

        onOpenWallet={() =>
          setWalletOpen(
            true
          )
        }

        onLogout={
          handleLogout
        }

        alertsCount={
          alerts.filter(
            (a) =>
              !a.triggered
          ).length
        }
        notifications={notifications}
        onAddNotification={addNotification}
        onMarkAllRead={markAllNotificationsRead}
        onClearNotifications={clearAllNotifications}
        onSelectStock={(t) => {
          setSelectedStock(t);
          setTab("market");
        }}
        onOpenTrade={(t, side) => {
          setSelectedStock(t);
          setOrderDeskMode(side || "BUY");
          setOrderDeskOpen(true);
        }}
      />

      {/* Main */}
      <main
        style={{
          flex:
            1,

          maxWidth:
            1400,

          width:
            "100%",

          margin:
            "0 auto",

          padding:
            "20px 24px 60px",

          boxSizing:
            "border-box",
        }}
      >
        {/* Stock Detail */}
        {selectedStock ? (
          <StockDetail
            selected={
              selectedStock
            }

            stockMeta={
              selectedMeta
            }

            stockData={
              stocks[
                selectedStock
              ] || {
                price:
                  selectedMeta.price,
              }
            }

            holdings={
              holdings
            }

            cashBalance={
              cash
            }

            watchlist={
              watchlist
            }

            onToggleWatch={
              toggleWatchlist
            }

            onBack={() =>
              setSelectedStock(
                null
              )
            }

            onOpenOrderDesk={(
              mode
            ) => {
              setOrderDeskMode(
                mode
              );

              setOrderDeskOpen(
                true
              );
            }}

            dayChange={
              dayChange
            }

            darkMode={
              false
            }

            onSaveAlert={
              handleSaveAlert
            }

            currency={
              currency
            }
          />
        ) : (
          <>
            {/* KYC */}
            {tab === "kyc" && (
              <KycPage
                user={
                  user
                }

                kycStatus={
                  kycStatus
                }

                kycData={
                  kycData
                }

                onKycVerified={(
                  verifiedPayload
                ) => {
                  setKycStatus(
                    "VERIFIED"
                  );

                  setKycData(
                    verifiedPayload
                  );

                  const updatedUser =
                    {
                      ...user,
                      kycStatus:
                        "VERIFIED",
                    };

                  setUser(
                    updatedUser
                  );

                  triggerBackendSync(
                    updatedUser,
                    cash,
                    holdings,
                    watchlist,
                    orders,
                    agentEnabled
                  );

                  setTab(
                    "home"
                  );
                }}

                showToast={
                  showToast
                }

                onNavigateHome={() =>
                  setTab(
                    "home"
                  )
                }
              />
            )}

            {/* Home */}
            {tab === "home" && (
              <HomeDashboard
                stocks={
                  stocks
                }

                stockMetaList={
                  stockMetaList
                }

                netWorth={
                  netWorth
                }

                cashBalance={
                  cash
                }

                holdings={
                  holdings
                }

                privacyMode={
                  privacyMode
                }

                setPrivacyMode={
                  setPrivacyMode
                }

                watchlist={
                  watchlist
                }

                onToggleWatch={
                  toggleWatchlist
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                onOpenOrderDesk={(
                  mode
                ) => {
                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                onOpenWallet={() =>
                  setWalletOpen(
                    true
                  )
                }

                onNavigateTab={(
                  t
                ) =>
                  setTab(t)
                }

                onOpenKyc={() =>
                  setTab(
                    "kyc"
                  )
                }

                kycStatus={
                  kycStatus
                }

                currency={
                  currency
                }

                dayChange={
                  dayChange
                }
              />
            )}

            {/* Market */}
            {tab === "market" && (
              <MarketGrid
                stocks={
                  stocks
                }

                stockMetaList={
                  stockMetaList
                }

                watchlist={
                  watchlist
                }

                onToggleWatch={
                  toggleWatchlist
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                onOpenOrderDesk={(
                  mode
                ) => {
                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                dayChange={
                  dayChange
                }

                flash={
                  flash
                }

                currency={
                  currency
                }
              />
            )}

            {/* Portfolio */}
            {tab === "portfolio" && (
              <PortfolioTab
                netWorth={
                  netWorth
                }

                cashBalance={
                  cash
                }

                portfolioHistory={
                  portfolioHistory
                }

                holdings={
                  holdings
                }

                orders={
                  orders
                }

                stocks={
                  stocks
                }

                stockMetaList={
                  stockMetaList
                }

                privacyMode={
                  privacyMode
                }

                setPrivacyMode={
                  setPrivacyMode
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                onOpenOrderDesk={(
                  mode
                ) => {
                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                onOpenWallet={() =>
                  setWalletOpen(
                    true
                  )
                }

                darkMode={
                  false
                }

                currency={
                  currency
                }
              />
            )}

            {/* Watchlist */}
            {tab === "watchlist" && (
              <WatchlistTab
                watchlist={
                  watchlist
                }

                stocks={
                  stocks
                }

                stockMetaList={
                  stockMetaList
                }

                onToggleWatch={
                  toggleWatchlist
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                onOpenOrderDesk={(
                  mode
                ) => {
                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                dayChange={
                  dayChange
                }

                darkMode={
                  false
                }

                currency={
                  currency
                }
              />
            )}

            {/* History */}
            {tab === "history" && (
              <TransactionHistory
                user={{
                  ...user,
                  transactions:
                    orders,
                }}

                darkMode={
                  false
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                onOpenTrade={(
                  ticker,
                  mode
                ) => {
                  setSelectedStock(
                    ticker
                  );

                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                currency={
                  currency
                }
              />
            )}

            {/* Alerts */}
            {tab === "alerts" && (
              <AlertsManager
                alerts={
                  alerts
                }

                onDeleteAlert={
                  handleDeleteAlert
                }

                onOpenSetAlert={() =>
                  setQuickAlertModalOpen(
                    true
                  )
                }

                onSelectStock={(
                  ticker
                ) =>
                  setSelectedStock(
                    ticker
                  )
                }

                darkMode={
                  false
                }

                currency={
                  currency
                }
              />
            )}

            {/* =================================================
                AGENT
               ================================================= */}

            {tab === "agent" && (
              <AgentTab
                agentEnabled={
                  agentEnabled
                }

                onToggleAgent={(
                  enabled
                ) => {
                  setAgentEnabled(
                    enabled
                  );

                  triggerBackendSync(
                    user,
                    cash,
                    holdings,
                    watchlist,
                    orders,
                    enabled
                  );
                }}

                agentStrategy={
                  agentStrategy
                }

                onSelectStrategy={(
                  strategy
                ) => {
                  setAgentStrategy(
                    strategy
                  );
                }}

                agentMaxSpend={
                  agentMaxSpend
                }

                onChangeMaxSpend={(
                  amount
                ) => {
                  setAgentMaxSpend(
                    amount
                  );
                }}

                cashBalance={
                  cash
                }

                /* =============================================
                   IMPORTANT:
                   These are required by the new AgentTab
                   for the Insights graph.
                   ============================================= */

                holdings={
                  holdings
                }

                stocks={
                  stocks
                }

                stockMetaList={
                  stockMetaList
                }

                user={
                  user
                }

                onRefreshUserData={
                  async () => {
                    try {
                      const email =
                        user?.email;

                      if (!email) {
                        return;
                      }

                      const data =
                        await fetchUserData(
                          email
                        );

                      if (!data) {
                        return;
                      }

                      if (
                        data.cash !==
                        undefined
                      ) {
                        setCash(
                          data.cash
                        );
                      }

                      if (
                        data.holdings
                      ) {
                        setHoldings(
                          data.holdings
                        );
                      }

                      if (
                        data.watchlist
                      ) {
                        setWatchlist(
                          data.watchlist
                        );
                      }

                      if (
                        data.orders
                      ) {
                        setOrders(
                          data.orders
                        );
                      }

                      if (
                        data.agentEnabled !==
                        undefined
                      ) {
                        setAgentEnabled(
                          data.agentEnabled
                        );
                      }
                    } catch (
                      error
                    ) {
                      console.warn(
                        "Unable to refresh agent user data:",
                        error
                      );
                    }
                  }
                }

                onOpenOrderDesk={(
                  ticker,
                  mode = "BUY"
                ) => {
                  setSelectedStock(
                    ticker
                  );

                  setOrderDeskMode(
                    mode
                  );

                  setOrderDeskOpen(
                    true
                  );
                }}

                showToast={
                  showToast
                }
              />
            )}
          </>
        )}
      </main>

      {/* =====================================================
          ORDER DESK
         ===================================================== */}

      <StakeOrderDeskDrawer
        isOpen={
          orderDeskOpen
        }

        onClose={() =>
          setOrderDeskOpen(
            false
          )
        }

        selectedStock={
          selectedStock ||
          "NVDA"
        }

        initialMode={
          orderDeskMode
        }

        stockData={
          stocks[
            selectedStock ||
              "NVDA"
          ]
        }

        cashBalance={
          cash
        }

        holdingShares={
          activeHoldingShares
        }

        onExecuteTrade={
          executeTrade
        }

        user={
          user
        }

        darkMode={
          false
        }

        currency={
          currency
        }
      />

      {/* =====================================================
          WALLET
         ===================================================== */}

      <WalletModal
        isOpen={
          walletOpen
        }

        onClose={() =>
          setWalletOpen(
            false
          )
        }

        user={
          user
        }

        cashBalance={
          cash
        }

        privacyMode={
          privacyMode
        }

        setPrivacyMode={
          setPrivacyMode
        }

        onDeposit={
          handleDeposit
        }

        onWithdraw={
          handleWithdraw
        }

        showToast={
          showToast
        }

        darkMode={
          false
        }

        currency={
          currency
        }
      />

      {/* =====================================================
          SETTINGS
         ===================================================== */}

      <SettingsModal
        isOpen={
          settingsOpen
        }

        onClose={() =>
          setSettingsOpen(
            false
          )
        }

        currency={
          currency
        }

        setCurrency={
          handleSetCurrency
        }

        privacyMode={
          privacyMode
        }

        setPrivacyMode={
          setPrivacyMode
        }

        user={
          user
        }

        onDeleteAccount={
          handleDeleteAccount
        }

        onOpenKyc={() => {
          setSettingsOpen(
            false
          );

          setSelectedStock(
            null
          );

          setTab(
            "kyc"
          );
        }}

        kycStatus={
          kycStatus
        }

        onOpenTour={() =>
          setTourOpen(
            true
          )
        }
      />

      {/* =====================================================
          INTERACTIVE GUIDED TOUR
         ===================================================== */}

      <InteractiveTour
        isOpen={
          tourOpen
        }

        onClose={() =>
          setTourOpen(
            false
          )
        }

        isGuest={
          Boolean(
            guestMode ||
              user?.isGuest ||
              user?.isDemo
          )
        }

        onNavigateTab={(
          targetTab
        ) => {
          setSelectedStock(
            null
          );

          setTab(
            targetTab
          );
        }}
      />

      {/* =====================================================
          QUICK ALERT
         ===================================================== */}

      <SetAlertModal
        isOpen={
          quickAlertModalOpen
        }

        onClose={() =>
          setQuickAlertModalOpen(
            false
          )
        }

        symbol="NVDA"

        currentPrice={
          stocks[
            "NVDA"
          ]?.price ||
          137.86
        }

        currency={
          currency
        }

        onSaveAlert={
          handleSaveAlert
        }

        darkMode={
          false
        }
      />

      {/* =====================================================
          LIVE INDICES FOOTER
         ===================================================== */}

      {(
        tab === "home" ||
        tab === "market"
      ) && (
        <LiveIndicesFooter
          darkMode={
            false
          }
        />
      )}
    </div>
  );
}