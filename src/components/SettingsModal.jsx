import { useState } from "react";
import {
  X,
  Globe,
  Shield,
  Check,
  User,
  Sliders,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { CURRENCIES } from "../utils";

export function SettingsModal({
  isOpen,
  onClose,
  currency,
  setCurrency,
  privacyMode,
  setPrivacyMode,
  onOpenKyc,
  onDeleteAccount,
  kycStatus = "UNVERIFIED",
  user,
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (err) {
      console.error("Delete account error:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onClose();
    }
  };

  return (
    <>
      <div
        id="settings-modal-backdrop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "'Hanken Grotesk', sans-serif",
        }}
        onClick={onClose}
      >
        <div
          id="settings-modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 580,
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #e2e8f0",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            maxHeight: "90vh",
            textAlign: "left",
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sliders size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Settings
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Customize currency, privacy mode, and account preferences
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Currency Selection Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Globe size={16} color="#059669" />
                <label style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Display Currency
                </label>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                Select your preferred global currency. All share prices and account balances will update instantly across the entire platform.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 8,
                }}
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => {
                  const isSelected = currency === code;
                  return (
                    <button
                      key={code}
                      id={`settings-currency-btn-${code}`}
                      onClick={() => setCurrency(code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: isSelected ? "2px solid #10b981" : "1px solid #e2e8f0",
                        background: isSelected ? "rgba(16, 185, 129, 0.08)" : "#f8fafc",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? "#059669" : "#0f172a" }}>
                          {curr.code} ({curr.symbol})
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{curr.name.split(" ")[0]}</div>
                      </div>
                      {isSelected && <Check size={16} color="#059669" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy & Balances Section */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Shield size={16} color="#059669" />
                <label style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Privacy & Security
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    Mask Financial Balances
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>
                    Hide portfolio totals and cash balances with asterisks (••••) while keeping individual share prices visible
                  </div>
                </div>
                <input
                  id="settings-privacy-mode-toggle"
                  type="checkbox"
                  checked={privacyMode}
                  onChange={(e) => setPrivacyMode(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* KYC Status & Verification Link */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <User size={16} color="#059669" />
                <label style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Identity & Regulatory Compliance
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    KYC Verification Status:{" "}
                    <span style={{ color: kycStatus === "VERIFIED" ? "#10b981" : "#ef4444", fontWeight: 800 }}>
                      {kycStatus === "VERIFIED" ? "Verified" : "Pending Verification"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>
                    FINRA Rule 2090 identity documentation and customer record
                  </div>
                </div>
                <button
                  id="settings-view-kyc-btn"
                  onClick={() => {
                    onClose();
                    if (onOpenKyc) onOpenKyc();
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  {kycStatus === "VERIFIED" ? "View" : "Complete KYC"}
                </button>
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div style={{ borderTop: "1px solid #fee2e2", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Trash2 size={16} color="#ef4444" />
                <label style={{ fontSize: 13.5, fontWeight: 800, color: "#b91c1c" }}>
                  Danger Zone
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "rgba(239, 68, 68, 0.04)",
                  borderRadius: 14,
                  border: "1px solid #fecaca",
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#991b1b" }}>
                    Delete Account
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Permanently delete your profile ({user?.email || "trader@stake.com"}), holdings, order history, and cloud records.
                  </div>
                </div>
                <button
                  id="settings-delete-account-btn"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setShowDeleteModal(true);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "1px solid #ef4444",
                    background: "#ffffff",
                    color: "#dc2626",
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.1)",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                background: "#059669",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated High-Priority Delete Account Pop-up Confirmation Modal */}
      {showDeleteModal && (
        <div
          id="delete-account-modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: "'Hanken Grotesk', sans-serif",
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            id="delete-account-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#ffffff",
              borderRadius: 24,
              border: "1px solid #fee2e2",
              boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)",
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            <div style={{ padding: "24px 24px 18px", borderBottom: "1px solid #fecaca", background: "#fef2f2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "#fee2e2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#991b1b" }}>
                    Delete Account Permanently?
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#b91c1c" }}>
                    This action is immediate and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
                Deleting your account will remove your investment portfolio, trading transaction history, cash ledger, and KYC compliance records from Stake Global Exchange.
              </p>

              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Account to be purged
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                  {user?.email || "trader@stake.com"}
                </div>
              </div>

              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Type <span style={{ color: "#dc2626", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>DELETE</span> to confirm:
              </label>
              <input
                id="delete-account-confirm-input"
                type="text"
                autoFocus
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: deleteConfirmText.trim().toUpperCase() === "DELETE" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  id="delete-account-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  id="delete-account-execute-btn"
                  onClick={handleDelete}
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                  style={{
                    flex: 1.4,
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: deleteConfirmText.trim().toUpperCase() === "DELETE" ? "#dc2626" : "#f1f5f9",
                    color: deleteConfirmText.trim().toUpperCase() === "DELETE" ? "#ffffff" : "#94a3b8",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: deleteConfirmText.trim().toUpperCase() === "DELETE" && !isDeleting ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: deleteConfirmText.trim().toUpperCase() === "DELETE" ? "0 4px 12px rgba(220, 38, 38, 0.3)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

