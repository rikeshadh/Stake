import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { fmt } from "../utils";

const STRATEGIES = [
  {
    id: "dip_buyer",
    name: "Dip Buyer",
    subtitle: "Buy quality pullbacks",
    description:
      "Looks for controlled pullbacks and waits for recovery confirmation.",
  },
  {
    id: "momentum",
    name: "Momentum",
    subtitle: "Follow breakouts",
    description:
      "Follows confirmed breakouts with strong price momentum.",
  },
  {
    id: "dca",
    name: "Value DCA",
    subtitle: "Accumulate gradually",
    description:
      "Builds positions gradually with smaller controlled entries.",
  },
];

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

function n(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result)
    ? result
    : fallback;
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatRelativeTime(value) {
  const date = safeDate(value);

  if (!date) {
    return "Just now";
  }

  const diff = Math.max(
    0,
    Date.now() - date.getTime()
  );

  const minutes = Math.floor(
    diff / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

async function requestJSON(url, options = {}) {
  const response = await fetch(
    url,
    options
  );

  const text =
    await response.text();

  const type =
    response.headers.get(
      "content-type"
    ) || "";

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status})`
    );
  }

  if (!type.includes("application/json")) {
    throw new Error(
      "Agent service returned an invalid response."
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "Agent service returned invalid JSON."
    );
  }
}

export function AgentTab({
  agentEnabled,
  onToggleAgent,
  agentStrategy,
  onSelectStrategy,
  agentMaxSpend,
  cashBalance,
  holdings = {},
  stocks = {},
  stockMetaList = [],
  user,
  onRefreshUserData,
  onOpenOrderDesk,
  showToast,
}) {
  const [signals, setSignals] =
    useState([]);

  const [actions, setActions] =
    useState([]);

  const [signalLoading, setSignalLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [scanLoading, setScanLoading] =
    useState(false);

  const [signalError, setSignalError] =
    useState(false);

  const [revertingId, setRevertingId] =
    useState(null);

  const [range, setRange] =
    useState("6M");

  const [chartMode, setChartMode] =
    useState("value");

  const [selectedGraphTicker, setSelectedGraphTicker] =
    useState(null);

  const [nextScan, setNextScan] =
    useState(180);

  const [lastScan, setLastScan] =
    useState(null);

  const scanRef = useRef(null);

  const currentStrategy =
    STRATEGIES.find(
      (item) =>
        item.id === agentStrategy
    ) || STRATEGIES[0];

  const cash =
    n(cashBalance);

  const maxSpend =
    n(agentMaxSpend);

  /*
   * =========================================================
   * LOAD SIGNALS
   * =========================================================
   */

  const loadSignals =
    useCallback(async () => {
      setSignalLoading(true);

      try {
        const email =
          user?.email ||
          "trader@stake.com";

        const data =
          await requestJSON(
            `/api/agent/signals?userId=${encodeURIComponent(
              email
            )}`
          );

        setSignals(
          Array.isArray(
            data?.signals
          )
            ? data.signals
            : []
        );

        setSignalError(false);
      } catch (error) {
        console.warn(
          "Agent signal error:",
          error
        );

        setSignals([]);
        setSignalError(true);
      } finally {
        setSignalLoading(false);
      }
    }, [user]);

  /*
   * =========================================================
   * LOAD ACTIVITY
   * =========================================================
   */

  const loadActions =
    useCallback(async () => {
      setActionLoading(true);

      try {
        const email =
          user?.email ||
          "trader@stake.com";

        const data =
          await requestJSON(
            `/api/agent/actions?userId=${encodeURIComponent(
              email
            )}`
          );

        setActions(
          Array.isArray(
            data?.actions
          )
            ? data.actions
            : []
        );
      } catch (error) {
        console.warn(
          "Agent action error:",
          error
        );

        setActions([]);
      } finally {
        setActionLoading(false);
      }
    }, [user]);

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  const refreshAgent =
    useCallback(async () => {
      await Promise.all([
        loadSignals(),
        loadActions(),
      ]);
    }, [
      loadSignals,
      loadActions,
    ]);

  useEffect(() => {
    refreshAgent();
  }, [refreshAgent]);

  /*
   * =========================================================
   * INITIAL GRAPH STOCK
   * =========================================================
   */

  const graphTicker =
    selectedGraphTicker ||
    signals?.[0]?.ticker ||
    Object.keys(holdings)[0] ||
    "NVDA";

  const graphStock =
    stocks?.[graphTicker];

  /*
   * =========================================================
   * GRAPH DATA
   * =========================================================
   */

  const graphValues =
    useMemo(() => {
      const history =
        Array.isArray(
          graphStock?.history
        )
          ? graphStock.history
          : [];

      if (!history.length) {
        return [];
      }

      const clean =
        history
          .map((value) =>
            n(value)
          )
          .filter(
            (value) =>
              value > 0
          );

      if (!clean.length) {
        return [];
      }

      /*
       * Current holding shares allow us to make
       * a meaningful current-position value graph.
       *
       * This is deliberately labelled:
       * "Current position value"
       * rather than historical portfolio P&L.
       */

      const shares =
        n(
          holdings?.[
            graphTicker
          ]?.shares
        );

      if (
        chartMode ===
        "price"
      ) {
        return clean;
      }

      if (
        shares <= 0
      ) {
        return clean;
      }

      return clean.map(
        (price) =>
          price * shares
      );
    }, [
      graphStock,
      holdings,
      graphTicker,
      chartMode,
    ]);

  /*
   * =========================================================
   * GRAPH RANGE
   * =========================================================
   */

  const visibleGraph =
    useMemo(() => {
      if (!graphValues.length) {
        return [];
      }

      const size =
        graphValues.length;

      const ratios = {
        "1W": 0.22,
        "1M": 0.4,
        "3M": 0.65,
        "6M": 1,
        "1Y": 1,
        ALL: 1,
      };

      const ratio =
        ratios[range] || 1;

      const count =
        Math.max(
          8,
          Math.round(
            size * ratio
          )
        );

      return graphValues.slice(
        -count
      );
    }, [
      graphValues,
      range,
    ]);

  /*
   * =========================================================
   * GRAPH SUMMARY
   * =========================================================
   */

  const graphSummary =
    useMemo(() => {
      if (
        visibleGraph.length <
        1
      ) {
        return {
          current: 0,
          change: 0,
          changePercent: 0,
          high: 0,
          low: 0,
        };
      }

      const first =
        visibleGraph[0];

      const current =
        visibleGraph[
          visibleGraph.length -
            1
        ];

      const high =
        Math.max(
          ...visibleGraph
        );

      const low =
        Math.min(
          ...visibleGraph
        );

      const change =
        current - first;

      const changePercent =
        first > 0
          ? (change / first) *
            100
          : 0;

      return {
        current,
        change,
        changePercent,
        high,
        low,
      };
    }, [visibleGraph]);

  /*
   * =========================================================
   * SIGNALS
   * =========================================================
   */

  const strongSignals =
    useMemo(
      () =>
        signals
          .filter(
            (signal) =>
              n(
                signal?.confidence
              ) >= 65
          )
          .sort(
            (a, b) =>
              n(
                b?.confidence
              ) -
              n(
                a?.confidence
              )
          ),
      [signals]
    );

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const totalTrades =
    actions.length;

  const totalDeployed =
    actions.reduce(
      (sum, action) =>
        sum +
        n(
          action?.amount
        ),
      0
    );

  const buyTrades =
    actions.filter(
      (action) =>
        String(
          action?.action ||
            "BUY"
        ).toUpperCase() ===
        "BUY"
    );

  const reversedTrades =
    actions.filter(
      (action) =>
        Boolean(
          action?.reverted
        )
    ).length;

  /*
   * =========================================================
   * AUTO SCAN
   * =========================================================
   */

  const runScan =
    useCallback(async () => {
      if (scanLoading) {
        return;
      }

      setScanLoading(true);

      try {
        const email =
          user?.email ||
          "trader@stake.com";

        const data =
          await requestJSON(
            "/api/agent/scan-and-execute",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId:
                  email,
              }),
            }
          );

        setLastScan(
          new Date()
        );

        setNextScan(180);

        await refreshAgent();

        if (
          data?.status ===
            "executed" ||
          data?.status ===
            "action_taken"
        ) {
          showToast?.(
            data?.message ||
              "Agent executed a trade."
          );

          onRefreshUserData?.();
        } else {
          showToast?.(
            data?.message ||
              "Scan completed."
          );
        }
      } catch (error) {
        console.warn(
          "Agent scan:",
          error
        );

        showToast?.(
          error?.message ||
            "Unable to run agent scan."
        );
      } finally {
        setScanLoading(
          false
        );
      }
    }, [
      scanLoading,
      user,
      refreshAgent,
      showToast,
      onRefreshUserData,
    ]);

  scanRef.current =
    runScan;

  useEffect(() => {
    if (!agentEnabled) {
      setNextScan(
        180
      );

      return;
    }

    const timer =
      window.setInterval(
        () => {
          setNextScan(
            (previous) => {
              if (
                previous <=
                1
              ) {
                scanRef.current?.();

                return 180;
              }

              return (
                previous - 1
              );
            }
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [agentEnabled]);

  /*
   * =========================================================
   * REVERT TRADE
   * =========================================================
   */

  const revertTrade =
    async (actionId) => {
      if (
        !actionId ||
        revertingId
      ) {
        return;
      }

      setRevertingId(
        actionId
      );

      try {
        const email =
          user?.email ||
          "trader@stake.com";

        const data =
          await requestJSON(
            "/api/agent/revert-trade",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId:
                  email,
                actionId,
              }),
            }
          );

        if (
          data?.status ===
          "reverted"
        ) {
          showToast?.(
            "Trade reverted successfully."
          );

          await loadActions();

          onRefreshUserData?.();
        } else {
          showToast?.(
            data?.message ||
              "Trade could not be reverted."
          );
        }
      } catch (error) {
        showToast?.(
          error?.message ||
            "Unable to revert trade."
        );
      } finally {
        setRevertingId(
          null
        );
      }
    };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1180,
        margin:
          "0 auto",
        padding:
          "16px 0 40px",
        boxSizing:
          "border-box",
        color:
          "#17221c",
      }}
    >
      {/* =====================================================
          TOP BAR
         ===================================================== */}

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: 12,
          marginBottom:
            34,
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              display:
                "grid",
              placeItems:
                "center",
              borderRadius:
                10,
              background:
                "#e9f8f2",
              color:
                "#0b8f68",
            }}
          >
            <Bot
              size={16}
            />
          </div>

          <div>
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing:
                    "-.02em",
                }}
              >
                Agent
              </span>

              <span
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 4,
                  padding:
                    "4px 7px",
                  borderRadius:
                    999,
                  background:
                    agentEnabled
                      ? "#e9f8f2"
                      : "#f1f3f2",
                  color:
                    agentEnabled
                      ? "#0b8f68"
                      : "#7c8781",
                  fontSize: 7.5,
                  fontWeight: 900,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius:
                      "50%",
                    background:
                      agentEnabled
                        ? "#0b8f68"
                        : "#9aa39e",
                  }}
                />

                {agentEnabled
                  ? "LIVE"
                  : "PAUSED"}
              </span>
            </div>

            <div
              style={{
                marginTop:
                  3,
                color:
                  "#7d8982",
                fontSize:
                  8.5,
              }}
            >
              Autonomous strategy monitoring
            </div>
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 7,
          }}
        >
          <TopButton
            secondary
            onClick={() =>
              onToggleAgent?.(
                !agentEnabled
              )
            }
          >
            {agentEnabled ? (
              <Pause
                size={10}
              />
            ) : (
              <Play
                size={10}
              />
            )}

            {agentEnabled
              ? "Pause"
              : "Start"}
          </TopButton>

          <TopButton
            onClick={
              runScan
            }
            disabled={
              scanLoading
            }
          >
            <Zap
              size={10}
            />

            {scanLoading
              ? "Scanning..."
              : "Run scan"}
          </TopButton>
        </div>
      </div>

      {/* =====================================================
          ACTIVE STRATEGIES + ACTIVITY
         ===================================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "minmax(0,1fr) 290px",
          gap: 24,
          marginBottom:
            34,
        }}
      >
        {/* Strategies */}
        <section>
          <SectionHeader
            title="Active strategies"
            action="View all"
          />

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 12,
            }}
          >
            {STRATEGIES.map(
              (item) => (
                <StrategyCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  active={
                    item.id ===
                    agentStrategy
                  }
                  onClick={() =>
                    onSelectStrategy?.(
                      item.id
                    )
                  }
                  signals={
                    signals
                  }
                />
              )
            )}
          </div>
        </section>

        {/* Activity */}
        <section>
          <SectionHeader
            title="Activity"
            action={
              actions.length
                ? `${actions.length} total`
                : "Recent"
            }
          />

          <ActivityTimeline
            actions={
              actions
            }
            loading={
              actionLoading
            }
            onRevert={
              revertTrade
            }
            revertingId={
              revertingId
            }
          />
        </section>
      </div>

      {/* =====================================================
          INSIGHTS
         ===================================================== */}

      <section
        style={{
          marginBottom:
            34,
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: 10,
            marginBottom:
              10,
          }}
        >
          <div
            style={{
              fontSize:
                13,
              fontWeight:
                900,
              letterSpacing:
                "-.02em",
            }}
          >
            Insights
          </div>

          <div
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 4,
            }}
          >
            <TickerDropdown
              ticker={
                graphTicker
              }
              stockMetaList={
                stockMetaList
              }
              holdings={
                holdings
              }
              onChange={
                setSelectedGraphTicker
              }
            />

            <div
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: 2,
                padding:
                  3,
                borderRadius:
                  999,
                background:
                  "#f1f3f2",
              }}
            >
              {RANGES.map(
                (item) => (
                  <button
                    key={
                      item
                    }
                    type="button"
                    onClick={() =>
                      setRange(
                        item
                      )
                    }
                    style={{
                      border:
                        "none",
                      background:
                        range ===
                        item
                          ? "#ffffff"
                          : "transparent",
                      color:
                        range ===
                        item
                          ? "#17221c"
                          : "#7d8781",
                      borderRadius:
                        999,
                      padding:
                        "5px 7px",
                      fontSize:
                        7.5,
                      fontWeight:
                        900,
                      cursor:
                        "pointer",
                      boxShadow:
                        range ===
                        item
                          ? "0 1px 4px rgba(20,30,25,.06)"
                          : "none",
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0,1.7fr) 265px",
            gap: 14,
          }}
        >
          {/* Graph */}
          <div
            style={{
              minHeight:
                375,
              borderRadius:
                16,
              background:
                "#f1f3f2",
              padding:
                "18px 19px",
              boxSizing:
                "border-box",
              position:
                "relative",
              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "flex-start",
                justifyContent:
                  "space-between",
                position:
                  "relative",
                zIndex: 4,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      8.5,
                    color:
                      "#7e8983",
                  }}
                >
                  {chartMode ===
                  "price"
                    ? `${graphTicker} Price`
                    : `Current ${graphTicker} Position`}
                </div>

                <div
                  style={{
                    marginTop:
                      3,
                    fontSize:
                      26,
                    fontWeight:
                      500,
                    lineHeight:
                      1,
                    letterSpacing:
                      "-.04em",
                    color:
                      "#17221c",
                  }}
                >
                  {chartMode ===
                  "price"
                    ? `$${graphSummary.current.toFixed(
                        2
                      )}`
                    : `$${fmt(
                        graphSummary.current
                      )}`}
                </div>

                <div
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: 4,
                    marginTop:
                      5,
                    color:
                      graphSummary.changePercent >=
                      0
                        ? "#0b8f68"
                        : "#c65050",
                    fontSize:
                      8,
                    fontWeight:
                      900,
                  }}
                >
                  {graphSummary.changePercent >=
                  0 ? (
                    <TrendingUp
                      size={
                        9
                      }
                    />
                  ) : (
                    <TrendingDown
                      size={
                        9
                      }
                    />
                  )}

                  {graphSummary.changePercent >=
                  0
                    ? "+"
                    : ""}
                  {graphSummary.changePercent.toFixed(
                    2
                  )}
                  %
                </div>
              </div>

              <div
                style={{
                  display:
                    "inline-flex",
                  padding:
                    3,
                  borderRadius:
                    999,
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e4e8e6",
                }}
              >
                <ChartToggle
                  active={
                    chartMode ===
                    "value"
                  }
                  onClick={() =>
                    setChartMode(
                      "value"
                    )
                  }
                >
                  Value
                </ChartToggle>

                <ChartToggle
                  active={
                    chartMode ===
                    "price"
                  }
                  onClick={() =>
                    setChartMode(
                      "price"
                    )
                  }
                >
                  Price
                </ChartToggle>
              </div>
            </div>

            <AreaChart
              values={
                visibleGraph
              }
            />

            <div
              style={{
                position:
                  "absolute",
                left: 19,
                right: 19,
                bottom: 12,
                display:
                  "flex",
                justifyContent:
                  "space-between",
                fontSize:
                  7.5,
                color:
                  "#8d9792",
              }}
            >
              <span>
                Low $
                {chartMode ===
                "price"
                  ? graphSummary.low.toFixed(
                      2
                    )
                  : fmt(
                      graphSummary.low
                    )}
              </span>

              <span>
                High $
                {chartMode ===
                "price"
                  ? graphSummary.high.toFixed(
                      2
                    )
                  : fmt(
                      graphSummary.high
                    )}
              </span>
            </div>
          </div>

          {/* Insight Cards */}
          <div
            style={{
              display:
                "grid",
              gap: 12,
            }}
          >
            <InsightCard
              title="Capital deployed"
              value={`$${fmt(
                totalDeployed
              )}`}
              subtitle={`${buyTrades.length} buy transactions`}
              icon={
                <Wallet
                  size={15}
                />
              }
            />

            <InsightCard
              title="Strong signals"
              value={
                strongSignals.length
              }
              subtitle="65%+ confidence"
              icon={
                <Zap
                  size={15}
                />
              }
              green
            />

            <InsightCard
              title="Available cash"
              value={`$${fmt(
                cash
              )}`}
              subtitle="Current account balance"
              icon={
                <Wallet
                  size={15}
                />
              }
            />

            <InsightCard
              title="Max allocation"
              value={`$${fmt(
                maxSpend
              )}`}
              subtitle="Agent spending limit"
              icon={
                <ShieldIcon />
              }
            />

            <InsightCard
              title="Reverted"
              value={
                reversedTrades
              }
              subtitle="Reversed agent trades"
              icon={
                <RotateCcw
                  size={15}
                />
              }
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          BEST SIGNALS
         ===================================================== */}

      <section>
        <SectionHeader
          title="Best opportunities"
          action={
            signalError
              ? "Unavailable"
              : `${strongSignals.length} signals`
          }
        />

        {signalError ? (
          <div
            style={{
              minHeight:
                110,
              borderRadius:
                14,
              background:
                "#f1f3f2",
              display:
                "grid",
              placeItems:
                "center",
              textAlign:
                "center",
              padding:
                20,
              color:
                "#7d8782",
              fontSize:
                8.5,
            }}
          >
            Signal data is temporarily unavailable.
          </div>
        ) : signalLoading ? (
          <Loading />
        ) : strongSignals.length ===
          0 ? (
          <div
            style={{
              minHeight:
                110,
              borderRadius:
                14,
              background:
                "#f1f3f2",
              display:
                "grid",
              placeItems:
                "center",
              color:
                "#7d8782",
              fontSize:
                8.5,
            }}
          >
            No high-confidence opportunities right now.
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 12,
            }}
          >
            {strongSignals
              .slice(0, 3)
              .map(
                (
                  signal,
                  index
                ) => (
                  <SignalCard
                    key={`${signal?.ticker || "signal"}-${index}`}
                    signal={
                      signal
                    }
                    onReview={() =>
                      onOpenOrderDesk?.(
                        signal?.ticker,
                        "BUY"
                      )
                    }
                  />
                )
              )}
          </div>
        )}
      </section>
    </div>
  );
}

/*
 * ===========================================================
 * UI COMPONENTS
 * ===========================================================
 */

function TopButton({
  children,
  onClick,
  disabled,
  secondary = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight:
          30,
        display:
          "inline-flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        gap: 5,
        padding:
          "0 10px",
        borderRadius:
          999,
        border:
          secondary
            ? "1px solid #dfe5e1"
            : "1px solid #0b8f68",
        background:
          secondary
            ? "#ffffff"
            : "#0b8f68",
        color:
          secondary
            ? "#4b5750"
            : "#ffffff",
        fontSize:
          8,
        fontWeight:
          900,
        cursor:
          disabled
            ? "not-allowed"
            : "pointer",
        opacity:
          disabled
            ? 0.5
            : 1,
      }}
    >
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  action,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        marginBottom:
          10,
      }}
    >
      <div
        style={{
          fontSize:
            12,
          fontWeight:
            900,
          letterSpacing:
            "-.02em",
        }}
      >
        {title}
      </div>

      <span
        style={{
          fontSize:
            8,
          fontWeight:
            800,
          color:
            "#89938e",
        }}
      >
        {action}
      </span>
    </div>
  );
}

function StrategyCard({
  item,
  active,
  onClick,
  signals,
}) {
  const strategySignal =
    signals.find(
      (signal) => {
        const name =
          String(
            signal?.strategy ||
              ""
          ).toLowerCase();

        return (
          name.includes(
            item.id
          ) ||
          name.includes(
            item.name
              .toLowerCase()
          )
        );
      }
    );

  const ticker =
    strategySignal?.ticker ||
    "—";

  const confidence =
    n(
      strategySignal?.confidence
    );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign:
          "left",
        border:
          "none",
        padding:
          0,
        background:
          "transparent",
        cursor:
          "pointer",
      }}
    >
      <div
        style={{
          minHeight:
            170,
          borderRadius:
            14,
          background:
            "#f1f3f2",
          padding:
            15,
          boxSizing:
            "border-box",
          position:
            "relative",
          border:
            active
              ? "1px solid #cfeee1"
              : "1px solid transparent",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
          }}
        >
          <span
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 4,
              padding:
                "4px 7px",
              borderRadius:
                999,
              background:
                active
                  ? "#def5e9"
                  : "#ffffff",
              color:
                active
                  ? "#0b8f68"
                  : "#7b8681",
              fontSize:
                7,
              fontWeight:
                900,
            }}
          >
            <Sparkles
              size={8}
            />

            {active
              ? "Active"
              : "Available"}
          </span>

          <Bot
            size={14}
            color={
              active
                ? "#0b8f68"
                : "#97a19c"
            }
          />
        </div>

        <div
          style={{
            marginTop:
              14,
            fontSize:
              12,
            fontWeight:
              900,
          }}
        >
          {item.name}
        </div>

        <div
          style={{
            marginTop:
              3,
            color:
              "#7e8984",
            fontSize:
              8,
          }}
        >
          {item.subtitle}
        </div>

        <div
          style={{
            marginTop:
              9,
            fontSize:
              8,
            lineHeight:
              1.45,
            color:
              "#818c87",
          }}
        >
          {item.description}
        </div>

        <div
          style={{
            position:
              "absolute",
            left: 15,
            right: 15,
            bottom: 14,
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
          }}
        >
          <span
            style={{
              fontSize:
                7.5,
              color:
                "#8a948f",
            }}
          >
            Focus{" "}
            <strong
              style={{
                color:
                  "#29332e",
              }}
            >
              {ticker}
            </strong>
          </span>

          <span
            style={{
              fontSize:
                7.5,
              color:
                confidence
                  ? "#0b8f68"
                  : "#8a948f",
              fontWeight:
                900,
            }}
          >
            {confidence
              ? `${confidence}% confidence`
              : "Waiting"}
          </span>
        </div>
      </div>
    </button>
  );
}

function ActivityTimeline({
  actions,
  loading,
  onRevert,
  revertingId,
}) {
  if (loading) {
    return (
      <div
        style={{
          minHeight:
            300,
          borderRadius:
            14,
          background:
            "#f1f3f2",
          display:
            "grid",
          placeItems:
            "center",
          color:
            "#7f8984",
          fontSize:
            8,
        }}
      >
        Loading activity...
      </div>
    );
  }

  if (!actions.length) {
    return (
      <div
        style={{
          minHeight:
            300,
          borderRadius:
            14,
          background:
            "#f1f3f2",
          display:
            "grid",
          placeItems:
            "center",
          color:
            "#7f8984",
          fontSize:
            8,
          textAlign:
            "center",
        }}
      >
        No activity yet.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight:
          300,
        maxHeight:
          300,
        overflowY:
          "auto",
        borderRadius:
          14,
        background:
          "#ffffff",
        border:
          "1px solid #e7ebe8",
        padding:
          "13px 12px",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          position:
            "relative",
        }}
      >
        <div
          style={{
            position:
              "absolute",
            left: 4,
            top: 3,
            bottom: 3,
            width: 1,
            background:
              "#dfe6e2",
          }}
        />

        <div
          style={{
            display:
              "grid",
            gap: 14,
          }}
        >
          {actions
            .slice(0, 8)
            .map(
              (
                action,
                index
              ) => (
                <div
                  key={
                    action.id ||
                    index
                  }
                  style={{
                    position:
                      "relative",
                    paddingLeft:
                      16,
                  }}
                >
                  <span
                    style={{
                      position:
                        "absolute",
                      left: 0,
                      top: 4,
                      width: 9,
                      height: 9,
                      borderRadius:
                        "50%",
                      background:
                        action.reverted
                          ? "#d5ddd8"
                          : "#d5f3e6",
                      border:
                        "2px solid #0b8f68",
                    }}
                  />

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "flex-start",
                      justifyContent:
                        "space-between",
                      gap: 7,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize:
                            8,
                          lineHeight:
                            1.4,
                          fontWeight:
                            800,
                          color:
                            "#26322b",
                        }}
                      >
                        {action.reverted
                          ? "Trade reverted"
                          : `${action.stock || "Trade"} · ${n(
                              action.shares
                            )} shares`}
                      </div>

                      <div
                        style={{
                          marginTop:
                            2,
                          fontSize:
                            7,
                          color:
                            "#85918b",
                        }}
                      >
                        {formatRelativeTime(
                          action.timestamp
                        )}
                      </div>
                    </div>

                    {!action.reverted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRevert?.(
                            action.id
                          )
                        }
                        disabled={
                          revertingId ===
                          action.id
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "transparent",
                          color:
                            "#88928d",
                          fontSize:
                            7,
                          fontWeight:
                            800,
                          cursor:
                            "pointer",
                        }}
                      >
                        {revertingId ===
                        action.id
                          ? "..."
                          : "Revert"}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop:
                        4,
                      display:
                        "flex",
                      gap: 5,
                      color:
                        "#7c8781",
                      fontSize:
                        7,
                    }}
                  >
                    <span
                      style={{
                        color:
                          String(
                            action.action ||
                              "BUY"
                          ).toUpperCase() ===
                          "SELL"
                            ? "#c24f4f"
                            : "#0b8f68",
                        fontWeight:
                          900,
                      }}
                    >
                      {String(
                        action.action ||
                          "BUY"
                      ).toUpperCase()}
                    </span>

                    <span>·</span>

                    <span>
                      $
                      {n(
                        action.amount
                      ).toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}

function TickerDropdown({
  ticker,
  stockMetaList,
  holdings,
  onChange,
}) {
  const available =
    Array.from(
      new Set([
        ticker,
        ...Object.keys(
          holdings || {}
        ),
        ...(
          stockMetaList || []
        )
          .slice(0, 8)
          .map(
            (item) =>
              item.ticker
          ),
      ])
    ).filter(Boolean);

  return (
    <div
      style={{
        position:
          "relative",
      }}
    >
      <select
        value={
          ticker || ""
        }
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        style={{
          appearance:
            "none",
          minHeight:
            27,
          padding:
            "0 23px 0 8px",
          border:
            "1px solid #e3e8e5",
          borderRadius:
            999,
          background:
            "#ffffff",
          color:
            "#4f5a54",
          fontSize:
            7.5,
          fontWeight:
            900,
          outline:
            "none",
        }}
      >
        {available.map(
          (item) => (
            <option
              key={
                item
              }
              value={
                item
              }
            >
              {item}
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={9}
        style={{
          position:
            "absolute",
          right: 7,
          top: "50%",
          transform:
            "translateY(-50%)",
          pointerEvents:
            "none",
          color:
            "#7a8580",
        }}
      />
    </div>
  );
}

function ChartToggle({
  children,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight:
          24,
        padding:
          "0 8px",
        border:
          "none",
        borderRadius:
          999,
        background:
          active
            ? "#f1f3f2"
            : "transparent",
        color:
          active
            ? "#17221c"
            : "#808a85",
        fontSize:
          7,
        fontWeight:
          900,
        cursor:
          "pointer",
      }}
    >
      {children}
    </button>
  );
}

function AreaChart({
  values,
}) {
  if (!values.length) {
    return (
      <div
        style={{
          position:
            "absolute",
          left: 20,
          right: 20,
          top: 95,
          bottom: 35,
          display:
            "grid",
          placeItems:
            "center",
          color:
            "#8a958f",
          fontSize:
            8,
        }}
      >
        No chart data available.
      </div>
    );
  }

  const width = 900;
  const height = 250;

  const min =
    Math.min(
      ...values
    );

  const max =
    Math.max(
      ...values
    );

  const span =
    Math.max(
      max - min,
      1
    );

  const left = 5;
  const right = 5;
  const top = 8;
  const bottom = 15;

  const graphWidth =
    width -
    left -
    right;

  const graphHeight =
    height -
    top -
    bottom;

  const points =
    values.map(
      (value, index) => {
        const x =
          values.length ===
          1
            ? width / 2
            : left +
              (index /
                (values.length -
                  1)) *
                graphWidth;

        const y =
          top +
          (1 -
            (value -
              min) /
              span) *
            graphHeight;

        return {
          x,
          y,
        };
      }
    );

  const line =
    points
      .map(
        (
          point,
          index
        ) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

  const area = `
    ${line}
    L ${points[
      points.length -
        1
    ].x} ${height - bottom}
    L ${points[0].x} ${
      height - bottom
    }
    Z
  `;

  return (
    <div
      style={{
        position:
          "absolute",
        left: 15,
        right: 15,
        top: 105,
        bottom: 28,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          display:
            "block",
        }}
      >
        <defs>
          <linearGradient
            id="stakeAgentGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#6297ef"
              stopOpacity="0.75"
            />

            <stop
              offset="100%"
              stopColor="#6297ef"
              stopOpacity="0.08"
            />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map(
          (row) => {
            const y =
              top +
              (row / 4) *
                graphHeight;

            return (
              <line
                key={
                  row
                }
                x1={
                  left
                }
                x2={
                  width -
                  right
                }
                y1={
                  y
                }
                y2={
                  y
                }
                stroke="#d9dfdc"
                strokeWidth="1"
                strokeDasharray="1 6"
              />
            );
          }
        )}

        <path
          d={area}
          fill="url(#stakeAgentGradient)"
        />

        <path
          d={line}
          fill="none"
          stroke="#6095ef"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.length >
          0 && (
          <circle
            cx={
              points[
                points.length -
                  1
              ].x
            }
            cy={
              points[
                points.length -
                  1
              ].y
            }
            r="4.5"
            fill="#ffffff"
            stroke="#6095ef"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}

function InsightCard({
  title,
  value,
  subtitle,
  icon,
  green = false,
}) {
  return (
    <div
      style={{
        minHeight:
          72,
        borderRadius:
          14,
        background:
          "#f1f3f2",
        padding:
          "13px 14px",
        boxSizing:
          "border-box",
        display:
          "flex",
        flexDirection:
          "column",
        justifyContent:
          "space-between",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
        }}
      >
        <span
          style={{
            fontSize:
              8,
            color:
              "#7d8983",
          }}
        >
          {title}
        </span>

        <span
          style={{
            width: 23,
            height: 23,
            display:
              "grid",
            placeItems:
              "center",
            borderRadius:
              7,
            background:
              "#ffffff",
            color:
              green
                ? "#0b8f68"
                : "#68746e",
          }}
        >
          {icon}
        </span>
      </div>

      <div>
        <div
          style={{
            marginTop:
              7,
            fontSize:
              19,
            fontWeight:
              500,
            letterSpacing:
              "-.03em",
            color:
              green
                ? "#0b8f68"
                : "#17221c",
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop:
              2,
            color:
              "#86918b",
            fontSize:
              7,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <CheckCircle2
      size={15}
    />
  );
}

function SignalCard({
  signal,
  onReview,
}) {
  const price =
    n(signal?.price);

  const change =
    n(signal?.change);

  const confidence =
    n(
      signal?.confidence
    );

  const positive =
    change >= 0;

  return (
    <div
      style={{
        minHeight:
          140,
        borderRadius:
          14,
        background:
          "#f1f3f2",
        padding:
          "13px 14px",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "flex-start",
          justifyContent:
            "space-between",
        }}
      >
        <div
          style={{
            display:
              "flex",
            gap: 7,
            alignItems:
              "center",
          }}
        >
          <div
            style={{
              width: 29,
              height: 29,
              display:
                "grid",
              placeItems:
                "center",
              borderRadius:
                8,
              background:
                "#ffffff",
              color:
                "#0b8f68",
              fontSize:
                7.5,
              fontWeight:
                900,
            }}
          >
            {signal?.ticker ||
              "—"}
          </div>

          <div>
            <div
              style={{
                fontSize:
                  9,
                fontWeight:
                  900,
              }}
            >
              {signal?.ticker ||
                "Signal"}
            </div>

            <div
              style={{
                marginTop:
                  2,
                fontSize:
                  7,
                color:
                  "#7d8882",
              }}
            >
              {signal?.signalType ||
                "BUY"}
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign:
              "right",
          }}
        >
          <div
            style={{
              fontSize:
                10,
              fontWeight:
                900,
            }}
          >
            ${price.toFixed(
              2
            )}
          </div>

          <div
            style={{
              marginTop:
                2,
              display:
                "flex",
              alignItems:
                "center",
              gap: 2,
              justifyContent:
                "flex-end",
              color:
                positive
                  ? "#0b8f68"
                  : "#c24f4f",
              fontSize:
                7,
              fontWeight:
                900,
            }}
          >
            {positive ? (
              <TrendingUp
                size={8}
              />
            ) : (
              <TrendingDown
                size={8}
              />
            )}

            {positive
              ? "+"
              : ""}
            {change.toFixed(
              2
            )}
            %
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop:
            8,
          fontSize:
            7.5,
          lineHeight:
            1.45,
          color:
            "#76827c",
          minHeight:
            22,
        }}
      >
        {signal?.reason ||
          "Potential setup detected."}
      </div>

      <div
        style={{
          marginTop:
            8,
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
        }}
      >
        <span
          style={{
            color:
              "#0b8f68",
            fontSize:
              7,
            fontWeight:
              900,
          }}
        >
          {confidence}% confidence
        </span>

        <button
          type="button"
          onClick={
            onReview
          }
          style={{
            minHeight:
              25,
            border:
              "1px solid #dce4df",
            background:
              "#ffffff",
            borderRadius:
              7,
            padding:
              "0 7px",
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 4,
            color:
              "#28342d",
            fontSize:
              7,
            fontWeight:
              900,
            cursor:
              "pointer",
          }}
        >
          Review
          <ArrowUpRight
            size={
              8
            }
          />
        </button>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{
        minHeight:
          110,
        borderRadius:
          14,
        background:
          "#f1f3f2",
        display:
          "grid",
        placeItems:
          "center",
        color:
          "#808b85",
        fontSize:
          8,
      }}
    >
      <span
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          gap: 6,
        }}
      >
        <RefreshCw
          size={
            12
          }
          style={{
            animation:
              "stakeAgentSpin 1s linear infinite",
          }}
        />
        Loading...
      </span>
    </div>
  );
}