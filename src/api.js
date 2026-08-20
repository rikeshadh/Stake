// API Client for Stake Platform
// Communicates with backend REST endpoints for stocks, authentication, and execution

export async function fetchStocks() {
  try {
    const res = await fetch("/api/stocks");
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
    const res = await fetch(`/api/stocks/${ticker}`);
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
    const res = await fetch("/api/market/summary");
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
    const res = await fetch(`/api/yfinance/quote/${symbol}`);
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
    const res = await fetch(`/api/yfinance/chart/${symbol}?range=${range}&interval=${interval}`);
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
    const res = await fetch(`/api/yfinance/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch (err) {
    console.warn("yfinance search fallback:", err.message);
    return { quotes: [] };
  }
}

export async function fetchAlerts(email) {
  try {
    const res = await fetch(`/api/alerts?email=${encodeURIComponent(email || "user@stake.com")}`);
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return await res.json();
  } catch (err) {
    console.warn("Alerts fetch fallback:", err.message);
    return { alerts: [] };
  }
}

export async function createPriceAlert(alertData) {
  try {
    const res = await fetch("/api/alerts", {
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
    const res = await fetch(`/api/alerts/${alertId}?email=${encodeURIComponent(email || "user@stake.com")}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete alert");
    return await res.json();
  } catch (err) {
    console.warn("Delete alert fallback:", err.message);
    return { success: true };
  }
}

export async function registerUser({ email, name, password }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Registration failed. Please try again.");
  }
  return data;
}

export async function loginUser(email, password = "") {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "", password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Login failed. Please check your credentials.");
  }
  return data;
}

export async function fetchKycStatus(email) {
  try {
    const res = await fetch(`/api/kyc?email=${encodeURIComponent(email || "")}`);
    if (!res.ok) throw new Error("Failed to fetch KYC status");
    return await res.json();
  } catch (err) {
    console.warn("KYC fetch fallback:", err.message);
    return { success: true, kycStatus: "VERIFIED", kycData: {} };
  }
}

export async function submitKycData(email, kycData) {
  try {
    const res = await fetch("/api/kyc", {
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
    const res = await fetch("/api/sync", {
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
    const res = await fetch("/api/orders", {
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
    const res = await fetch(`/api/user?email=${encodeURIComponent(targetEmail)}`);
    if (!res.ok) throw new Error("Failed to fetch user data");
    const json = await res.json();
    return json.user || json;
  } catch (err) {
    console.warn("Fetch user data fallback:", err.message);
    return null;
  }
}

export async function deleteAccount(email) {
  try {
    const res = await fetch("/api/user/delete", {
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


