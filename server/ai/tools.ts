import { Type, FunctionDeclaration } from "@google/genai";

// Function Declarations for Gemini Function Calling
export const getPortfolioTool: FunctionDeclaration = {
  name: "get_portfolio",
  description: "Get the current user's complete portfolio: cash balance, holdings, total portfolio value, unrealized P&L, and asset allocation breakdown.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

export const getStockPriceTool: FunctionDeclaration = {
  name: "get_stock_price",
  description: "Fetch live real-time price, day change %, high/low, volume, P/E ratio, and market cap for a specific stock ticker.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The stock ticker symbol (e.g. 'NVDA', 'AAPL', 'TSLA', 'COIN', 'MSFT').",
      },
    },
    required: ["symbol"],
  },
};

export const getPriceHistoryTool: FunctionDeclaration = {
  name: "get_price_history",
  description: "Get historical price candlestick chart data, trend analysis, and recent performance for a given stock symbol.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The stock ticker symbol (e.g. 'NVDA', 'TSLA').",
      },
      range: {
        type: Type.STRING,
        description: "Time range: '1d', '5d', '1mo', '6mo', or '1y'. Defaults to '1mo'.",
      },
    },
    required: ["symbol"],
  },
};

export const placeOrderTool: FunctionDeclaration = {
  name: "place_order",
  description: "Execute a live BUY or SELL order for fractional or whole equities within user collateral balances.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ticker: {
        type: Type.STRING,
        description: "The stock ticker to trade (e.g. 'NVDA', 'AAPL', 'TSLA').",
      },
      side: {
        type: Type.STRING,
        description: "Order side: 'BUY' or 'SELL'.",
      },
      shares: {
        type: Type.NUMBER,
        description: "The number of shares (can be fractional like 0.5, 2.5, 10).",
      },
      orderType: {
        type: Type.STRING,
        description: "Order type: 'MKT' (market) or 'LMT' (limit). Defaults to 'MKT'.",
      },
      price: {
        type: Type.NUMBER,
        description: "Optional limit price. If omitted, current market price is used.",
      },
    },
    required: ["ticker", "side", "shares"],
  },
};

export const setAlertTool: FunctionDeclaration = {
  name: "set_alert",
  description: "Create an autonomous price target alert for a stock.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ticker: {
        type: Type.STRING,
        description: "The stock ticker symbol (e.g. 'NVDA').",
      },
      targetPrice: {
        type: Type.NUMBER,
        description: "The target price trigger in USD.",
      },
      condition: {
        type: Type.STRING,
        description: "'ABOVE' if alerting when price rises to target, 'BELOW' if alerting on dip.",
      },
      note: {
        type: Type.STRING,
        description: "Short descriptive note or reason for the alert.",
      },
    },
    required: ["ticker", "targetPrice"],
  },
};

export const analyzeHoldingTool: FunctionDeclaration = {
  name: "analyze_holding",
  description: "Conduct quantitative and risk analysis on a portfolio asset or candidate stock (volatility, beta, drawdown, diversification score, recommendation).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The stock ticker to analyze.",
      },
    },
    required: ["symbol"],
  },
};

export const allAgentTools: FunctionDeclaration[] = [
  getPortfolioTool,
  getStockPriceTool,
  getPriceHistoryTool,
  placeOrderTool,
  setAlertTool,
  analyzeHoldingTool,
];
