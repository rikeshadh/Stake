export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar ($)", rate: 1.0 },
  EUR: { code: "EUR", symbol: "€", name: "Euro (€)", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound (£)", rate: 0.79 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar (A$)", rate: 1.52 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar (C$)", rate: 1.36 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen (¥)", rate: 155.0 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee (₹)", rate: 83.5 },
  NPR: { code: "NPR", symbol: "Rs", name: "Nepalese Rupee (Rs)", rate: 133.5 },
};

export function formatMoney(amount, currencyCode = "USD", d = 2) {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const num = Number(amount);
  if (isNaN(num)) return `${curr.symbol} 0.00`;
  const converted = num * (curr.rate || 1.0);
  return `${curr.symbol} ${converted.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })}`;
}

export function formatStockPrice(priceInUSD, currencyCode = "USD", d = 2) {
  return formatMoney(priceInUSD, currencyCode, d);
}

export function convertPrice(priceInUSD, currencyCode = "USD") {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const num = Number(priceInUSD) || 0;
  return num * (curr.rate || 1.0);
}

export function getCurrencySymbol(currencyCode = "USD") {
  return (CURRENCIES[currencyCode] || CURRENCIES.USD).symbol;
}

export function fmt(n, d = 2) {
  const val = Number(n);
  if (isNaN(val)) return "0.00";
  return val.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtShares(n) {
  const val = Number(n);
  if (!val || isNaN(val) || val === 0) return "0";
  return val.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function initials(name) {
  if (!name || typeof name !== "string") return "ST";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Generates an organic, ultra-smooth cubic Bezier SVG path from an array of [x, y] points.
 * Uses tension-controlled Catmull-Rom to Bezier conversion for fluid market curves.
 * Sanitizes all coordinate values to guarantee valid SVG path rendering.
 */
export function getSmoothSvgPath(pts, tension = 0.25) {
  if (!pts || !Array.isArray(pts) || pts.length === 0) return "";
  
  // Filter and sanitize points to ensure valid numbers
  const validPts = pts
    .filter((p) => Array.isArray(p) && p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]) && isFinite(p[0]) && isFinite(p[1]))
    .map(([x, y]) => [Number(x), Number(y)]);

  if (validPts.length === 0) return "";
  if (validPts.length === 1) return `M ${validPts[0][0].toFixed(2)},${validPts[0][1].toFixed(2)}`;
  if (validPts.length === 2) {
    return `M ${validPts[0][0].toFixed(2)},${validPts[0][1].toFixed(2)} L ${validPts[1][0].toFixed(2)},${validPts[1][1].toFixed(2)}`;
  }

  let path = `M ${validPts[0][0].toFixed(2)},${validPts[0][1].toFixed(2)}`;

  for (let i = 0; i < validPts.length - 1; i++) {
    const pPrev = i > 0 ? validPts[i - 1] : validPts[i];
    const pCur = validPts[i];
    const pNext = validPts[i + 1];
    const pNextNext = i < validPts.length - 2 ? validPts[i + 2] : pNext;

    // Calculate smooth tangents
    const cp1x = pCur[0] + (pNext[0] - pPrev[0]) * tension;
    const cp1y = pCur[1] + (pNext[1] - pPrev[1]) * tension;

    const cp2x = pNext[0] - (pNextNext[0] - pCur[0]) * tension;
    const cp2y = pNext[1] - (pNextNext[1] - pCur[1]) * tension;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${pNext[0].toFixed(2)},${pNext[1].toFixed(2)}`;
  }

  return path;
}

