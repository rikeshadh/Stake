import { useEffect, useRef, useState, useCallback } from "react";
import { fetchYFinanceChart } from "../api";

/**
 * Custom hook to poll the /api/yfinance/chart/:symbol endpoint every 60 seconds
 * if the time range is set to '1d', keeping the view live.
 *
 * @param {Object} options
 * @param {string} options.symbol - Stock symbol (e.g. 'NVDA')
 * @param {string} options.range - Active time horizon (e.g. '1d', '1M', 'ALL')
 * @param {number} [options.intervalMs=60000] - Polling interval in ms (default 60s)
 * @param {boolean} [options.enabled=true] - Whether polling is permitted
 * @param {function} [options.onUpdate] - Callback receiving fresh chart data
 * @returns {{ isPolling: boolean, lastUpdated: number | null, isPollingLoading: boolean, error: string | null, refetch: () => Promise<void> }}
 */
export function usePollYFinanceChart({
  symbol,
  range = "1d",
  intervalMs = 60000,
  enabled = true,
  onUpdate,
}) {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [error, setError] = useState(null);

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const is1d = typeof range === "string" && range.trim().toLowerCase() === "1d";
  const shouldPoll = Boolean(symbol && is1d && enabled);

  const fetchLatest1d = useCallback(async (isInitial = false) => {
    if (!symbol) return;
    try {
      if (isInitial) setIsPollingLoading(true);
      setError(null);

      const res = await fetchYFinanceChart(symbol, "1d", "5m");
      if (res && (res.candles?.length > 0 || res.history?.length > 0)) {
        setLastUpdated(Date.now());
        if (onUpdateRef.current) {
          onUpdateRef.current(res);
        }
      }
    } catch (err) {
      console.warn(`Polling /api/yfinance/chart/${symbol} failed:`, err);
      setError(err?.message || "Failed to poll live intraday chart");
    } finally {
      if (isInitial) setIsPollingLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    // Immediately schedule the 60-second polling interval
    const timerId = setInterval(() => {
      fetchLatest1d(false);
    }, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [shouldPoll, intervalMs, fetchLatest1d]);

  return {
    isPolling: shouldPoll,
    lastUpdated,
    isPollingLoading,
    error,
    refetch: () => fetchLatest1d(true),
  };
}
