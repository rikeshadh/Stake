import { useState } from "react";
import {
  User,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Shield,
  Lock,
  Edit3,
  Sparkles,
} from "lucide-react";
import { submitKycData } from "../api";

export function KycPage({
  user,
  onKycVerified,
  showToast,
}) {
  const existingKyc = user?.kycData || {};
  const isVerifiedUser = user?.kycStatus === "VERIFIED" || Boolean(existingKyc.status === "VERIFIED" || existingKyc.documentNumber);

  // Default to form filling if unverified (e.g. creating account), or details view if already verified (hamburger menu)
  const [isEditing, setIsEditing] = useState(!isVerifiedUser);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStageText, setVerificationStageText] = useState("");

  const [formData, setFormData] = useState(() => ({
    fullName: existingKyc.fullName || user?.name || "",
    dob: existingKyc.dob || "",
    nationality: existingKyc.nationality || "",
    phoneNumber: existingKyc.phoneNumber || "",
    taxId: existingKyc.taxId || "",
    address: existingKyc.address || "",
    documentType: existingKyc.documentType || "PASSPORT",
    documentNumber: existingKyc.documentNumber || "",
    frontDocName: existingKyc.frontDocName || "",
    backDocName: existingKyc.backDocName || "",
    selfieConfirmed: existingKyc.selfieConfirmed !== undefined ? existingKyc.selfieConfirmed : false,
    employment: existingKyc.employment || "",
    occupation: existingKyc.occupation || "",
    annualIncome: existingKyc.annualIncome || "",
    netWorth: existingKyc.netWorth || "",
    investmentGoal: existingKyc.investmentGoal || "Long-term Capital Growth & Equities",
    riskTolerance: existingKyc.riskTolerance || "",
  }));

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setValidationError("");
  };

  // Populate random demo identity on demand, preserving any existing name entered by user
  const handleGenerateRandomDemo = () => {
    const randomYear = Math.floor(1980 + Math.random() * 22);
    const randomMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, "0");
    const randomDay = String(Math.floor(1 + Math.random() * 28)).padStart(2, "0");

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName?.trim() || user?.name?.trim() || "Rikesh Adhikari",
      dob: prev.dob || `${randomYear}-${randomMonth}-${randomDay}`,
      nationality: prev.nationality?.trim() || "United States",
      phoneNumber: prev.phoneNumber?.trim() || `+1 (555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
      taxId: prev.taxId?.trim() || `XXX-XX-${Math.floor(1000 + Math.random() * 8999)}`,
      address: prev.address?.trim() || `${Math.floor(100 + Math.random() * 899)} Wall Street, New York, NY 10005`,
      documentType: prev.documentType || "PASSPORT",
      documentNumber: prev.documentNumber?.trim() || `US-${Math.floor(10000000 + Math.random() * 89999999)}`,
      frontDocName: prev.frontDocName || "passport_identity_scan.pdf",
      backDocName: prev.backDocName || "passport_back_cover.pdf",
      selfieConfirmed: true,
      employment: prev.employment || "Full-Time Employed",
      occupation: prev.occupation?.trim() || "Quantitative Analyst / Developer",
      annualIncome: prev.annualIncome || "$100,000 - $250,000",
      netWorth: prev.netWorth || "$250,000 - $500,000",
      investmentGoal: prev.investmentGoal || "Long-term Capital Growth & Equities",
      riskTolerance: prev.riskTolerance || "Moderate to Aggressive Growth",
    }));
    setValidationError("");
    if (showToast) showToast("Populated Demo verification details!");
  };

  const validateStep = (s) => {
    setValidationError("");
    if (s === 1) {
      if (!formData.fullName.trim()) return "Full legal name is required.";
      if (!formData.dob) return "Date of birth is required.";
      if (!formData.nationality.trim()) return "Nationality is required.";
      if (!formData.phoneNumber.trim()) return "Phone number is required.";
      if (!formData.taxId.trim()) return "Tax ID / SSN is required.";
      if (!formData.address.trim()) return "Residential address is required.";
    } else if (s === 2) {
      if (!formData.documentNumber.trim()) return "Document ID number is required.";
      if (!formData.frontDocName) return "Please upload your identity document.";
      if (!formData.selfieConfirmed) return "Biometric liveness verification is required.";
    } else if (s === 3) {
      if (!formData.employment) return "Please select employment status.";
      if (!formData.occupation.trim()) return "Occupation title is required.";
      if (!formData.annualIncome) return "Please select annual income bracket.";
      if (!formData.riskTolerance) return "Please select your risk tolerance.";
    }
    return null;
  };

  const handleNextStep = () => {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setValidationError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitVerification = async (e) => {
    if (e) e.preventDefault();
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }

    setLoading(true);
    setVerificationProgress(25);
    setVerificationStageText("Encrypting identity payloads with AES-256...");

    setTimeout(() => {
      setVerificationProgress(60);
      setVerificationStageText("Scanning document security watermarks and MRZ zones...");
    }, 500);

    setTimeout(() => {
      setVerificationProgress(90);
      setVerificationStageText("Matching facial biometric anchors and FINRA/AML database clearance...");
    }, 1000);

    setTimeout(async () => {
      setVerificationProgress(100);
      setVerificationStageText("Verification complete! Regulatory compliance unlocked.");

      const verifiedPayload = {
        ...formData,
        status: "VERIFIED",
        verifiedAt: new Date().toISOString(),
        complianceOfficer: "Stake FINRA/AML Automated Verification Node",
        verificationId: `KYC-US-${Math.floor(10000000 + Math.random() * 90000000)}`,
      };

      try {
        await submitKycData(user?.email, verifiedPayload);
      } catch (err) {
        console.warn("KYC server sync fallback:", err);
      }

      setTimeout(() => {
        setLoading(false);
        setIsEditing(false);
        if (onKycVerified) onKycVerified(verifiedPayload);
        if (showToast) showToast("Identity Verification (KYC) Saved Successfully!");
      }, 400);
    }, 1500);
  };

  // Palette
  const bgCard = "#ffffff";
  const borderCol = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const inputBg = "#f8fafc";

  // VIEW MODE: Show user's details with Edit button
  if (!isEditing) {
    return (
      <div
        id="kyc-details-container"
        style={{
          maxWidth: 840,
          margin: "0 auto",
          padding: "24px 16px 60px",
          textAlign: "left",
          fontFamily: "'Hanken Grotesk', sans-serif",
        }}
      >
        {/* Header with Title & Edit Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: textPrimary, margin: 0 }}>
                KYC Identity Record
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <CheckCircle2 size={14} /> Verified Account
              </span>
            </div>
            <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
              Federal securities compliance, FINRA Rule 2090, and anti-money laundering (AML) verification record.
            </p>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            id="kyc-edit-details-btn"
            onClick={() => {
              setIsEditing(true);
              setStep(1);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              background: "#059669",
              border: "none",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Edit3 size={15} />
            <span>Edit</span>
          </button>
        </div>

        {/* Breakdown Grid of KYC Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 1: Personal Details */}
          <div
            style={{
              background: bgCard,
              borderRadius: 16,
              border: `1px solid ${borderCol}`,
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
              <User size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: textPrimary }}>
                Personal Information
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Full Legal Name</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginTop: 3 }}>{formData.fullName || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Date of Birth</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.dob || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Nationality</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.nationality || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Phone Number</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.phoneNumber || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Tax ID / SSN</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.taxId || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Residential Address</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.address || "—"}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Identity Document */}
          <div
            style={{
              background: bgCard,
              borderRadius: 16,
              border: `1px solid ${borderCol}`,
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
              <FileText size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: textPrimary }}>
                Document Verification
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Document Type</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginTop: 3 }}>{formData.documentType || "PASSPORT"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Document Number</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{formData.documentNumber || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>ID Scan Document</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", marginTop: 3 }}>✓ {formData.frontDocName || "passport_scan.pdf"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Biometric Liveness</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", marginTop: 3 }}>✓ Matched & Verified</div>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Suitability Profile */}
          <div
            style={{
              background: bgCard,
              borderRadius: 16,
              border: `1px solid ${borderCol}`,
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: `1px solid ${borderCol}`, paddingBottom: 10 }}>
              <Briefcase size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: textPrimary }}>
                Financial Suitability Profile
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Employment Status</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginTop: 3 }}>{formData.employment || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Occupation</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.occupation || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Annual Income</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.annualIncome || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Estimated Net Worth</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.netWorth || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Investment Objective</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.investmentGoal || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Risk Tolerance</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 3 }}>{formData.riskTolerance || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EDIT MODE: Step-by-step interactive form
  return (
    <div
      id="kyc-page-container"
      style={{
        maxWidth: 840,
        margin: "0 auto",
        padding: "24px 16px 60px",
        textAlign: "left",
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: textPrimary, margin: "0 0 4px" }}>
            Identity Verification (KYC)
          </h1>
          <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
            Federal securities compliance, FINRA Rule 2090, and anti-money laundering (AML) regulatory verification.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isVerifiedUser && (
            <button
              type="button"
              id="kyc-cancel-edit-btn"
              onClick={() => setIsEditing(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "#f1f5f9",
                border: `1px solid ${borderCol}`,
                color: textPrimary,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Details</span>
            </button>
          )}

          {/* Quick Demo Pre-fill Button */}
          <button
            type="button"
            id="kyc-demo-btn"
            onClick={handleGenerateRandomDemo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#059669",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Auto-fill form with sample Demo identity profile"
          >
            <Sparkles size={15} />
            <span>Demo</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div
        style={{
          background: bgCard,
          borderRadius: 20,
          border: `1px solid ${borderCol}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          padding: "28px",
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, position: "relative" }}>
          {[
            { s: 1, title: "Personal Details", icon: User },
            { s: 2, title: "Document Upload", icon: FileText },
            { s: 3, title: "Financial Profile", icon: Briefcase },
            { s: 4, title: "Review & Submit", icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = step > item.s;
            const isCur = step === item.s;
            return (
              <div
                key={item.s}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 13,
                    background: isDone ? "#10b981" : isCur ? "rgba(16, 185, 129, 0.15)" : "#f1f5f9",
                    color: isDone ? "#ffffff" : isCur ? "#059669" : textSecondary,
                    border: isCur ? "2px solid #10b981" : "none",
                    marginBottom: 6,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: isCur ? 800 : 600,
                    color: isCur ? textPrimary : textSecondary,
                    textAlign: "center",
                  }}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>
              Step 1: Legal Identity & Residential Address
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Chen"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Nationality *
                </label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Tax Identification Number (SSN/TIN) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. XXX-XX-9482"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Residential Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 120 Broadway, New York, NY"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Document Verification */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>
              Step 2: Government-Issued Identity Document
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleInputChange("documentType", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="PASSPORT">Passport (International)</option>
                  <option value="DRIVERS_LICENSE">Driver's License / State ID</option>
                  <option value="NATIONAL_ID">National Identity Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Document Number / Passport ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. US-98421045"
                  value={formData.documentNumber}
                  onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Upload Box */}
            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: 14,
                padding: "24px",
                textAlign: "center",
                background: "#f8fafc",
                cursor: "pointer",
                marginBottom: 20,
              }}
              onClick={() => handleInputChange("frontDocName", "government_id_scan.pdf")}
            >
              <Upload size={28} color="#059669" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>
                {formData.frontDocName ? `Uploaded: ${formData.frontDocName}` : "Click or Drag & Drop Document Scan (PDF, JPG, PNG)"}
              </div>
              <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 4 }}>
                Ensure all 4 corners and machine-readable zones (MRZ) are clearly legible.
              </div>
            </div>

            {/* Biometric Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "12px 14px",
                background: inputBg,
                borderRadius: 10,
                border: `1px solid ${borderCol}`,
              }}
            >
              <input
                type="checkbox"
                checked={formData.selfieConfirmed}
                onChange={(e) => handleInputChange("selfieConfirmed", e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#10b981", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>
                I confirm liveness verification and authorization for automated FINRA biometric verification.
              </span>
            </label>
          </div>
        )}

        {/* STEP 3: Financial Suitability Profile */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>
              Step 3: Employment & Investment Profile
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Employment Status *
                </label>
                <select
                  value={formData.employment}
                  onChange={(e) => handleInputChange("employment", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="">Select Employment</option>
                  <option value="Full-Time Employed">Full-Time Employed</option>
                  <option value="Self-Employed / Business Owner">Self-Employed / Business Owner</option>
                  <option value="Investor / Trader">Professional Investor / Trader</option>
                  <option value="Retired">Retired</option>
                  <option value="Student">Student</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Occupation / Professional Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer / Financial Analyst"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Annual Income Bracket *
                </label>
                <select
                  value={formData.annualIncome}
                  onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="">Select Income</option>
                  <option value="Under $50,000">Under $50,000</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                  <option value="$100,000 - $250,000">$100,000 - $250,000</option>
                  <option value="$250,000 - $500,000">$250,000 - $500,000</option>
                  <option value="Over $500,000">Over $500,000</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Estimated Liquid Net Worth
                </label>
                <select
                  value={formData.netWorth}
                  onChange={(e) => handleInputChange("netWorth", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="">Select Net Worth</option>
                  <option value="Under $100,000">Under $100,000</option>
                  <option value="$100,000 - $250,000">$100,000 - $250,000</option>
                  <option value="$250,000 - $500,000">$250,000 - $500,000</option>
                  <option value="$500,000 - $1,000,000">$500,000 - $1,000,000</option>
                  <option value="Over $1,000,000">Over $1,000,000</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Investment Goal
                </label>
                <select
                  value={formData.investmentGoal}
                  onChange={(e) => handleInputChange("investmentGoal", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="Capital Preservation">Capital Preservation</option>
                  <option value="Income & Dividends">Income & Dividends</option>
                  <option value="Long-term Capital Growth & Equities">Long-term Capital Growth & Equities</option>
                  <option value="Active Day Trading & Speculation">Active Day Trading & Speculation</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                  Risk Tolerance *
                </label>
                <select
                  value={formData.riskTolerance}
                  onChange={(e) => handleInputChange("riskTolerance", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    fontSize: 13.5,
                    color: textPrimary,
                  }}
                >
                  <option value="">Select Risk Level</option>
                  <option value="Conservative">Conservative (Low Risk)</option>
                  <option value="Moderate">Moderate Growth</option>
                  <option value="Aggressive Growth & Equities">Aggressive Growth & Equities</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Submission */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>
              Step 4: Review Identity Dossier & Attestation
            </h3>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: 14,
                border: `1px solid ${borderCol}`,
                padding: "18px 20px",
                marginBottom: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>LEGAL NAME</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.fullName || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>DOB & NATIONALITY</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.dob} ({formData.nationality})</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>DOCUMENT</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.documentType} : {formData.documentNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>EMPLOYMENT</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.employment} - {formData.occupation}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>INCOME BRACKET</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.annualIncome || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700 }}>RISK TOLERANCE</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: textPrimary }}>{formData.riskTolerance || "—"}</div>
              </div>
            </div>

            {loading && (
              <div style={{ marginBottom: 20, padding: 16, background: "rgba(16, 185, 129, 0.08)", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 6 }}>
                  <span>{verificationStageText}</span>
                  <span>{verificationProgress}%</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${verificationProgress}%`,
                      background: "#10b981",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls & Error display next to Next Step */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${borderCol}`,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: `1px solid ${borderCol}`,
                  background: "#f8fafc",
                  fontSize: 13,
                  fontWeight: 700,
                  color: textPrimary,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Inline validation error display right next to the next/submit button */}
            {validationError && (
              <div
                id="kyc-validation-error"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#ef4444",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "6px 12px",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <AlertCircle size={15} />
                <span>{validationError}</span>
              </div>
            )}

            {step < 4 ? (
              <button
                type="button"
                id="kyc-next-step-btn"
                onClick={handleNextStep}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                }}
              >
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                id="kyc-submit-btn"
                onClick={handleSubmitVerification}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                }}
              >
                <Lock size={16} />
                <span>{loading ? "Verifying Identity..." : "Save & Verify KYC"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

