import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, ChevronRight, History, Loader2, Plus, Send, X } from "lucide-react";
import Markdown from "react-markdown";
import { sendAgentChat, confirmAgentTrade } from "../api";
import { AgentTradeConfirmationModal } from "./AgentTradeConfirmationModal";

const STARTERS = ["What is my biggest portfolio risk?", "Give me a trade plan for NVDA", "Find the strongest setup today"];

export function GeminiStrategySidebar({ isOpen, onClose, user, onRefreshUserData, layout = "sidebar" }) {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`stake_ai_history_${user?.email || "guest"}`) || "[]");
    } catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`stake_ai_conversations_${user?.email || "guest"}`) || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    localStorage.setItem(`stake_ai_history_${user?.email || "guest"}`, JSON.stringify(messages.slice(-50)));
  }, [messages, user?.email]);

  useEffect(() => {
    localStorage.setItem(`stake_ai_conversations_${user?.email || "guest"}`, JSON.stringify(history.slice(0, 20)));
  }, [history, user?.email]);

  const startNewChat = () => {
    if (messages.length) {
      setHistory((items) => [{
        id: `chat-${Date.now()}`,
        createdAt: Date.now(),
        preview: messages.find((item) => item.role === "user")?.text || "Stake AI conversation",
        messages,
      }, ...items].slice(0, 20));
    }
    setMessages([]);
    setShowHistory(false);
  };

  const handleConfirmTrade = async (tradeToExecute) => {
    if (!tradeToExecute) return;
    setIsExecutingTrade(true);
    try {
      const res = await confirmAgentTrade({
        email: user?.email,
        userId: user?.email,
        ticker: tradeToExecute.ticker,
        side: tradeToExecute.side,
        shares: tradeToExecute.shares,
        price: tradeToExecute.price,
        orderType: tradeToExecute.orderType || "MKT",
        strategy: tradeToExecute.strategy,
        reason: tradeToExecute.reason,
      });

      if (res.success) {
        setMessages((items) => [
          ...items,
          {
            role: "assistant",
            text: `✅ **Trade Authorized & Filled**: Successfully executed **${tradeToExecute.side} ${tradeToExecute.shares} ${tradeToExecute.ticker}** at **$${Number(tradeToExecute.price).toFixed(2)}** (Total: **$${Number(tradeToExecute.total).toLocaleString()}**).\n\nRisk guardrails verified and portfolio updated.`,
          },
        ]);
        setPendingTrade(null);
        await onRefreshUserData?.();
      } else {
        setMessages((items) => [
          ...items,
          {
            role: "assistant",
            text: `⚠️ **Execution Failed**: ${res.message || "Could not fill trade. Check funds."}`,
            error: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((items) => [
        ...items,
        { role: "assistant", text: `⚠️ Error authorizing trade: ${err.message}`, error: true },
      ]);
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const handleCancelTrade = () => {
    if (pendingTrade) {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: `🛡️ **Trade Cancelled**: High-value trade for **${pendingTrade.shares} ${pendingTrade.ticker}** ($${Number(pendingTrade.total).toLocaleString()}) was declined by user. No funds were committed.`,
        },
      ]);
    }
    setPendingTrade(null);
  };

  const send = useCallback(async (value = input) => {
    const text = value.trim();
    if (!text || sending) return;
    const history = messages.map((item) => ({ sender: item.role === "user" ? "user" : "model", text: item.text }));
    setInput("");
    setMessages((items) => [...items, { role: "user", text }]);
    setSending(true);
    try {
      const result = await sendAgentChat({ email: user?.email, message: text, history });
      setMessages((items) => [...items, { role: "assistant", text: result.reply || "No response returned." }]);
      if (result.requiresConfirmation && result.pendingTrade) {
        setPendingTrade(result.pendingTrade);
      }
      if (result.executedActions?.length) await onRefreshUserData?.();
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", text: error.message || "Stake AI is unavailable.", error: true }]);
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, user, onRefreshUserData]);

  if (!isOpen) return null;
  return (
    <>
      {/* Non-blocking Stake AI Side Desk: no modal backdrop so trading, charts, and order desk can be used simultaneously */}
      <aside
        id="stake-ai-sidebar"
        className={`fixed ${
          layout === "sidebar" ? "top-0" : "top-16"
        } right-0 bottom-0 z-40 w-full sm:w-[380px] md:w-[390px] bg-white text-slate-900 shadow-2xl border-l border-emerald-200/90 flex flex-col animate-in slide-in-from-right duration-200`}
      >
        <header className="relative overflow-hidden p-4 border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 flex items-center justify-between">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <BrainCircuit size={19} />
            </div>
            <div>
              <div className="font-black text-sm">Stake AI</div>
              <div className="text-[10px] text-emerald-700 uppercase tracking-widest">Gemini agent online</div>
            </div>
          </div>
          <div className="relative flex gap-2">
            <button onClick={() => setShowHistory((value) => !value)} title="AI history" aria-label="AI history" className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer">
              <History size={14} />
            </button>
            <button onClick={startNewChat} title="New chat" aria-label="New chat" className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-emerald-50 cursor-pointer">
              <Plus size={16} />
            </button>
            <button onClick={onClose} title="Close" aria-label="Close Stake AI" className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </header>
        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h2 className="text-lg font-black">AI history</h2>
            <p className="text-xs text-slate-500">Return to a previous conversation.</p>
            {history.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">
                No saved conversations yet.
              </div>
            ) : (
              history.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => { setMessages(conversation.messages || []); setShowHistory(false); }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-emerald-300 cursor-pointer"
                >
                  <div className="truncate text-xs font-bold">{conversation.preview}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{new Date(conversation.createdAt).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="pt-8">
                <div className="text-2xl font-black">Your market<br /><span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">decision desk.</span></div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">Ask for a prediction, portfolio review, or a guarded trade plan. Gemini uses your live quotes and account context.</p>
                <div className="mt-6 space-y-2">
                  {STARTERS.map((starter) => (
                    <button key={starter} onClick={() => send(starter)} className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer flex items-center justify-between">
                      {starter}
                      <ChevronRight size={14} className="text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${message.role === "user" ? "ml-auto bg-emerald-600 text-white" : message.error ? "bg-rose-50 border border-rose-200 text-rose-800" : "bg-slate-50 border border-slate-200 text-slate-800"}`}>
                  {message.role === "assistant" ? <Markdown>{message.text}</Markdown> : message.text}
                </div>
              ))
            )}
            {sending && (
              <div className="text-xs text-slate-500 flex gap-2 items-center">
                <Loader2 size={14} className="animate-spin text-emerald-600" /> Gemini is reasoning over live context...
              </div>
            )}
          </div>
        )}
        <form onSubmit={(event) => { event.preventDefault(); send(); }} className="p-3 border-t border-slate-100 bg-slate-50/60 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={sending}
            placeholder="Ask Stake AI..."
            className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-emerald-400 placeholder:text-slate-400 text-slate-900 shadow-2xs"
          />
          <button disabled={sending || !input.trim()} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 disabled:opacity-40 cursor-pointer shadow-xs transition-colors flex items-center justify-center">
            <Send size={15} />
          </button>
        </form>
      </aside>

      {/* High-Value Trade Mandatory Confirmation Dialog (> $1,000) */}
      <AgentTradeConfirmationModal
        isOpen={Boolean(pendingTrade)}
        onClose={handleCancelTrade}
        onConfirm={handleConfirmTrade}
        trade={pendingTrade}
        cashBalance={Number(user?.cash ?? 100000)}
        isExecuting={isExecutingTrade}
      />
    </>
  );
}
