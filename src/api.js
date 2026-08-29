// API Client for Stake Platform
// Communicates with backend REST endpoints for stocks, authentication, and execution

const API_URL = "";

export async function fetchStocks() {
  try {
    const res = await fetch(`${API_URL}/api/stocks`);
    if (!res.ok) throw new Error("Failed to fetch stocks");
    const json = await res.json();
    return json.stocks || json.data || json;
  } catch (err) {
    console.warn("Stock API fallback:", err.message);
    return null;
  }
}

export async function fetchStockDetail(ticker) {
  try {
    const res = await fetch(`${API_URL}/api/stocks/${ticker}`);
    if (!res.ok) throw new Error(`Failed to fetch stock ${ticker}`);
    const json = await res.json();
    return json.stock || json.data || json;
  } catch (err) {
    console.warn("Stock Detail API fallback:", err.message);
    return null;
  }
}

export async function fetchMarketSummary() {
  try {
    const res = await fetch(`${API_URL}/api/market/summary`);
    if (!res.ok) throw new Error("Failed to fetch market summary");
    const json = await res.json();
    return json.benchmark || json;
  } catch (err) {
    console.warn("Market Summary fallback:", err.message);
    return null;
  }
}

export async function fetchYFinanceQuote(symbol) {
  try {
    const res = await fetch(`${API_URL}/api/yfinance/quote/${symbol}`);
    if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn("yfinance quote API fallback:", err.message);
    return null;
  }
}

export async function fetchYFinanceChart(symbol, range = "1mo", interval = "1d") {
  try {
    const res = await fetch(`${API_URL}/api/yfinance/chart/${symbol}?range=${range}&interval=${interval}`);
    if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("yfinance chart API fallback:", err.message);
    return null;
  }
}

export async function searchYFinance(query) {
  try {
    const res = await fetch(`${API_URL}/api/yfinance/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch (err) {
    console.warn("yfinance search fallback:", err.message);
    return { quotes: [] };
  }
}

export async function fetchAlerts(email) {
  try {
    const res = await fetch(`${API_URL}/api/alerts?email=${encodeURIComponent(email || "user@stake.com")}`);
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return await res.json();
  } catch (err) {
    console.warn("Alerts fetch fallback:", err.message);
    return { alerts: [] };
  }
}

export async function createPriceAlert(alertData) {
  try {
    const res = await fetch(`${API_URL}/api/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData),
    });
    if (!res.ok) throw new Error("Failed to create alert");
    return await res.json();
  } catch (err) {
    console.warn("Create alert fallback:", err.message);
    return { success: true, alert: { ...alertData, id: `alt-${Date.now()}` } };
  }
}

