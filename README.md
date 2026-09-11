# Stake

Stake is an AI-assisted equities trading terminal built with React, Vite, and
an Express backend. It provides live market data, portfolio tracking, watchlists,
alerts, order execution, strategy tools, and an AI copilot for market analysis.

> **Disclaimer:** Stake is a software demonstration and is not financial advice.
> Market data may be delayed or simulated, and users should not rely on the
> application for investment decisions.

## Features

- Live stock quotes and market dashboards
- Portfolio, cash, holdings, orders, and transaction history
- Watchlists, price alerts, and stock detail views
- Fractional buy and sell order workflows
- AI Insights with portfolio-aware analysis and tool-assisted actions
- Gemini and NVIDIA-compatible AI providers with local heuristic fallback
- MongoDB persistence with an in-memory fallback for local development
- Netlify Functions deployment support

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Lucide
- **Backend:** Node.js, Express 5, TypeScript via `tsx`
- **Data:** Yahoo Finance, MongoDB/Mongoose
- **AI:** Google Gemini and NVIDIA's OpenAI-compatible API
- **Deployment:** Netlify or any Node-compatible host

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas or another MongoDB instance (optional for local development)
- An AI provider key (optional; heuristic responses work without one)

## Getting started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the repository root when you want to configure the
backend. Never commit this file:

If you are running from a worktree, create `.env` in that worktree itself. The
terminal startup line must say `injected env (1)` or more; `injected env (0)`
means the key was not loaded.

```env
# Optional persistence
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stake

# If your network blocks MongoDB SRV DNS lookups, use Atlas's standard
# mongodb:// connection string instead:
# MONGODB_DIRECT_URI=mongodb://username:password@host1:27017,host2:27017/stake?replicaSet=...

# Optional AI providers
GEMINI_API_KEY=your-gemini-key
NVIDIA_API_KEY=your-nvidia-key

# Optional NVIDIA model override
# NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro-0813

# Optional frontend/backend configuration
# FRONTEND_URL=http://localhost:3000
# PORT=3000
# VITE_HMR_PORT=24679
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI configuration

AI keys are read by the backend and must not use `VITE_` prefixes. Do not put
provider keys in React code or expose them to the browser.

When both providers are configured, Gemini is used first. If Gemini is not
configured, the AI copilot uses NVIDIA through:

```text
https://integrate.api.nvidia.com/v1/chat/completions
```

The default NVIDIA model is `deepseek-ai/deepseek-v4-pro-0813`. Set
`NVIDIA_MODEL` to use another model supported by the NVIDIA API. Trade and alert
commands continue through the server's existing tool and validation path rather
than being executed directly by the model.

Check provider configuration after starting the server:

```bash
curl http://localhost:3000/api/health
```

The response includes `geminiAiEngine` and `nvidiaAiEngine`, each reported as
`ACTIVE` or `INACTIVE`. An inactive provider means its key is missing or does not
pass the basic configuration check; it does not validate billing or model access.

### MongoDB DNS errors

If startup reports `querySrv ECONNREFUSED`, the MongoDB SRV record cannot be
resolved by the current network. Check your DNS/VPN/firewall and Atlas Network
Access settings. Alternatively, copy the **standard connection string** from
Atlas and set it as `MONGODB_DIRECT_URI`; this uses `mongodb://` and bypasses SRV
DNS lookup. The app intentionally continues in in-memory mode when MongoDB is
unavailable so local development can continue.

## Useful commands

```bash
npm run dev       # Start the Vite + Express development server
npm run build     # Build the frontend and bundled backend
npm run start     # Start the production backend bundle
npm run preview   # Preview the production frontend
npm run lint      # Run ESLint
```

## API overview

The backend serves JSON endpoints under `/api`, including:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service, database, market feed, and AI provider status |
| `GET /api/stocks` | Market stock data |
| `POST /api/agent/chat` | AI copilot conversation and guarded actions |
| `GET /api/status` | General backend status |
| `GET /api/database/status` | Database connection status |
| `POST /api/database/connect` | Connect to a MongoDB URI at runtime |

The frontend uses the same origin by default. Set `VITE_API_URL` only when the
backend is hosted separately.

## Deployment

The repository includes `netlify.toml` and a Netlify Function adapter at
`netlify/functions/api.ts`. Configure the following in the Netlify site
environment variables before deploying:

- `NVIDIA_API_KEY` and optionally `NVIDIA_MODEL`
- `GEMINI_API_KEY` if Gemini should take priority
- `MONGODB_URI` for persistent data
- `FRONTEND_URL` for a restricted CORS origin when needed

The Netlify build command is `npm run build`, and the published directory is
`dist`.

## Security notes

- Keep `.env` files and API keys out of source control.
- Store secrets in the deployment provider's environment-variable settings.
- AI-generated content should be treated as untrusted text.
- Validate and authorize order operations on the server.
- Use a restricted CORS origin in production instead of `*`.
- Use a least-privilege MongoDB user and restrict its network access.
