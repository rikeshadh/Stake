import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Logo } from "./Charts";
import { registerUser, loginUser } from "../api";
import "../styles/auth.css";

const RISING_STOCK_BUBBLES = [
  { ticker: "NVDA", price: "$137.86", chg: "+2.8%", isUp: true, left: "8%", delay: "0s", duration: "8.5s", path: "path-1" },
  { ticker: "TSLA", price: "$248.50", chg: "-2.1%", isUp: false, left: "65%", delay: "1.2s", duration: "9.2s", path: "path-2" },
  { ticker: "AAPL", price: "$228.45", chg: "+1.4%", isUp: true, left: "34%", delay: "2.8s", duration: "7.8s", path: "path-3" },
  { ticker: "INTC", price: "$21.30", chg: "-3.4%", isUp: false, left: "16%", delay: "4.1s", duration: "8.2s", path: "path-4" },
  { ticker: "COIN", price: "$276.46", chg: "+4.6%", isUp: true, left: "52%", delay: "5.5s", duration: "9.0s", path: "path-1" },
  { ticker: "MSFT", price: "$430.20", chg: "+0.9%", isUp: true, left: "78%", delay: "3.2s", duration: "8.6s", path: "path-2" },
  { ticker: "AMD", price: "$156.80", chg: "+3.2%", isUp: true, left: "24%", delay: "6.8s", duration: "7.5s", path: "path-3" },
  { ticker: "PLTR", price: "$42.60", chg: "+5.1%", isUp: true, left: "44%", delay: "0.8s", duration: "8.0s", path: "path-4" },
];

