import { useState, useEffect } from "react";
import {
  X,
  Globe,
  Shield,
  Check,
  User,
  Sliders,
  Trash2,
  AlertTriangle,
  Loader2,
  Database,
  Server,
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

  // MongoDB Cluster Connection state
  const [mongoUri, setMongoUri] = useState("");
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    mode: "In-Memory Dual-State Engine",
    error: null,
    loading: true,
  });
  const [connectingDb, setConnectingDb] = useState(false);
  const [dbFeedback, setDbFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function checkDb() {
      try {
        const res = await fetch("/api/database/status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setDbStatus({
              connected: Boolean(data.connected),
              mode: data.mode || "In-Memory Dual-State Engine",
              error: data.error,
              loading: false,
            });
          }
        }
      } catch {
        if (isMounted) {
          setDbStatus((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    checkDb();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectMongo = async () => {
    if (!mongoUri.trim()) {
      setDbFeedback({ type: "error", message: "Please enter your MongoDB connection string." });
      return;
    }

    if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
      setDbFeedback({
        type: "error",
        message: "Invalid connection format. Must start with mongodb:// or mongodb+srv://",
      });
      return;
    }

    setConnectingDb(true);
    setDbFeedback(null);

    try {
      const res = await fetch("/api/database/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: mongoUri.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDbStatus({
          connected: true,
          mode: "MongoDB Atlas Cluster",
          error: null,
          loading: false,
        });
        setDbFeedback({
          type: "success",
          message: "Connected successfully to MongoDB Atlas Cluster! Your accounts and records are now persistently stored in your cluster.",
        });
        setMongoUri("");
      } else {
        setDbStatus((prev) => ({
          ...prev,
          connected: false,
          error: data.message || "Failed to connect to cluster.",
        }));
        setDbFeedback({
          type: "error",
          message: data.message || "Could not connect to MongoDB cluster. Check username, password & IP whitelist (0.0.0.0/0).",
        });
      }
    } catch (err) {
      setDbFeedback({
        type: "error",
        message: err.message || "Connection request failed.",
      });
    } finally {
      setConnectingDb(false);
    }
  };

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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-slate-900"
        onClick={onClose}
      >
        <div
          id="settings-modal-dialog"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Sliders size={19} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Terminal & Cluster Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Configure preferences, currency & MongoDB Atlas Cluster
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* MongoDB Atlas Cluster Connection Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database size={17} className="text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    MongoDB Atlas Cluster
                  </h4>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    dbStatus.connected
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  {dbStatus.connected ? "Cluster Connected" : "In-Memory Dual Mode"}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Connect your custom MongoDB Atlas cluster database for permanent user storage, trade audit logs, and account persistence.
              </p>

              {dbFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium mb-3 flex items-start gap-2 ${
                    dbFeedback.type === "success"
                      ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {dbFeedback.type === "success" ? (
                    <Check size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-rose-600" />
                  )}
                  <span>{dbFeedback.message}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="settings-mongodb-uri-input"
                    type="password"
                    placeholder="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/stake_db"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    id="settings-connect-mongo-btn"
                    type="button"
                    onClick={handleConnectMongo}
                    disabled={connectingDb}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                  >
                    {connectingDb ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Server size={13} />
                        <span>Connect Cluster</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Tip: In MongoDB Atlas, allow IP Access: <code>0.0.0.0/0</code></span>
                  <span>SSL/TLS Enabled</span>
                </div>
              </div>
            </div>

            {/* Currency Selection Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-emerald-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Display Currency
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(CURRENCIES).map(([code, curr]) => {
                  const isSelected = currency === code;
                  return (
                    <button
                      key={code}
                      id={`currency-btn-${code}`}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs">
                        <div className="font-bold">{code}</div>
                        <div className="text-[11px] text-slate-400">{curr.symbol} {curr.name}</div>
                      </div>
                      {isSelected && <Check size={14} className="text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Mode Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={15} className="text-emerald-600" /> Privacy Mode (Mask Balances)
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Mask sensitive net worth and account cash totals with asterisks (••••••)
                </p>
              </div>
              <input
                id="settings-privacy-mode-toggle"
                type="checkbox"
                checked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* KYC Status & Verification Link */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <User size={15} className="text-emerald-600" /> Identity & Regulatory Compliance
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">
                  Status:{" "}
                  <strong className={kycStatus === "VERIFIED" ? "text-emerald-600" : "text-rose-600"}>
                    {kycStatus === "VERIFIED" ? "Verified" : "Pending Verification"}
                  </strong>
                </div>
              </div>
              <button
                id="settings-view-kyc-btn"
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenKyc) onOpenKyc();
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                {kycStatus === "VERIFIED" ? "View KYC" : "Complete KYC"}
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="pt-3 border-t border-rose-100">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <Trash2 size={15} /> Delete Account & Cloud Records
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permanently delete {user?.email || "active account"} and reset all portfolio data.
                  </p>
                </div>
                <button
                  id="settings-delete-account-btn"
                  type="button"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Pop-up Confirmation Modal */}
      {showDeleteModal && (
        <div
          id="delete-account-modal-backdrop"
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-slate-900"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            id="delete-account-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900">
              Delete Trading Account?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              This action cannot be undone. All holdings, order history, cash balances, and cloud records for <strong>{user?.email || "your account"}</strong> will be permanently deleted.
            </p>

            <div className="my-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type <span className="text-rose-600 font-mono">DELETE</span> to confirm:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-account-btn"
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
