import { useState } from "react";
import { Zap, Play } from "lucide-react";

export function AgentTriggerEngine({ showToast }) {
  const [triggers, setTriggers] = useState([
    {
      id: "rsi_oversold",
      title: "RSI Oversold Dip-Buyer",
      description:
        "Automatically trigger guarded buy orders when 14-period RSI drops below the oversold threshold with volume confirmation.",
      enabled: true,
      category: "Mean Reversion",
      threshold: 30,
      thresholdUnit: "RSI",
      minThreshold: 20,
      maxThreshold: 45,
      step: 1,
      targetAction: "BUY",
      lastTriggered: "24m ago (NVDA @ $136.20)",
      status: "ARMED",
    },
    {
      id: "volume_breakout",
      title: "Momentum Volume Breakout Scalper",
      description:
        "Execute rapid momentum fills when 5-minute volume exceeds the 20-period moving average with a positive MACD histogram cross.",
      enabled: true,
      category: "Momentum",
      threshold: 1.8,
      thresholdUnit: "x Vol Avg",
      minThreshold: 1.2,
      maxThreshold: 3.5,
      step: 0.1,
      targetAction: "BUY",
      lastTriggered: "2h ago (AMD @ $148.40)",
      status: "LISTENING",
    },
    {
      id: "trailing_stop",
      title: "Dynamic Trailing Stop Guardian",
      description:
        "Ratchets protective stop-loss upward as positions move into profit, preserving capital while letting winners run.",
      enabled: true,
      category: "Risk Protection",
      threshold: 2.5,
      thresholdUnit: "% Trailing",
      minThreshold: 1.0,
      maxThreshold: 6.0,
      step: 0.5,
      targetAction: "SELL",
      lastTriggered: "Yesterday (TSLA @ $254.10)",
      status: "ARMED",
    },
    {
      id: "volatility_shock",
      title: "Volatility Shock Absorber",
      description:
        "Harvest 50% partial profits and tighten stop-loss boundaries if intraday volatility spikes or VIX crosses threshold.",
      enabled: false,
      category: "Hedging",
      threshold: 28,
      thresholdUnit: "VIX Level",
      minThreshold: 18,
      maxThreshold: 40,
      step: 1,
      targetAction: "HEDGE",
      lastTriggered: "Never",
      status: "STANDBY",
    },
    {
      id: "gap_down_defense",
      title: "Pre-Market Gap Down Defense",
      description:
        "Pre-market circuit breaker that protects capital if any holding gaps down more than the threshold before open.",
      enabled: true,
      category: "Circuit Breaker",
      threshold: 3.0,
      thresholdUnit: "% Drop",
      minThreshold: 1.5,
      maxThreshold: 8.0,
      step: 0.5,
      targetAction: "DEFEND",
      lastTriggered: "3d ago (INTC)",
      status: "ARMED",
    },
  ]);

  const [testingId, setTestingId] = useState(null);

  const handleToggle = (id) => {
    setTriggers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.enabled;
          showToast?.(
            `${t.title} ${next ? "enabled and listening" : "paused"}`
          );
          return {
            ...t,
            enabled: next,
            status: next ? "ARMED" : "DISABLED",
          };
        }
        return t;
      })
    );
  };

  const handleThresholdChange = (id, newThreshold) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, threshold: Number(newThreshold) } : t))
    );
  };

  const handleSimulateTrigger = (trigger) => {
    setTestingId(trigger.id);
    setTimeout(() => {
      setTestingId(null);
      showToast?.(
        `⚡ Simulated Trigger: ${trigger.title} matched condition (${trigger.threshold} ${trigger.thresholdUnit})`
      );
      setTriggers((prev) =>
        prev.map((t) =>
          t.id === trigger.id
            ? { ...t, lastTriggered: "Just now (Simulation)" }
            : t
        )
      );
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Zap size={14} /> Smart Execution Conditions
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Smart Trigger Customisation
          </h2>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Configure the conditions the selected strategy may use when it scans. These controls are stored as customisation rules; they do not spend money until the strategy is active and within its allocated budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {triggers.filter((t) => t.enabled).length} Active Triggers
          </span>
        </div>
      </div>

      {/* Triggers List */}
      <div className="grid grid-cols-1 gap-4">
        {triggers.map((trigger) => (
          <div
            key={trigger.id}
            className={`p-5 rounded-2xl border transition-all ${
              trigger.enabled
                ? "bg-slate-900/60 border-emerald-500/30 shadow-md"
                : "bg-slate-900/30 border-slate-800 opacity-70"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-black text-sm text-white">
                    {trigger.title}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {trigger.category}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      trigger.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {trigger.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {trigger.description}
                </p>
              </div>

              {/* Toggle Switch & Actions */}
              <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSimulateTrigger(trigger)}
                  disabled={testingId === trigger.id || !trigger.enabled}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play size={12} className={testingId === trigger.id ? "animate-spin text-emerald-400" : ""} />
                  <span>{testingId === trigger.id ? "Simulating..." : "Test Trigger"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(trigger.id)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                    trigger.enabled ? "bg-emerald-500 justify-end" : "bg-slate-700 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transition-all" />
                </button>
              </div>
            </div>

            {/* Threshold Slider Controls */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Activation Sensitivity</span>
                  <span className="font-mono font-black text-emerald-400">
                    {trigger.threshold} {trigger.thresholdUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min={trigger.minThreshold}
                  max={trigger.maxThreshold}
                  step={trigger.step}
                  value={trigger.threshold}
                  disabled={!trigger.enabled}
                  onChange={(e) => handleThresholdChange(trigger.id, e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Last execution:</span>
                <strong className="text-slate-300 font-mono">{trigger.lastTriggered}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