export function AuthPage({ initialMode = "login", onLoginSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
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
  const [touched, setTouched] = useState({});

  // Helper validators
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isInputValid = usernameOrEmail.trim().length >= 2;
  const isEmailValid = emailRegex.test(usernameOrEmail.trim());
  const isPasswordValid = password.length >= 6;
  const isNameValid = fullName.trim().length >= 2;
  const doPasswordsMatch = mode === "login" || password === confirmPassword;

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

  // Form Validation with clear, direct messages (no 'Notice' popups)
  const validateForm = () => {
    setErrorMsg("");

    if (!usernameOrEmail.trim()) {
      setErrorMsg(mode === "signup" ? "Please enter your email address." : "Please enter your username or email address.");
      return false;
    }

    if (mode === "signup" && !isEmailValid) {
      setErrorMsg("Please enter a valid email address (e.g. trader@domain.com).");
      return false;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
      return false;
    }

    if (mode === "signup") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg("Please enter your full legal name.");
        return false;
      }

      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return false;
      }

      if (!agreeTerms) {
        setErrorMsg("Please agree to the Terms of Service and Risk Disclosures.");
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
          name: fullName.trim(),
          password,
        });
      } else {
        res = await loginUser(cleanIdentifier, password);
      }

      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        throw new Error("Unable to log in. Please check your credentials.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const randomNames = ["Alex Rivera", "Jordan Vance", "Sam Kowalski", "Taylor Smith", "Morgan Dubois"];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    onLoginSuccess({
      email: `demo.trader${randomId}@stake.com`,
      name: chosenName,
      accountNumber: `STK-DEMO-${randomId}`,
      cash: 50000,
      holdings: {
        NVDA: { shares: 15, costBasis: 2067.9, avgPrice: 137.86 },
        AAPL: { shares: 25, costBasis: 5711.25, avgPrice: 228.45 },
      },
    });
  };

  return (
    <div className="stake-auth-layout">
      {/* LEFT HERO IMAGE COLUMN WITH FASTER, RANDOMIZED RISING STOCK BUBBLES */}
      <div className="stake-auth-left">
        {/* Animated Rising Stock Bubbles Field */}
        <div className="stake-auth-bubble-field">
          {RISING_STOCK_BUBBLES.map((bubble, idx) => (
            <div
              key={`${bubble.ticker}-${idx}`}
              className={`stake-rising-stock-bubble ${bubble.isUp ? "up" : "down"} ${bubble.path}`}
              style={{
                left: bubble.left,
                animationDelay: bubble.delay,
                animationDuration: bubble.duration,
              }}
            >
              <div className="bubble-ticker-tag">{bubble.ticker}</div>
              <div className="bubble-price-tag">{bubble.price}</div>
              <div className={`bubble-chg-tag ${bubble.isUp ? "up" : "down"}`}>
                {bubble.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>{bubble.chg}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Large Hero Content */}
        <div className="stake-auth-left-content">
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <Logo size={40} textSize={26} dark={true} />
          </div>

          <div className="stake-auth-eyebrow">
            STAKE GLOBAL EXCHANGE
          </div>

          <h1 className="stake-auth-headline">
            Invest smarter.<br />
            Grow your wealth.
          </h1>

          <p className="stake-auth-lead">
            Institutional-grade fractional equities, zero commissions, real-time Level 2 market data, and autonomous algorithmic execution.
          </p>
        </div>
      </div>

      {/* RIGHT AUTH FORM COLUMN */}
      <div className="stake-auth-right">
        <div className="stake-auth-form-wrapper">
          {/* Top Bar with Aligned Back Button */}
          <div className="stake-auth-top-bar">
            {onBackToLanding ? (
              <button
                type="button"
                onClick={onBackToLanding}
                className="stake-back-landing-btn"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : <div />}
          </div>

          <h2 className="stake-auth-title">
            {mode === "signup" ? "Create account." : "Welcome back."}
          </h2>

          <p className="stake-auth-desc">
            {mode === "signup"
              ? "Open your account, complete identity verification, and start investing."
              : "Enter your username or email to access your trading terminal."}
          </p>

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
              Log in
            </button>
            <button
              type="button"
              className={`stake-mode-pill-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
              }}
            >
              Sign up
            </button>
          </div>

          {/* Clean inline error banner (no Notice header) */}
          {errorMsg && (
            <div className="stake-error-banner">
              <AlertCircle size={17} style={{ flexShrink: 0, color: "#ef4444" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
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

          {/* Form with noValidate to completely remove native browser tooltip popups */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name for Signup */}
            {mode === "signup" && (
              <div className="stake-form-group">
                <label className="stake-label">Legal Full Name</label>
                <div className="stake-input-wrapper">
                  <User size={16} className="stake-input-icon" />
                  <input
                    type="text"
                    className={`stake-input ${touched.name && !isNameValid ? "error" : ""}`}
                    placeholder="e.g. Alex Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur("name")}
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
                  placeholder={mode === "signup" ? "name@domain.com" : "Username or email address"}
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
                    onClick={() => setSuccessMsg("Password reset instructions sent to your registered contact.")}
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

              {/* Password Strength Indicator for Signup */}
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

            {/* Terms and conditions checkbox for Signup */}
            {mode === "signup" && (
              <label className="stake-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to Stake's <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Risk Disclosures</strong>.
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
                <span>Authenticating...</span>
              ) : mode === "signup" ? (
                <>
                  <span>Create Free Account</span>
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
              onClick={() => onLoginSuccess({ email: "google.user@stake.com", name: "Google Trader", accountNumber: "STK-GGL992140", password: "OAuth", mode: "login" })}
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
              onClick={() => onLoginSuccess({ email: "apple.user@stake.com", name: "Apple Trader", accountNumber: "STK-APL884120", password: "OAuth", mode: "login" })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.65-.79 1.1-1.88.98-2.98-.95.04-2.1.63-2.77 1.42-.59.68-1.11 1.79-.97 2.86 1.06.08 2.14-.54 2.76-1.3z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Small Discreet Demo Account Button Below Socials */}
          <div className="stake-demo-btn-container">
            <button
              type="button"
              id="auth-demo-account-btn"
              className="stake-demo-subtle-btn"
              onClick={handleQuickDemoLogin}
              title="Instant login with a pre-funded demo account"
            >
              <Sparkles size={14} />
              <span>Explore with Demo Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
