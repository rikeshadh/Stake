import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  Receipt
} from "lucide-react";
import { fmt, fmtShares, CURRENCIES } from "../utils";

export function TransactionHistory({
  user,
  darkMode = false,
  onSelectStock,
  onOpenTrade,
  currency = "USD",
}) {
  const [filterType, setFilterType] = useState("ALL"); // ALL, BUY, SELL
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST, OLDEST, VALUE_HIGH, VALUE_LOW

  const transactions = user?.transactions || [];
  const currSymbol = CURRENCIES[currency]?.symbol || "$";

  // Filter and sort transactions
  const safeFilterType = (filterType || "ALL").toUpperCase();
  const filtered = transactions.filter((tx) => {
    const txType = (tx?.type || tx?.side || "").toUpperCase();
    const matchesType =
      safeFilterType === "ALL" ||
      txType === safeFilterType;

    const matchesSearch =
      !searchQuery ||
      (tx.stock || tx.ticker || tx.scrip || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0).getTime();
    const dateB = new Date(b.date || b.timestamp || 0).getTime();
    const valA = (a.shares || a.qty || 0) * (a.price || 0);
    const valB = (b.shares || b.qty || 0) * (b.price || 0);

    if (sortOrder === "NEWEST") return dateB - dateA;
    if (sortOrder === "OLDEST") return dateA - dateB;
    if (sortOrder === "VALUE_HIGH") return valB - valA;
    if (sortOrder === "VALUE_LOW") return valA - valB;
    return 0;
  });

  // Calculate high-level summary metrics
  const totalTrades = transactions.length;
  const buyTrades = transactions.filter((t) => (t.type || t.side || "").toLowerCase() === "buy");
  const sellTrades = transactions.filter((t) => (t.type || t.side || "").toLowerCase() === "sell");

  const totalBuyTurnover = buyTrades.reduce(
    (sum, t) => sum + (t.total || (t.shares || t.qty || 0) * (t.price || 0)),
    0
  );
  const totalSellTurnover = sellTrades.reduce(
    (sum, t) => sum + (t.total || (t.shares || t.qty || 0) * (t.price || 0)),
    0
  );
  const totalSharesTraded = transactions.reduce(
    (sum, t) => sum + (t.shares || t.qty || 0),
    0
  );

  // CSV Export handler
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transaction records to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Timestamp",
      "Symbol",
      "Action",
      "Shares",
      "Execution Price",
      "Gross Total",
      "Brokerage Fee",
      "Status",
    ];

    const rows = transactions.map((t) => [
      t.id || "N/A",
      t.date || t.timestamp || new Date().toISOString(),
      t.stock || t.ticker || t.scrip || "N/A",
      (t.type || t.side || "BUY").toUpperCase(),
      t.shares || t.qty || 0,
      t.price || 0,
      t.total || (t.shares || t.qty || 0) * (t.price || 0),
      (((t.total || (t.shares || t.qty || 0) * (t.price || 0))) * 0.004).toFixed(2),
      "Executed",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Stake_Transactions_${user?.name || "User"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bgCard = darkMode ? "#111827" : "#ffffff";
  const borderCol = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const bgInput = darkMode ? "#1a2236" : "#f8fafc";
  const rowHover = darkMode ? "#1a243b" : "#f8fafc";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ maxWidth: 1200, margin: "0 auto", padding: "0 12px 48px" }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: textPrimary, margin: "0 0 2px" }}>
            Order Logs & History
          </h1>
          <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
            Real-time verified ledger of executed buy and sell orders, settlements, and trade confirmations.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 10,
              border: `1px solid ${borderCol}`,
              background: bgCard,
              color: textPrimary,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <Download size={15} color="#059669" />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Summary KPI Cards with Subtle Motion */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          style={{
            background: bgCard,
            border: `1px solid ${borderCol}`,
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: textSecondary, fontSize: 11.5, fontWeight: 600 }}>
            <span>TOTAL EXECUTIONS</span>
            <History size={15} color="#059669" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {totalTrades} Trades
          </div>
          <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 4, fontWeight: 500 }}>
            {buyTrades.length} Buys • {sellTrades.length} Sells
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          style={{
            background: bgCard,
            border: `1px solid ${borderCol}`,
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: textSecondary, fontSize: 11.5, fontWeight: 600 }}>
            <span>TOTAL BUY TURNOVER</span>
            <TrendingUp size={15} color="#059669" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#059669", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {currSymbol} {fmt(totalBuyTurnover)}
          </div>
          <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 4, fontWeight: 500 }}>
            Capital invested
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          style={{
            background: bgCard,
            border: `1px solid ${borderCol}`,
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: textSecondary, fontSize: 11.5, fontWeight: 600 }}>
            <span>TOTAL SELL TURNOVER</span>
            <TrendingDown size={15} color="#dc2626" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {currSymbol} {fmt(totalSellTurnover)}
          </div>
          <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 4, fontWeight: 500 }}>
            Gross sales proceeds
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          style={{
            background: bgCard,
            border: `1px solid ${borderCol}`,
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: textSecondary, fontSize: 11.5, fontWeight: 600 }}>
            <span>TOTAL SHARES TRADED</span>
            <Layers size={15} color="#0284c7" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: textPrimary, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtShares(totalSharesTraded)} Units
          </div>
          <div style={{ fontSize: 11.5, color: textSecondary, marginTop: 4, fontWeight: 500 }}>
            Settled via Clearinghouse
          </div>
        </motion.div>
      </div>

      {/* Filter and Control Bar */}
      <div
        style={{
          background: bgCard,
          border: `1px solid ${borderCol}`,
          borderRadius: 14,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
          <Search
            size={15}
            color={textSecondary}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by Symbol (e.g. NVDA, AAPL, MSFT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: 8,
              border: `1px solid ${borderCol}`,
              background: bgInput,
              color: textPrimary,
              fontSize: 12.5,
              fontWeight: 500,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>


        {/* Action Type Filter Pills */}
        <div style={{ display: "flex", gap: 4, background: bgInput, padding: 3, borderRadius: 8, border: `1px solid ${borderCol}` }}>
          {[
            { id: "ALL", label: "All Types" },
            { id: "BUY", label: "Buy Only" },
            { id: "SELL", label: "Sell Only" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: filterType === t.id ? 700 : 500,
                cursor: "pointer",
                background: filterType === t.id ? "#059669" : "transparent",
                color: filterType === t.id ? "#ffffff" : textSecondary,
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowUpDown size={13} color={textSecondary} />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${borderCol}`,
              background: bgInput,
              color: textPrimary,
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="NEWEST">Date: Newest First</option>
            <option value="OLDEST">Date: Oldest First</option>
            <option value="VALUE_HIGH">Value: Highest First</option>
            <option value="VALUE_LOW">Value: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div
        style={{
          background: bgCard,
          border: `1px solid ${borderCol}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: `1px solid ${borderCol}`,
                  color: textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <th style={{ padding: "12px 16px" }}>Order ID & Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 800 }}>Symbol</th>
                <th style={{ padding: "12px 16px" }}>Side</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Shares</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Execution Price</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Amount</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 18px", textAlign: "center", color: textSecondary }}>
                    <Receipt size={36} color="#94a3b8" style={{ margin: "0 auto 10px", opacity: 0.6 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>No Transaction Records Found</div>
                    <p style={{ fontSize: 12.5, margin: "4px 0 0", color: textSecondary }}>
                      {searchQuery || filterType !== "ALL"
                        ? "Try adjusting your search query or type filters."
                        : "Execute your first trade in the market to view your verified transaction ledger."}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {sorted.map((tx, idx) => {
                    const isBuy = (tx.type || tx.side || "BUY").toLowerCase() === "buy";
                    const shares = tx.shares || tx.qty || 0;
                    const price = tx.price || 0;
                    const total = tx.total || shares * price;
                    const dateStr = tx.date || tx.timestamp;
                    const formattedDate = dateStr
                      ? new Date(dateStr).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Today, Just now";

                    const orderId = tx.id ? `#${tx.id}` : `#STK-${1000 + idx}`;

                    return (
                      <motion.tr
                        key={tx.id || idx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                        style={{
                          borderBottom: `1px solid ${borderCol}`,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = rowHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600, color: textPrimary, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
                            {orderId}
                          </div>
                          <div style={{ fontSize: 11, color: textSecondary, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Clock size={11} /> {formattedDate}
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <div
                            onClick={() => onSelectStock && onSelectStock(tx.stock || tx.ticker)}
                            style={{
                              fontWeight: 800,
                              color: "#059669",
                              cursor: "pointer",
                              fontSize: 13.5,
                              fontFamily: "'JetBrains Mono', monospace",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {tx.stock || tx.ticker}
                          </div>
                          <div style={{ fontSize: 11, color: textSecondary }}>
                            Global Equities
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 7px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              background: isBuy ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              color: isBuy ? "#059669" : "#dc2626",
                            }}
                          >
                            {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isBuy ? "BUY" : "SELL"}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                          {fmtShares(shares)}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                          {currSymbol} {fmt(price)}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: isBuy ? textPrimary : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                          {currSymbol} {fmt(total)}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 7px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#dcfce7",
                              color: "#059669",
                            }}
                          >
                            <CheckCircle2 size={11} /> Executed
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => onOpenTrade && onOpenTrade(tx.stock || tx.ticker, isBuy ? "BUY" : "SELL")}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: `1px solid ${borderCol}`,
                              background: bgInput,
                              color: textPrimary,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Trade Again
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
