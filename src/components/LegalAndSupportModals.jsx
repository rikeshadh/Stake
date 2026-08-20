import { useState } from "react";
import {
  X,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Clock,
  Send,
  Lock,
  LifeBuoy
} from "lucide-react";

export function LegalAndSupportModals({ activeModal, onClose }) {
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    subject: "",
    message: "",
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeModal) return null;

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.email || !ticketForm.message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedTicket(`STK-TKT-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 17, 12, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          maxWidth: 680,
          width: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 28px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeModal === "privacy" && <Shield size={22} color="#006c49" />}
            {activeModal === "terms" && <FileText size={22} color="#006c49" />}
            {activeModal === "risks" && <AlertTriangle size={22} color="#dc2626" />}
            {activeModal === "support" && <LifeBuoy size={22} color="#0284c7" />}

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#006c49", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>
                {activeModal === "privacy" && "COMPLIANCE & DATA PRIVACY"}
                {activeModal === "terms" && "LEGAL AGREEMENT"}
                {activeModal === "risks" && "REGULATORY DISCLOSURES"}
                {activeModal === "support" && "HELP DESK & CLIENT SUPPORT"}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "2px 0 0", color: "#0f172a", fontFamily: "var(--font-display)" }}>
                {activeModal === "privacy" && "Privacy Policy"}
                {activeModal === "terms" && "Terms of Service"}
                {activeModal === "risks" && "Risk Disclosures"}
                {activeModal === "support" && "Institutional Support Center"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#e2e8f0",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#475569",
              transition: "background 0.15s ease",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
          {/* ================= PRIVACY POLICY ================= */}
          {activeModal === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <Lock size={18} color="#16a34a" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                  Zero Data Selling Commitment: We never sell or monetize your financial or personal records.
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>1. Information We Collect</h3>
                <p style={{ margin: 0 }}>
                  Stake Global Inc. collects identifying details necessary for regulatory compliance (FINRA/SEC KYC requirements), device identifiers for multi-factor security, transaction telemetry, and session logs to deliver sub-second order execution.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>2. Bank-Grade Security & AES-256 Encryption</h3>
                <p style={{ margin: 0 }}>
                  All network traffic is encrypted using TLS 1.3 in transit. At-rest credentials, account numbers, and user records are stored with AES-256 encryption. Agentic AI execution logic is sandboxed without exposing private keys.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>3. Data Sharing & Custody Disclosures</h3>
                <p style={{ margin: 0 }}>
                  Data is only transmitted to authorized clearinghouses, identity verification providers, and market data conduits strictly required to process trades and maintain exchange compliance.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>4. Your Rights (GDPR / CCPA)</h3>
                <p style={{ margin: 0 }}>
                  You retain the right to inspect, export, or permanently delete your account records at any time directly through the Settings panel.
                </p>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                Last revised: August 2026 • Stake Global Compliance Department
              </div>
            </div>
          )}

          {/* ================= TERMS OF SERVICE ================= */}
          {activeModal === "terms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>1. Electronic Trading Agreement</h3>
                <p style={{ margin: 0 }}>
                  By accessing the Stake terminal, you acknowledge that all orders submitted (Market, Limit, After-Market) are self-directed. Stake executes orders based on real-time market liquidity and standard best-execution routing principles.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>2. Autonomous AI Agent Terms</h3>
                <p style={{ margin: 0 }}>
                  When activating the Agentic AI Trading feature, you grant Stake authority to evaluate order books and execute trades strictly within your specified spend ceiling and strategy constraints. You retain full control to pause or decommission the agent at any time.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>3. Settlement & Order Execution</h3>
                <p style={{ margin: 0 }}>
                  All cash equity trades settle on a T+1 regular settlement cycle. Fractional shares are allocated in proportion to prevailing market prices. Simulated accounts utilize real-time price feeds for training purposes.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>4. Account Security & Verification</h3>
                <p style={{ margin: 0 }}>
                  You are responsible for safeguarding your login credentials. Stake reserves the right to request KYC identity verification to fulfill anti-money laundering (AML) protocols.
                </p>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                Stake Global Terms of Service v4.2 • Governed under Applicable Financial Regulations
              </div>
            </div>
          )}

          {/* ================= RISK DISCLOSURES ================= */}
          {activeModal === "risks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 16px", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#991b1b" }}>Capital Loss & Volatility Notice</div>
                  <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 2 }}>
                    Securities trading involves substantial risk of loss and is not suitable for every investor. You may lose some or all of your invested capital.
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>1. Market Volatility & Price Fluctuations</h3>
                <p style={{ margin: 0 }}>
                  Stock prices fluctuate rapidly based on macroeconomic conditions, corporate earnings, and liquidity dynamics. Past performance of any scrip, sector, or algorithmic model is not indicative of future results.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>2. Fractional Share Trading Mechanics</h3>
                <p style={{ margin: 0 }}>
                  Fractional shares cannot be transferred to another broker-dealer in-kind and must be liquidated if closing an account. Voting rights and dividends are allocated on a strictly proportional basis.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>3. Algorithmic & AI Autonomous Execution</h3>
                <p style={{ margin: 0 }}>
                  Automated strategies (such as Dip Buyer, Momentum Breakout, or Agentic AI) operate based on algorithmic rules. Extreme market dislocations, slippage, and connectivity delays may impact execution prices.
                </p>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                SIPC protects securities customers up to $500,000 (including $250,000 for cash claims). Explanatory brochure available upon request.
              </div>
            </div>
          )}

          {/* ================= SUPPORT & HELP DESK ================= */}
          {activeModal === "support" && (
            <div>
              {submittedTicket ? (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <CheckCircle2 size={54} color="#16a34a" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Ticket Received</h3>
                  <p style={{ fontSize: 14.5, color: "#475569", maxWidth: 440, margin: "0 auto 16px" }}>
                    Your support request has been logged. An institutional support representative will review and respond within 15 minutes.
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#f1f5f9",
                      padding: "8px 18px",
                      borderRadius: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 800,
                      color: "#006c49",
                      marginBottom: 20,
                    }}
                  >
                    REFERENCE ID: {submittedTicket}
                  </div>
                  <br />
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setTicketForm({ name: "", email: "", category: "General Inquiry", subject: "", message: "" });
                    }}
                    style={{
                      background: "#006c49",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <div>
                  {/* Status Banner */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 12, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>All Systems Operational</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                      API Latency: 24ms • 24/7 Desk
                    </span>
                  </div>

                  {/* Direct Contact Channels */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <Mail size={18} color="#006c49" />
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>EMAIL DESK</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>support@stake.com</div>
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <Clock size={18} color="#006c49" />
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>HOURS</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>24/7 Global Trading Desk</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Morgan"
                          value={ticketForm.name}
                          onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13.5,
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="alex@example.com"
                          value={ticketForm.email}
                          onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13.5,
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Category
                        </label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13.5,
                            background: "#ffffff",
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        >
                          <option>General Inquiry</option>
                          <option>Trade Execution & Order Status</option>
                          <option>Deposit / Withdrawal Help</option>
                          <option>Autonomous AI Agent Setup</option>
                          <option>KYC & Identity Verification</option>
                          <option>Technical Bug / API Issue</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Subject
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Brief description"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13.5,
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                        Message / Details
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Please provide specifics regarding your question or order..."
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          fontSize: 13.5,
                          boxSizing: "border-box",
                          resize: "vertical",
                          outline: "none",
                          fontFamily: "var(--font-body)",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        background: "#006c49",
                        color: "#ffffff",
                        padding: "11px 20px",
                        borderRadius: 10,
                        border: "none",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        marginTop: 4,
                      }}
                    >
                      <Send size={16} /> {isSubmitting ? "Submitting Ticket..." : "Submit Support Request"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Stake Equities Global Compliance • SIPC & FINRA Member
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
