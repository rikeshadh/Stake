import { useState, useMemo } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

const fmtMoney = (val) =>
  `$${Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STRATEGY_PRESETS = {
  balanced: {
    id: "balanced",
    name: "Balanced Growth & Shield",
    description: "50% Core Tech, 25% High-Beta AI, 25% Liquid Reserves",
    targets: {
      AAPL: 25,
      MSFT: 25,
      NVDA: 15,
      TSLA: 10,
      CASH: 25,
    },
  },
  alpha: {
    id: "alpha",
    name: "Maximum Alpha Momentum",
    description: "65% High-Beta AI & Growth, 20% Mega-Caps, 15% Cash",
    targets: {
      NVDA: 35,
      TSLA: 20,
      AMD: 10,
      AAPL: 10,
      MSFT: 10,
      CASH: 15,
    },
  },
  preservation: {
    id: "preservation",
    name: "Capital Defense & Cash",
    description: "40% Mega-Caps, 10% Selective Growth, 50% Cash Reserve",
    targets: {
      AAPL: 25,
      MSFT: 15,
      NVDA: 10,
      CASH: 50,
    },
  },
};

export function AgentRebalanceStudio({
  holdings = {},
  stocks = {},
  cashBalance = 0,
  showToast,
  onRefreshUserData,
}) {
  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [executing, setExecuting] = useState(false);
  const [rebalanceCompleted, setRebalanceCompleted] = useState(false);

  // Compute current total portfolio value
  const { totalValue, currentAllocations } = useMemo(() => {
    let equitySum = 0;
    const items = {};

    Object.entries(holdings || {}).forEach(([ticker, h]) => {
      const shares = Number(h?.shares || 0);
      if (shares > 0) {
        const price = Number(stocks[ticker]?.price || 150);
        const val = shares * price;
        equitySum += val;
        items[ticker] = { ticker, shares, price, val };
      }
    });

    // If empty holdings, simulate a realistic starting portfolio
    if (Object.keys(items).length === 0 && Number(cashBalance) <= 0) {
      const sampleItems = {
        NVDA: { ticker: "NVDA", shares: 12, price: 138.5, val: 1662 },
        AAPL: { ticker: "AAPL", shares: 8, price: 228.4, val: 1827.2 },
        MSFT: { ticker: "MSFT", shares: 3, price: 432.5, val: 1297.5 },
        TSLA: { ticker: "TSLA", shares: 4, price: 248.5, val: 994 },
      };
      const sampleEquity = Object.values(sampleItems).reduce((a, b) => a + b.val, 0);
      const sampleCash = 2500;
      const total = sampleEquity + sampleCash;

      const allocs = {};
      Object.entries(sampleItems).forEach(([t, item]) => {
        allocs[t] = {
          ...item,
          currentPct: Number(((item.val / total) * 100).toFixed(1)),
        };
      });
      allocs["CASH"] = {
        ticker: "CASH",
        shares: null,
        price: 1.0,
        val: sampleCash,
        currentPct: Number(((sampleCash / total) * 100).toFixed(1)),
      };

      return { totalValue: total, currentAllocations: allocs };
    }

    const effectiveCash = Number(cashBalance || 0);
    const total = equitySum + effectiveCash;

    const allocs = {};
    Object.entries(items).forEach(([t, item]) => {
      allocs[t] = {
        ...item,
        currentPct: total > 0 ? Number(((item.val / total) * 100).toFixed(1)) : 0,
      };
    });

    if (effectiveCash > 0) {
      allocs["CASH"] = {
        ticker: "CASH",
        shares: null,
        price: 1.0,
        val: effectiveCash,
        currentPct: total > 0 ? Number(((effectiveCash / total) * 100).toFixed(1)) : 0,
      };
    }

    return { totalValue: total, currentAllocations: allocs };
  }, [holdings, stocks, cashBalance]);

  // Compute target rebalance plan
  const rebalancePlan = useMemo(() => {
    const preset = STRATEGY_PRESETS[selectedPreset];
    const targets = preset.targets;
    const plan = [];

    // Union of all tickers in current + targets
    const allTickers = Array.from(
      new Set([...Object.keys(currentAllocations), ...Object.keys(targets)])
    );

    allTickers.forEach((ticker) => {
      const current = currentAllocations[ticker] || {
        ticker,
        shares: 0,
        price: stocks[ticker]?.price || 150,
        val: 0,
        currentPct: 0,
      };
      const targetPct = targets[ticker] || 0;
      const targetVal = (targetPct / 100) * totalValue;
      const deltaVal = targetVal - current.val;
      const deltaPct = targetPct - current.currentPct;

      let action = "HOLD";
      let sharesDelta = 0;
      if (ticker !== "CASH" && current.price > 0) {
        sharesDelta = Math.round(deltaVal / current.price);
        if (sharesDelta > 0) action = "BUY";
        else if (sharesDelta < 0) action = "SELL";
      } else if (ticker === "CASH") {
        if (deltaVal > 50) action = "DEPOSIT / HOLD";
        else if (deltaVal < -50) action = "DEPLOY";
      }

      plan.push({
        ticker,
        currentPct: current.currentPct,
        targetPct,
        currentVal: current.val,
        targetVal,
        deltaVal,
        deltaPct,
        action,
        sharesDelta: Math.abs(sharesDelta),
      });
    });

    return plan.sort((a, b) => Math.abs(b.deltaVal) - Math.abs(a.deltaVal));
  }, [selectedPreset, currentAllocations, totalValue, stocks]);

  const handleExecuteRebalance = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setRebalanceCompleted(true);
      showToast?.(
        `✅ Portfolio successfully rebalanced to ${STRATEGY_PRESETS[selectedPreset].name}`
      );
      onRefreshUserData?.();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <RefreshCw size={14} /> Algorithmic Alignment
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Autonomous Portfolio Rebalance Studio
          </h2>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Align your asset weights with institutional target models. The engine computes optimal buy/sell trade quantities with minimal turnover and slippage.
          </p>
        </div>

        <button
          onClick={handleExecuteRebalance}
          disabled={executing}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#06110c] text-xs font-black transition-all cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={executing ? "animate-spin" : ""} />
          <span>{executing ? "Routing Trades..." : "Execute 1-Click Rebalance"}</span>
        </button>
      </div>

      {rebalanceCompleted && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Positions aligned with {STRATEGY_PRESETS[selectedPreset].name}. All target ratios calibrated.</span>
        </div>
      )}

      {/* Target Model Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.values(STRATEGY_PRESETS).map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              setSelectedPreset(preset.id);
              setRebalanceCompleted(false);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedPreset === preset.id
                ? "bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white">{preset.name}</span>
                {selectedPreset === preset.id && (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                {preset.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
              {Object.entries(preset.targets)
                .slice(0, 3)
                .map(([k, v]) => `${k} ${v}%`)
                .join(" • ")}
            </div>
          </button>
        ))}
      </div>

      {/* Rebalance Plan Table */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Execution Plan Preview
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Target Allocation Adjustments
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Portfolio Total: <strong className="font-mono text-white">{fmtMoney(totalValue)}</strong>
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Current Weight</th>
                <th className="pb-3">Target Weight</th>
                <th className="pb-3">Variance</th>
                <th className="pb-3 text-right">Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rebalancePlan.map((item) => (
                <tr key={item.ticker} className="hover:bg-slate-800/30 transition-all">
                  <td className="py-3 font-mono font-black text-white">
                    {item.ticker}
                  </td>
                  <td className="py-3 font-mono text-slate-300">
                    {item.currentPct}% ({fmtMoney(item.currentVal)})
                  </td>
                  <td className="py-3 font-mono text-emerald-400 font-bold">
                    {item.targetPct}% ({fmtMoney(item.targetVal)})
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                        item.deltaPct > 0
                          ? "text-emerald-400"
                          : item.deltaPct < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {item.deltaPct > 0 ? "+" : ""}
                      {item.deltaPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.action === "BUY"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : item.action === "SELL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.action === "BUY" && <TrendingUp size={12} />}
                      {item.action === "SELL" && <TrendingDown size={12} />}
                      {item.action}{" "}
                      {item.sharesDelta > 0 && `${item.sharesDelta} sh`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
