# Frontend

Vite + React application for the Subsidios RefiColombia platform. Connects to the Celo blockchain via wagmi/Reown (WalletConnect) and displays program statistics from Dune Analytics.

Live: [subsidios.reficolombia.org](https://subsidios.reficolombia.org)

## Quick Start

```bash
npm install
cp .env.example .env    # fill in VITE_PROJECT_ID
npm run dev             # http://localhost:5173
```

## Key Components

- **ProgramStats** — Displays on-chain program stats (funds added/distributed, beneficiaries, balance) fetched from the backend's Dune Analytics endpoints. Includes a monthly distribution bar chart.
- **SwapWidget** — Squid Router cross-chain swap widget, pre-configured to output cCOP on Celo. Wrapped in an error boundary with a fallback UI.
- **UserFundsCard** — Main user interface for beneficiaries to view their status and claim subsidies.

## Environment Variables

| Variable          | Required | Description                                       |
|-------------------|----------|---------------------------------------------------|
| `VITE_PROJECT_ID` | Yes      | Reown (WalletConnect) project ID                  |
| `VITE_API_URL`    | No       | Backend API URL (default: `http://localhost:3001`) |

**Important:** `VITE_*` variables are baked into the bundle at build time. Changing them in Vercel requires a redeploy to take effect.

## Deployment (Vercel)

The frontend is deployed on Vercel with SPA routing configured in `vercel.json`.

- Set all `VITE_*` environment variables in the Vercel dashboard
- The `x-vercel-disable-toolbar` header is set to prevent CSP conflicts with the Squid widget's SES lockdown

## Divvi Integration

The app registers with [Divvi Protocol](https://divvi.xyz) using consumer address `0x302E2A0D4291ac14Aa1160504cA45A0A1F2E7a5c`.

## Tech Stack

- **Build:** Vite + React (Babel)
- **UI:** React 18, TailwindCSS, shadcn/ui, Lucide icons, Recharts
- **Web3:** wagmi, viem, Reown AppKit (WalletConnect)
- **Swap:** Squid Router widget (`@0xsquid/widget`)
- **Data:** TanStack React Query
- **Linting:** ESLint + Prettier