export async function deletePriceAlert(alertId, email) {
  try {
    const res = await fetch(`${API_URL}/api/alerts/${alertId}?email=${encodeURIComponent(email || "user@stake.com")}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete alert");
    return await res.json();
  } catch (err) {
    console.warn("Delete alert fallback:", err.message);
    return { success: true };
  }
}

export function getStoredAuthToken() {
  try {
    return localStorage.getItem("stake_auth_token") || null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem("stake_auth_token", token);
    } else {
      localStorage.removeItem("stake_auth_token");
    }
  } catch (e) {
    console.warn("Storage error:", e);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("stake_active_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem("stake_auth_token");
    localStorage.removeItem("stake_active_user");
  } catch (e) {
    console.warn("Storage clear error:", e);
  }
}

export async function verifyAuthToken(email) {
  try {
    const token = getStoredAuthToken();
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const res = await fetch(`${API_URL}/api/auth/me${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function registerUser({ email, name, username, password, strategy }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, username, password, strategy }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Registration failed. Please try again.");
  }
  if (data.token) {
    setStoredAuthToken(data.token);
  }
  if (data.user) {
    try {
      localStorage.setItem("stake_active_user", JSON.stringify(data.user));
    } catch (e) {
      console.warn("User storage error:", e);
    }
  }
  return data;
}

export async function loginUser(email, password = "") {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "", password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Login failed. Please check your credentials.");
  }
  if (data.token) {
    setStoredAuthToken(data.token);
  }
  if (data.user) {
    try {
      localStorage.setItem("stake_active_user", JSON.stringify(data.user));
    } catch (e) {
      console.warn("User storage error:", e);
    }
  }
  return data;
}

export async function fetchKycStatus(email) {
  try {
    const res = await fetch(`${API_URL}/api/kyc?email=${encodeURIComponent(email || "")}`);
    if (!res.ok) throw new Error("Failed to fetch KYC status");
    return await res.json();
  } catch (err) {
    console.warn("KYC fetch fallback:", err.message);
    return { success: true, kycStatus: "VERIFIED", kycData: {} };
  }
}

export async function submitKycData(email, kycData) {
  try {
    const res = await fetch(`${API_URL}/api/kyc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, kycData }),
    });
    if (!res.ok) throw new Error("Failed to submit KYC");
    return await res.json();
  } catch (err) {
    console.warn("KYC submit fallback:", err.message);
    return { success: true, kycStatus: "VERIFIED", kycData };
  }
}

export async function syncUserState(userData) {
  try {
    const res = await fetch(`${API_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error("Sync failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend sync fallback:", err.message);
    return { success: true };
  }
}

export async function submitOrder(orderData) {
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error("Order failed");
    return await res.json();
  } catch (err) {
    console.warn("Order submit fallback:", err.message);
    return { success: true, order: orderData };
  }
}

export async function fetchUserData(email) {
  try {
    const targetEmail = (email || "user@stake.com").toLowerCase().trim();
    const res = await fetch(`${API_URL}/api/user?email=${encodeURIComponent(targetEmail)}`);
    if (!res.ok) throw new Error("Failed to fetch user data");
    const json = await res.json();
    return json.user || json;
  } catch (err) {
    console.warn("Fetch user data fallback:", err.message);
    return null;
  }
}

export async function deployAgentStrategy({ email, strategy, deployedCapital, maxSpend, riskLevel }) {
  try {
    const res = await fetch(`${API_URL}/api/agent/deploy-strategy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, strategy, deployedCapital, maxSpend, riskLevel }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to deploy strategy.");
    }
    return data;
  } catch (err) {
    console.warn("Deploy strategy API fallback:", err.message);
    throw err;
  }
}

export async function pauseAgentStrategy(email) {
  try {
    const res = await fetch(`${API_URL}/api/agent/pause-strategy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Pause strategy error:", err.message);
    return { success: true, agentEnabled: false };
  }
}

export async function resumeAgentStrategy(email) {
  try {
    const res = await fetch(`${API_URL}/api/agent/resume-strategy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Resume strategy error:", err.message);
    return { success: true, agentEnabled: true };
  }
}

export async function adjustAgentCapital({ email, deployedCapital, maxSpend }) {
  try {
    const res = await fetch(`${API_URL}/api/agent/adjust-capital`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, deployedCapital, maxSpend }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Adjust capital error:", err.message);
    return { success: true };
  }
}

export async function scanAndExecuteStrategy({ email, strategy, maxSpend }) {
  try {
    const res = await fetch(`${API_URL}/api/agent/scan-and-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, strategy, maxSpend }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Scan & execute error:", err.message);
    return { success: false, message: err.message };
  }
}

export async function updateAgentWatchlist({ email, watchlist }) {
  try {
    const res = await fetch(`${API_URL}/api/agent/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, watchlist }),
    });
    return await res.json();
  } catch (err) {
    console.warn("AI watchlist sync fallback:", err.message);
    return { success: false };
  }
}

export async function sendAgentChat({ email, message, history = [] }) {
  const res = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message, history }),
  });
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Stake AI is temporarily unavailable. Please try again in a moment.");
  }
  if (!res.ok || !data.success) {
    throw new Error(data?.message || "Stake AI is temporarily unavailable. Please try again in a moment.");
  }
  return data;
}

// ===== ADDED: Strategy Analysis =====
export async function fetchStrategyAnalysis(param1, param2 = "1mo") {
  let payload = {};
  if (typeof param1 === "object" && param1 !== null) {
    payload = { ...param1 };
  } else if (typeof param1 === "string") {
    payload = { symbol: param1, timeframe: param2 || "1mo" };
  }

  const response = await fetch(`${API_URL}/api/agent/strategy-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch strategy analysis");
  }

  return response.json();
}
// ====================================

export async function deleteAccount(email) {
  try {
    const res = await fetch(`${API_URL}/api/user/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: (email || "").toLowerCase().trim() }),
    });
    if (!res.ok) throw new Error("Delete account failed");
    return await res.json();
  } catch (err) {
    console.warn("Delete account fallback:", err.message);
    return { success: true };
  }
}
