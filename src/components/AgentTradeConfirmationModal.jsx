import { useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  Zap,
} from "lucide-react";

export function AgentTradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  trade,
  cashBalance = 0,
  isExecuting = false,
}) {
  // ESC key support to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isExecuting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExecuting, onClose]);

  if (!isOpen || !trade) return null;

  const isBuy = (trade.side || "BUY").toUpperCase() === "BUY";
  const ticker = (trade.ticker || trade.scrip || "NVDA").toUpperCase();
  const shares = Number(trade.shares || 1);
  const price = Number(trade.price || 150);
  const total = Number(trade.total || (shares * price).toFixed(2));
  const strategy = trade.strategy || trade.source || "Autonomous Strategy Engine";
  const reason = trade.reason || "Algorithmic rule execution triggered by AI market scanner.";
  const orderType = trade.orderType || "MKT";

  const remainingCash = isBuy
    ? Math.max(0, cashBalance - total)
    : cashBalance + total;

  return (
    <div
      id="agent-high-value-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        id="agent-high-value-confirmation-modal"
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/30 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top ambient banner & glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400" />
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1.5">
                <AlertTriangle size={11} />
                High-Value Oversight Triggered (&gt; $1,000)
              </div>
              <h2 id="modal-title" className="text-xl font-black text-white tracking-tight">
                Confirm Agent Execution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory human authorization required before executing trades exceeding $1,000.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            aria-label="Close modal"
            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Main Trade Summary Card */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-white">
                  {ticker.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-white">{ticker}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide ${
                        isBuy
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {isBuy ? "BUY" : "SELL"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {orderType} ORDER
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {shares} {shares === 1 ? "share" : "shares"} @ ${price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Value</div>
                <div className="text-xl font-black font-mono text-white">
                  ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Key Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Shares</span>
                <strong className="font-mono text-slate-200 text-sm">{shares}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Unit Price</span>
                <strong className="font-mono text-slate-200 text-sm">${price.toFixed(2)}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/60 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. Fee</span>
                <strong className="font-mono text-slate-200 text-sm">$0.00 (Zero-Fee)</strong>
              </div>
            </div>
          </div>

          {/* AI Strategy & Rationale Card */}
          <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                <Zap size={13} />
                Strategy: {strategy}
              </span>
              {trade.confidence && (
                <span className="text-[10px] font-bold text-slate-400">
                  Confidence: <strong className="text-emerald-300">{trade.confidence}%</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{reason}"
            </p>
          </div>

          {/* Collateral / Cash Impact */}
          <div className="rounded-2xl bg-slate-950/50 border border-slate-800/80 p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Available Cash</span>
              <strong className="text-white font-mono font-bold">${cashBalance.toFixed(2)}</strong>
            </div>
            <ArrowRight size={14} className="text-slate-500" />
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Cash After Execution</span>
              <strong
                className={`font-mono font-bold ${
                  remainingCash < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                ${remainingCash.toFixed(2)}
              </strong>
            </div>
          </div>

          {isBuy && cashBalance < total && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>Insufficient cash. Deposit collateral before authorizing this trade.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 bg-slate-900/90 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Reject / Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trade)}
            disabled={isExecuting || (isBuy && cashBalance < total)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Executing Order...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Authorize & Execute Order (${total.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
