import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  RefreshCw,
  BrainCircuit,
  Send,
  Sparkles,
} from "lucide-react";
import Markdown from "react-markdown";
import { sendAgentChat } from "../api";

const SUGGESTIONS = [
  "Analyze NVDA",
  "Should I buy the dip on TSLA?",
  "What's my portfolio worth?",
  "How diversified am I?",
  "Buy $500 of NVDA",
];

export function GeminiStrategySidebar({
  isOpen,
  onClose,
  user,
}) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const targetEmail = user?.email || "trader@stake.com";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? chatInput).trim();
      if (!message || sending) return;
      setChatInput("");
      setSending(true);
      const history = messages.map((m) => ({ sender: m.role === "user" ? "user" : "model", text: m.text }));
      setMessages((prev) => [...prev, { role: "user", text: message }]);
      try {
        const data = await sendAgentChat({ email: targetEmail, message, history });
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.reply, tools: data.toolCalls || [] },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: err.message || "I could not process that request. Please try again.", error: true },
        ]);
      } finally {
        setSending(false);
      }
    },
    [chatInput, sending, messages, targetEmail]
  );

  const resetChat = () => setMessages([]);

  if (!isOpen) return null;

  return (
    <aside
      id="ai-insights-split-sidebar"
      aria-label="AI Insights Split Screen Panel"
      className="fixed top-14 right-0 bottom-0 w-full sm:w-[400px] md:w-[420px] bg-white text-slate-900 z-40 shadow-xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
    >
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">
                AI Insights
              </h3>
              <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Split Screen
              </span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Live stock intelligence & trade assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={resetChat}
              title="Clear conversation"
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close Split Screen"
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center pt-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Sparkles size={24} />
              </div>
              <div className="text-sm font-extrabold text-slate-900">Stake AI Intelligence</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Get real-time stock analysis, portfolio health checks, or execute trades instantly.
              </p>

              <div className="flex flex-col gap-2 mt-5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{s}</span>
                    <Send size={11} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-xs font-medium leading-relaxed shadow-xs">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div
                      className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed border ${
                        m.error
                          ? "bg-rose-50 border-rose-200 text-rose-800"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="prose prose-xs max-w-none text-slate-800">
                        <Markdown>{m.text}</Markdown>
                      </div>
                    </div>
                  </div>
                )
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Analyzing real-time market data...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything or trade..."
              disabled={sending}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-emerald-500"
            />
            <button
              type="submit"
              disabled={sending || !chatInput.trim()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-xs"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </aside>
    );
  }
