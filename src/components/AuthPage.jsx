import { useState } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Logo } from "./Charts";
import { registerUser, loginUser, setStoredAuthToken } from "../api";
import "../styles/auth.css";

export function AuthPage({ initialMode = "login", onLoginSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field validation & interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [touched, setTouched] = useState({});

  // Helper validators
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isInputValid = usernameOrEmail.trim().length >= 2;
  const isEmailValid = emailRegex.test(usernameOrEmail.trim());
  const isUsernameValid = username.trim().length >= 3;
  const isPasswordValid = password.length >= 6;
  const isNameValid = fullName.trim().length >= 2;
  const doPasswordsMatch = mode === "login" || password === confirmPassword;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "None", color: "#64748b" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: "Weak", color: "#ef4444" };
    if (score === 2 || score === 3) return { score: 2, text: "Medium", color: "#f59e0b" };
    return { score: 3, text: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(password);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Form Validation with clean messages
  const validateForm = () => {
    setErrorMsg("");

    if (!usernameOrEmail.trim()) {
      setErrorMsg(mode === "signup" ? "Please enter your email address." : "Please enter your username or email address.");
      triggerShake();
      return false;
    }

    if (mode === "signup" && !isEmailValid) {
      setErrorMsg("Please enter a valid email address (e.g. trader@domain.com).");
      triggerShake();
      return false;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      triggerShake();
      return false;
    }

    if (password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
      triggerShake();
      return false;
    }

    if (mode === "signup") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg("Please enter your full legal name.");
        triggerShake();
        return false;
      }

      if (!username.trim() || username.trim().length < 3) {
        setErrorMsg("Please enter a username (at least 3 characters).");
        triggerShake();
        return false;
      }

      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        triggerShake();
        return false;
      }

      if (!agreeTerms) {
        setErrorMsg("Please agree to the Terms of Service and Risk Disclosures.");
        triggerShake();
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const cleanIdentifier = usernameOrEmail.toLowerCase().trim();
      let res;
      if (mode === "signup") {
        res = await registerUser({
          email: cleanIdentifier,
          username: username.trim(),
          name: fullName.trim(),
          password,
          strategy: "balanced",
        });
      } else {
        res = await loginUser(cleanIdentifier, password);
      }

      if (res && res.user) {
        if (res.token) {
          setStoredAuthToken(res.token);
        }
        try {
          localStorage.setItem("stake_active_user", JSON.stringify(res.user));
        } catch {
          // ignore
        }
        onLoginSuccess(res.user, res.token);
      } else {
        throw new Error("Unable to log in. Please check your credentials.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your details and try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const demoUser = {
      email: `guest.trader${randomId}@stake.com`,
      name: "Guest Trader",
      accountNumber: `STK-GUEST-${randomId}`,
      cash: 50000.0,
      kycStatus: "VERIFIED",
      isGuest: true,
      isDemo: true,
      watchlist: [],
      agentEnabled: false,
      agentStrategy: null,
      holdings: {
        NVDA: { shares: 15, costBasis: 2067.9, avgPrice: 137.86 },
        AAPL: { shares: 25, costBasis: 5711.25, avgPrice: 228.45 },
        MSFT: { shares: 10, costBasis: 4302.0, avgPrice: 430.20 },
      },
    };
    const demoToken = `stk_guest_tok_${Date.now()}`;
    setStoredAuthToken(demoToken);
    try {
      localStorage.setItem("stake_active_user", JSON.stringify(demoUser));
    } catch {
      // ignore
    }
    onLoginSuccess(demoUser, demoToken);
  };

  return (
    <div className="stake-auth-layout">
      {/* =========================================================
          LEFT HERO COLUMN: Image-Matched Atmospheric Dark Hero
         ========================================================= */}
      <div className="stake-auth-left">
        {/* Hero Centerpiece Content */}
        <div className="stake-auth-left-content">
          <div className="stake-hero-brand-block">
            <Logo size={32} textSize={24} dark={true} textColor="#ffffff" />
            <div className="stake-hero-badge-tag">STAKE GLOBAL EXCHANGE</div>
          </div>

          <h1 className="stake-auth-headline-display">
            Invest smarter.<br />Grow your wealth.
          </h1>

          <p className="stake-auth-lead-display">
            Institutional-grade fractional equities, zero commissions, real-time Level 2 market data, and autonomous algorithmic execution.
          </p>
        </div>
      </div>

      {/* =========================================================
          RIGHT AUTH COLUMN: Clean Form with Demo Below Google
         ========================================================= */}
      <div className="stake-auth-right">
        <div className="stake-auth-form-wrapper">
          {/* Top Bar: Back Button */}
          <div className="stake-auth-top-bar">
            {onBackToLanding && (
              <button
                type="button"
                className="stake-back-landing-btn"
                onClick={onBackToLanding}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Title & Desc */}
          <div style={{ marginBottom: 20 }}>
            <h2 className="stake-auth-title">
              {mode === "signup" ? "Create your account." : "Welcome back."}
            </h2>
            <p className="stake-auth-desc">
              {mode === "signup"
                ? "Start trading US equities and ETFs with real-time institutional tools."
                : "Enter your username or email to access your trading terminal."}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="stake-mode-pill-box">
            <button
              type="button"
              className={`stake-mode-pill-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setErrorMsg("");
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`stake-mode-pill-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Inline Error & Success Banners */}
          {errorMsg && (
            <div className="stake-error-banner">
              <AlertCircle size={16} style={{ flexShrink: 0, color: "#ef4444" }} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#991b1b" }}>
                {errorMsg}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="stake-success-banner">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className={`stake-auth-form ${isShaking ? "stake-form-shake" : ""}`}
          >
            {/* Legal Full Name for Signup */}
            {mode === "signup" && (
              <div className="stake-form-group">
                <label className="stake-label">Full Legal Name</label>
                <div className="stake-input-wrapper">
                  <User size={16} className="stake-input-icon" />
                  <input
                    type="text"
                    className={`stake-input ${touched.name && !isNameValid ? "error" : ""}`}
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur("name")}
                  />
                </div>
              </div>
            )}

            {/* Username for Signup */}
            {mode === "signup" && (
              <div className="stake-form-group">
                <label className="stake-label">Username</label>
                <div className="stake-input-wrapper">
                  <span className="stake-input-icon" style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>@</span>
                  <input
                    type="text"
                    className={`stake-input ${touched.username && !isUsernameValid ? "error" : ""}`}
                    placeholder="e.g. alex_rivera"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => handleBlur("username")}
                  />
                </div>
              </div>
            )}

            {/* Username or Email */}
            <div className="stake-form-group">
              <label className="stake-label">
                {mode === "signup" ? "Email Address" : "Username or Email"}
              </label>
              <div className="stake-input-wrapper">
                <Mail size={16} className="stake-input-icon" />
                <input
                  type={mode === "signup" ? "email" : "text"}
                  className={`stake-input ${touched.identifier && !isInputValid ? "error" : ""}`}
                  placeholder={mode === "signup" ? "trader@stake.com" : "Username or email address"}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  onBlur={() => handleBlur("identifier")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="stake-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="stake-label" style={{ marginBottom: 0 }}>Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#006c49", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                    onClick={() => setSuccessMsg("Password reset link sent to your email address.")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="stake-input-wrapper">
                <Lock size={16} className="stake-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`stake-input ${touched.password && !isPasswordValid ? "error" : ""}`}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                />
                <button
                  type="button"
                  className="stake-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength for Signup */}
              {mode === "signup" && password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "#64748b" }}>Security Strength</span>
                    <span style={{ color: strength.color }}>{strength.text}</span>
                  </div>
                  <div style={{ height: 4, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", display: "flex", gap: 3 }}>
                    <div style={{ flex: 1, background: strength.score >= 1 ? strength.color : "transparent" }} />
                    <div style={{ flex: 1, background: strength.score >= 2 ? strength.color : "transparent" }} />
                    <div style={{ flex: 1, background: strength.score >= 3 ? strength.color : "transparent" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password for Signup */}
            {mode === "signup" && (
              <div className="stake-form-group">
                <label className="stake-label">Confirm Password</label>
                <div className="stake-input-wrapper">
                  <Lock size={16} className="stake-input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`stake-input ${touched.confirmPassword && !doPasswordsMatch ? "error" : ""}`}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="stake-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Terms Checkbox for Signup */}
            {mode === "signup" && (
              <label className="stake-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Risk Disclosures</strong>.
                </span>
              </label>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="stake-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="stake-btn-spinner" />
                  <span>{mode === "signup" ? "Creating Account..." : "Signing in..."}</span>
                </>
              ) : mode === "signup" ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="stake-divider">OR CONTINUE WITH</div>

          <div className="stake-social-grid">
            <button
              type="button"
              className="stake-social-btn"
              onClick={() =>
                onLoginSuccess({
                  email: "google.trader@stake.com",
                  name: "Google Trader",
                  accountNumber: "STK-GGL-88210",
                  cash: 50000,
                  holdings: { NVDA: { shares: 10, costBasis: 1378.6, avgPrice: 137.86 } },
                })
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="stake-social-btn"
              onClick={() =>
                onLoginSuccess({
                  email: "apple.trader@stake.com",
                  name: "Apple Trader",
                  accountNumber: "STK-APL-44910",
                  cash: 50000,
                  holdings: { AAPL: { shares: 20, costBasis: 4569.0, avgPrice: 228.45 } },
                })
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.65-.79 1.1-1.88.98-2.98-.95.04-2.1.63-2.77 1.42-.59.68-1.11 1.79-.97 2.86 1.06.08 2.14-.54 2.76-1.3z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Quick Demo Access positioned directly below Google/Apple */}
          <div className="stake-demo-bottom-action">
            <button
              type="button"
              id="bottom-quick-demo-login-btn"
              className="stake-demo-bottom-btn"
              onClick={handleQuickDemoLogin}
              title="Instant exploration with $50,000 demo paper funds"
            >
              <Sparkles size={15} color="#006c49" />
              <span>Explore with Demo Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
