import { useState, useMemo } from "react";
import {
  Bell,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  X,
  Search,
  Zap,
} from "lucide-react";
import { fmt } from "../utils";

export function AlertsManagerDrawer({
  isOpen,
  onClose,
  alerts = [],
  stocks = {},
  stockMetaList = [],
  onDeleteAlert,
  onOpenSetAlert,
  onSelectStock,
  onOpenTrade,
  onClearTriggeredAlerts,
  onCancelAllAlerts,
}) {
  const [filter, setFilter] = useState("ALL"); // ALL, ACTIVE, TRIGGERED
  const [searchQuery, setSearchQuery] = useState("");

  const activeAlertsCount = alerts.filter((a) => !a.triggered).length;
  const triggeredAlertsCount = alerts.filter((a) => a.triggered).length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Status filter
      if (filter === "ACTIVE" && a.triggered) return false;
      if (filter === "TRIGGERED" && !a.triggered) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const symMatch = a.symbol?.toLowerCase().includes(q);
        const meta = stockMetaList.find((s) => s.ticker === a.symbol);
        const nameMatch = meta?.name?.toLowerCase().includes(q);
        if (!symMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [alerts, filter, searchQuery, stockMetaList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#15F7A6]/20 border border-[#15F7A6]/40 flex items-center justify-center text-[#15F7A6]">
                <Bell size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white">Price Alert Manager</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#15F7A6] text-slate-950">
                    {activeAlertsCount} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time price trigger monitor & quick cancellations
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Alert Manager"
            >
              <X size={18} />
            </button>
          </div>

          {/* Controls & Search */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by symbol or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15F7A6] focus:ring-2 focus:ring-[#15F7A6]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({alerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === "ACTIVE"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active ({activeAlertsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("TRIGGERED")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === "TRIGGERED"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Triggered ({triggeredAlertsCount})
                </button>
              </div>

              {/* Set alert action */}
              {onOpenSetAlert && (
                <button
                  type="button"
                  onClick={() => onOpenSetAlert()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#15F7A6] hover:bg-[#0fd48e] text-slate-950 text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} /> New
                </button>
              )}
            </div>
          </div>

          {/* Alert List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {searchQuery ? "No matching alerts found" : "No price alerts"}
                </h3>
                <p className="text-xs text-slate-500 max-w-[260px] mx-auto mt-1">
                  {searchQuery
                    ? `No alert matches "${searchQuery}". Try a different ticker.`
                    : "Create automated price alerts to capture breakouts and dip-buy targets instantly."}
                </p>
                {onOpenSetAlert && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => onOpenSetAlert()}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-[#15F7A6] text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Create Your First Alert
                  </button>
                )}
              </div>
            ) : (
              filteredAlerts.map((alt) => {
                const isAbove = alt.condition === "ABOVE";
                const curPrice = stocks[alt.symbol]?.price || alt.currentPrice || alt.targetPrice;
                const targetPrice = Number(alt.targetPrice || 0);
                const diffPct = curPrice && targetPrice ? ((targetPrice - curPrice) / curPrice) * 100 : 0;
                const meta = stockMetaList.find((s) => s.ticker === alt.symbol);

                return (
                  <div
                    key={alt.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      alt.triggered
                        ? "stake-alert-triggered-pulse bg-amber-50/90 border-amber-400 shadow-md"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            alt.triggered
                              ? "bg-amber-100 text-amber-700 border border-amber-300 animate-bounce"
                              : isAbove
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-rose-50 text-rose-600 border border-rose-200"
                          }`}
                        >
                          {alt.triggered ? <Zap size={18} /> : isAbove ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 font-mono">
                              {alt.symbol}
                            </span>
                            {meta?.name && (
                              <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                                {meta.name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {isAbove ? "Rises Above" : "Drops Below"} ${fmt(targetPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status / Quick Delete */}
                      <div className="flex items-center gap-1.5">
                        {alt.triggered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-400 shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                            </span>
                            Target Triggered!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Zap size={11} /> Active
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteAlert && onDeleteAlert(alt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Quick cancel alert"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Price Status Comparison Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                      <div className="text-slate-500 flex items-center gap-1">
                        <span>Current:</span>
                        <span className="font-bold text-slate-900">${fmt(curPrice)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-400">Target Gap:</span>
                        <span
                          className={`font-bold ${
                            Math.abs(diffPct) <= 2
                              ? "text-amber-600 animate-pulse"
                              : diffPct > 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {diffPct > 0 ? "+" : ""}
                          {diffPct.toFixed(1)}%
                        </span>
                      </div>

                      {/* Direct Trade Action */}
                      <div className="flex items-center gap-1.5">
                        {onSelectStock && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStock(alt.symbol);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          >
                            Chart
                          </button>
                        )}
                        {onOpenTrade && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenTrade(alt.symbol, isAbove ? "BUY" : "SELL");
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-black bg-[#15F7A6] text-slate-950 hover:bg-[#0fd48e] transition-all"
                          >
                            Trade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              <span>{alerts.length} total alert{alerts.length === 1 ? "" : "s"} configured</span>
            </div>

            <div className="flex items-center gap-2">
              {triggeredAlertsCount > 0 && onClearTriggeredAlerts && (
                <button
                  type="button"
                  onClick={onClearTriggeredAlerts}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Clear Triggered
                </button>
              )}

              {alerts.length > 0 && onCancelAllAlerts && (
                <button
                  type="button"
                  onClick={onCancelAllAlerts}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Cancel All
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
