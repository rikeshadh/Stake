import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  CircleDollarSign,
  Gauge,
  History,
  Loader2,
  Pause,
  Play,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import Markdown from "react-markdown";
import { sendAgentChat } from "../api";
import { updateAgentWatchlist, deployAgentStrategy } from "../api";
import { STRATEGIES } from "../strategies";

const money = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function AgenticWorkspace({
  agentEnabled,
  onToggleAgent,
  onSelectStrategy,
  onChangeMaxSpend,
  agentMaxSpend = 500,
  cashBalance = 0,
  holdings = {},
  user,
  onRefreshUserData,
  showToast,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [strategyId, setStrategyId] = useState(user?.agentStrategy || null);
  const [maxSpend, setMaxSpend] = useState(String(user?.agentMaxSpend || agentMaxSpend));
  const [allocation, setAllocation] = useState(String(user?.agentDeployedCapital || 0));
  const [riskLevel, setRiskLevel] = useState(user?.riskLevel || "Balanced");
  const [stopLoss, setStopLoss] = useState("3.5");
  const [takeProfit, setTakeProfit] = useState("6.0");
  const [reversalWindow, setReversalWindow] = useState(String(user?.agentReversalWindow || 5));
  const [watchlist, setWatchlist] = useState(user?.watchlist || []);
  const [watchlistInput, setWatchlistInput] = useState("");
  const [tradeOnMomentum, setTradeOnMomentum] = useState(true);
  const [tradeOnPullbacks, setTradeOnPullbacks] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const selectedStrategy = useMemo(() => STRATEGIES.find((item) => item.id === strategyId) || null, [strategyId]);
  const agentHistory = user?.agentHistory || [];

  const saveSettings = async () => {
    if (!strategyId) {
      showToast?.("Choose a strategy before saving agent settings.");
      return;
    }
    const spend = Number(maxSpend) || 0;
    setSaving(true);
    try {
      await deployAgentStrategy({
      email: user?.email,
      userId: user?.email,
      strategy: strategyId,
      strategyId,
      deployedCapital: Number(allocation) || 0,
      capitalAllocation: Number(allocation) || 0,
      maxSpend: spend,
      maxSpendPerTrade: spend,
      riskLevel,
      stopLossPct: Number(stopLoss) || 3.5,
      takeProfitPct: Number(takeProfit) || 6,
      tradeOnMomentum,
      tradeOnPullbacks,
      requireConfirmation,
      reversalWindow: Number(reversalWindow) || 5,
      });
      if (watchlist.length) await updateAgentWatchlist({ email: user?.email, watchlist });
      setSettingsOpen(false);
      onSelectStrategy?.(strategyId);
      onChangeMaxSpend?.(spend);
      await onRefreshUserData?.();
      showToast?.(`${selectedStrategy?.name || "Agent"} settings saved.`);
    } catch (error) {
      showToast?.(error.message || "Unable to save agent settings.");
    } finally {
      setSaving(false);
    }
  };

  const addTicker = () => {
    const ticker = watchlistInput.trim().toUpperCase();
    if (ticker && !watchlist.includes(ticker)) setWatchlist((items) => [...items, ticker].slice(0, 15));
    setWatchlistInput("");
  };

  const sendPrompt = async (text = prompt) => {
    const value = text.trim();
    if (!value || sending) return;
    const history = messages.map((item) => ({ sender: item.role === "user" ? "user" : "model", text: item.text }));
    setPrompt("");
    setMessages((items) => [...items, { role: "user", text: value }]);
    setSending(true);
    try {
      const result = await sendAgentChat({ email: user?.email, message: value, history });
      setMessages((items) => [...items, { role: "assistant", text: result.reply || "No response returned." }]);
      if (result.executedActions?.length) await onRefreshUserData?.();
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", text: error.message || "Gemini is unavailable.", error: true }]);
    } finally {
      setSending(false);
    }
  };

  const toggleAgent = () => {
    if (!strategyId) {
      showToast?.("Choose and save a strategy in Agent settings before activating the engine.");
      setSettingsOpen(true);
      return;
    }
    onToggleAgent?.(!agentEnabled);
  };

  if (settingsOpen) {
    return (
      <div className="stake-agent-workspace min-h-screen bg-slate-50 text-slate-900 px-3 sm:px-6 py-6 pb-28 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-6 sm:p-8 shadow-xl">
          <button onClick={() => setSettingsOpen(false)} className="text-xs font-black text-emerald-700 hover:text-emerald-900 cursor-pointer">← Back to Agentic desk</button>
          <div className="mt-5 flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-700 text-[11px] font-black uppercase tracking-[.2em]"><SlidersHorizontal size={16} /> Agent settings</div><h1 className="mt-3 text-3xl sm:text-4xl font-black text-slate-950">Configure your strategy.</h1><p className="mt-2 text-sm text-slate-600">Set the model's execution universe, capital budget, and risk boundaries before activating the engine.</p></div><Settings className="text-emerald-600" size={28} /></div>
        </div>
        <div className="mt-6 grid lg:grid-cols-[1.2fr_.8fr] gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Execution strategy</div><h2 className="mt-1 text-xl font-black">Choose how Agentic trades</h2><p className="mt-2 text-xs text-slate-500">No strategy is selected automatically. The engine cannot activate until you choose one.</p><div className="mt-5 grid gap-3">{STRATEGIES.map((strategy) => <button key={strategy.id} onClick={() => setStrategyId(strategy.id)} className={`text-left rounded-2xl border p-4 cursor-pointer ${strategyId === strategy.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}><div className="flex items-center justify-between"><strong className="text-sm">{strategy.name}</strong>{strategyId === strategy.id && <Check size={16} className="text-emerald-600" />}</div><p className="mt-1 text-xs text-slate-500">{strategy.tagline}</p></button>)}</div><div className="mt-7 border-t border-slate-100 pt-5"><div className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Target watchlist</div><p className="mt-1 text-xs text-slate-500">The agent only evaluates symbols in this list.</p><div className="mt-3 flex gap-2"><input value={watchlistInput} onChange={(event) => setWatchlistInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTicker()} placeholder="Ticker, e.g. NVDA" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold" /><button onClick={addTicker} className="rounded-xl bg-slate-900 px-3 text-xs font-black text-white cursor-pointer">Add</button></div><div className="mt-3 flex flex-wrap gap-2">{watchlist.map((ticker) => <button key={ticker} onClick={() => setWatchlist((items) => items.filter((item) => item !== ticker))} title={`Remove ${ticker}`} className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800 cursor-pointer">{ticker} ×</button>)}</div><div className="mt-3 flex flex-wrap gap-2">{["AI & Chips", "Mega Caps", "High Growth", "Blue Chips"].map((preset) => <button key={preset} onClick={() => { const groups = { "AI & Chips": ["NVDA", "AMD", "ARM", "TSM"], "Mega Caps": ["AAPL", "MSFT", "AMZN", "GOOGL", "META"], "High Growth": ["TSLA", "PLTR", "COIN", "CRWD"], "Blue Chips": ["JNJ", "UNH", "V", "JPM", "WMT"] }; setWatchlist(groups[preset].slice(0, 15)); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-emerald-300 cursor-pointer">{preset}</button>)}</div></div></section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><ShieldCheck className="text-emerald-600" size={19} /><h2 className="font-black">Risk controls</h2></div><p className="mt-2 text-xs leading-relaxed text-slate-500">The configured rules are checked against live market conditions before an order is allowed.</p><label className="block mt-6 text-[10px] font-black uppercase tracking-wider text-slate-500">Capital allocation</label><div className="mt-2 flex items-center gap-2"><CircleDollarSign size={17} className="text-slate-400" /><input value={allocation} onChange={(event) => setAllocation(event.target.value)} type="number" min="0" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500" /></div><label className="block mt-5 text-[10px] font-black uppercase tracking-wider text-slate-500">Maximum spend per trade</label><div className="mt-2 flex items-center gap-2"><CircleDollarSign size={17} className="text-slate-400" /><input value={maxSpend} onChange={(event) => setMaxSpend(event.target.value)} type="number" min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500" /></div><label className="block mt-5 text-[10px] font-black uppercase tracking-wider text-slate-500">Risk profile</label><select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none"><option>Conservative</option><option>Balanced</option>          <option>Growth</option></select><label className="block mt-5 text-[10px] font-black uppercase tracking-wider text-slate-500">Reversal window</label><select value={reversalWindow} onChange={(event) => setReversalWindow(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"><option value="1">1 minute</option><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option></select><p className="mt-1 text-[11px] text-slate-500">How long an agent order can be reversed.</p><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stop loss<input value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} type="number" step="0.5" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold" /></label><label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Take profit<input value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} type="number" step="0.5" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold" /></label></div><div className="mt-5 space-y-2 text-xs"><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Trade bullish momentum</span><input type="checkbox" checked={tradeOnMomentum} onChange={(event) => setTradeOnMomentum(event.target.checked)} /></label><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Trade support pullbacks</span><input type="checkbox" checked={tradeOnPullbacks} onChange={(event) => setTradeOnPullbacks(event.target.checked)} /></label><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Require signal confirmation</span><input type="checkbox" checked={requireConfirmation} onChange={(event) => setRequireConfirmation(event.target.checked)} /></label></div>          <button type="button" disabled={saving} onClick={saveSettings} className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-3 text-xs font-black cursor-pointer inline-flex justify-center gap-2"><Check size={15} /> {saving ? "Saving agent settings..." : "Save agent settings"}</button></section>
        </div>
      </div>
    );
  }

  return (
    <div className="stake-agent-workspace min-h-screen bg-slate-50 text-slate-900 px-3 sm:px-6 py-6 pb-28 max-w-7xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-6 shadow-xl sm:p-8"><div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" /><div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6"><div><div className="flex items-center gap-2 text-emerald-700 text-[11px] font-black uppercase tracking-[.2em]"><BrainCircuit size={16} /> Gemini Agentic Desk</div><h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-950">Autonomous Trading.<br /><span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">Powered by AI Intelligence.</span></h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">Configure your strategy and risk controls first, then activate an agent that operates inside your rules.</p></div><div className="flex items-center gap-2"><button onClick={() => setSettingsOpen(true)} title="Agent settings" aria-label="Open Agent settings" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white p-3 text-emerald-700 shadow-sm hover:bg-emerald-50 cursor-pointer"><Settings size={18} /></button><button onClick={toggleAgent} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-black text-white shadow-lg ${agentEnabled ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"} cursor-pointer`}>{agentEnabled ? <Pause size={15} /> : <Play size={15} />} {agentEnabled ? "Pause agent" : "Activate agent"}</button></div></div><div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-emerald-200/70 pt-6 md:grid-cols-4">{[["Engine", agentEnabled ? "LIVE" : "PAUSED"], ["Strategy", selectedStrategy?.name || "Not set"], ["Cash available", money(cashBalance)], ["Open positions", Object.keys(holdings).length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 truncate font-black text-sm text-slate-900">{value}</div></div>)}</div></section>
      <div className="grid lg:grid-cols-3 gap-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Agent configuration</div><h2 className="mt-1 text-xl font-black">{selectedStrategy?.name || "Choose a strategy"}</h2></div><Gauge className="text-emerald-600" size={23} /></div><p className="mt-2 text-sm text-slate-600">{selectedStrategy?.tagline || "Open Agent settings to configure your strategy."}</p><div className="mt-6 grid sm:grid-cols-3 gap-3"><div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><div className="text-[10px] text-slate-500 uppercase font-black">Allocation</div><strong className="mt-1 block">{money(allocation)}</strong></div><div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><div className="text-[10px] text-slate-500 uppercase font-black">Spend ceiling</div><strong className="mt-1 block">{money(maxSpend)}</strong></div><div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><div className="text-[10px] text-slate-500 uppercase font-black">Risk profile</div><strong className="mt-1 block">{riskLevel}</strong></div></div><button onClick={() => setSettingsOpen(true)} className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-100 cursor-pointer inline-flex gap-2"><Settings size={14} /> Edit strategy and risk controls</button></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Zap className="text-amber-500" size={19} /><h2 className="font-black">Agent status</h2></div><p className="mt-3 text-xs leading-relaxed text-slate-500">The engine is {agentEnabled ? "active and ready to evaluate your configured universe." : "paused until you activate it."}</p><div className="mt-5 space-y-2 text-xs"><div className="flex justify-between rounded-xl bg-emerald-50 p-3 text-emerald-800"><span>Cash protection</span><strong>ON</strong></div><div className="flex justify-between rounded-xl bg-slate-50 p-3"><span>Execution mode</span><strong>Fractional</strong></div><div className="flex justify-between rounded-xl bg-slate-50 p-3">      <span>Reversal window</span><strong>{reversalWindow} min</strong></div></div></section></div>
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Ask the model</div><h2 className="mt-1 text-xl font-black">Stake AI command center</h2></div><Sparkles className="text-cyan-500" size={22} /></div><div className="p-5 min-h-44 max-h-80 overflow-y-auto space-y-3">{messages.length === 0 ? <div className="grid sm:grid-cols-3 gap-3">{["Review my portfolio risk", "Build a trade plan", "Explain the active strategy"].map((text) => <button key={text} onClick={() => sendPrompt(text)} className="rounded-2xl border border-slate-200 p-4 text-left text-xs font-bold hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer">{text}<ArrowUpRight size={14} className="mt-3 text-emerald-600" /></button>)}</div> : messages.map((message, index) => <div key={index} className={`max-w-3xl rounded-2xl p-3 text-sm ${message.role === "user" ? "ml-auto bg-slate-900 text-white" : message.error ? "bg-rose-50 text-rose-800" : "bg-slate-50 border border-slate-200"}`}>{message.role === "assistant" ? <Markdown>{message.text}</Markdown> : message.text}</div>)}{sending && <div className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Gemini is evaluating your configuration...</div>}</div><form onSubmit={(event) => { event.preventDefault(); sendPrompt(); }} className="p-4 border-t border-slate-100 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask for a trade plan or risk review..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><button disabled={sending || !prompt.trim()} className="rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-4 cursor-pointer"><Send size={16} /></button></form></section>
      {agentHistory.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><History size={18} className="text-emerald-600" /><h2 className="font-black">Strategy history</h2></div><p className="mt-1 text-xs text-slate-500">Saved configurations from MongoDB.</p><div className="mt-4 grid gap-2">{agentHistory.slice(0, 8).map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs"><div><strong>{STRATEGIES.find((item) => item.id === entry.strategy)?.name || entry.strategy}</strong><div className="mt-1 text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Saved"}</div></div><div className="text-right"><strong className="text-emerald-700">{money(entry.deployedCapital)}</strong><div className="mt-1 text-slate-500">{entry.riskLevel || "Balanced"} · {entry.reversalWindow || 5} min</div></div></div>)}</div></section>}
    </div>
  );
}
