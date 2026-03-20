# Enhanced Donation Experience — Design Spec

**Date:** 2026-03-19
**Branch:** `development`
**Status:** In Review

---

## Problem

The current donation flow only supports COPm (cCOP) on Celo. Users who hold tokens on other chains or in other denominations cannot donate without manually bridging and swapping first. The donation UX is also minimal — a plain input field with no guidance, no feedback, and no impact visibility.

## Solution: Approach 1 — Squid Widget + Existing Donate Flow

Embed the Squid cross-chain swap widget so users can convert any token on any supported chain to COPm on Celo, then donate using the existing `addFunds` contract call. No smart contract changes required.

---

## Contract Clarification

Two contract addresses exist in the codebase:
- **`0x947C6dB1569edc9fd37B017B791cA0F008AB4946`** — the deployed contract used by the frontend. Uses `addFunds(uint256)` (single param, COPm only). This is the **canonical donation target**.
- **`0xAbE493F082f41B432696F715f84D5471F48cdA2B`** — referenced in the subgraph. This is a newer proxy deployment with multi-token support (`addFunds(uint256, address)`), but is **not used by the frontend**.

This spec targets `0x947C...` with `addFunds(uint256)`. No contract changes needed.

---

## Architecture

```
User (any token, any chain)
        │
        ▼
┌─────────────────────────┐
│  Squid Widget            │  Embedded in donation section
│  Cross-chain swap        │  Destination locked: Celo + COPm
│  Any token → COPm        │  COPm arrives in user's wallet
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  Donation Flow           │  Redesigned UserFundsCard
│  approve → addFunds      │  Quick-pick amounts, progress
│  + Divvi referral tag    │  Preserved from existing flow
└─────────────────────────┘
        │
        ▼
   Subsidy Contract (0x947C...4946)
   Receives COPm via addFunds(uint256)
```

---

## UX Flow

### Step 1: COPm Detection
- On wallet connect, read user's COPm balance via `useReadContract` (erc20Abi, balanceOf)
- **If balance === 0:** Show Squid widget prominently with heading "Get COPm to donate"
- **If balance > 0:** Show donate form directly; Squid widget available as collapsible "Need more COPm?" section

### Step 2: Swap (if needed)
- Squid widget handles the entire cross-chain swap
- Destination locked to:
  - Chain: Celo (42220)
  - Token: COPm (`0x8A567e2aE79CA692Bd748aB832081C45de4041eA`)
- Source: fully open (any chain, any token)
- **Balance refresh:** The Squid widget emits an `onTransactionComplete` callback. On this event, call `refetch()` on the COPm balance `useReadContract` hook to update the UI.
- **Fallback:** If the widget fails to load (API down, network error), show a text fallback: "Get COPm on [Uniswap](https://app.uniswap.org) or [Squid](https://app.squidrouter.com)" with direct links.

### Step 3: Donate
- User sees their COPm balance
- Quick-pick amount buttons: 10,000 / 50,000 / 100,000 / 500,000 COPm
- Custom amount input available
- Multi-step progress indicator:
  1. Approve (if allowance < amount)
  2. Donate (addFunds call with Divvi referral dataSuffix)
  3. Done (confirmation)

### Step 4: Thank You / Receipt
- Post-donation success screen:
  - Amount donated (formatted as Colombian peso)
  - Celoscan transaction link
  - "Share your donation" button → opens Twitter/X with pre-filled text
  - Confetti animation (use `canvas-confetti` library — lightweight, no framer-motion dependency needed for this)

---

## Divvi Referral SDK Integration (MUST PRESERVE)

The existing donation flow integrates with `@divvi/referral-sdk`. This MUST be preserved:

1. **Before addFunds:** Call `getReferralTag({ user: address, consumer: DIVVI_CONSUMER_ADDRESS })` to generate referral tag
2. **On addFunds:** Append tag as `dataSuffix: \`0x\${referralTag}\`` on the writeContract call
3. **After success:** Call `submitReferral({ txHash, chainId: 42220 })` for attribution

No changes to this flow — just ensure the redesigned component preserves it exactly.

---

## Donation Info Section

Display program-level stats:
- **Total donated:** Query `Funds.totalSupplied` from the subgraph (already indexed)
- **Beneficiaries served:** Query active beneficiaries from the subgraph:

```graphql
query ActiveBeneficiaryCount {
  beneficiaries(where: { isActive: true }) {
    id
  }
}
```

Count the returned array length client-side. No subgraph changes needed — the `isActive` field already exists on the `Beneficiary` entity.

---

## Components

### New: `SwapWidget.tsx`
Wraps `@0xsquid/widget` SquidWidget component with config:

```tsx
import { SquidWidget } from "@0xsquid/widget";

const SQUID_INTEGRATOR_ID = import.meta.env.VITE_SQUID_INTEGRATOR_ID;

interface SwapWidgetProps {
  onTransactionComplete?: () => void;
}

function SwapWidget({ onTransactionComplete }: SwapWidgetProps) {
  return (
    <SquidWidget
      config={{
        integratorId: SQUID_INTEGRATOR_ID,
        apiUrl: "https://apiplus.squidrouter.com",
        initialAssets: {
          to: {
            address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",  // COPm
            chainId: "42220",  // Celo
          },
        },
        availableChains: {
          destination: ["42220"],
        },
        availableTokens: {
          destination: {
            "42220": ["0x8A567e2aE79CA692Bd748aB832081C45de4041eA"],
          },
        },
        themeType: "dark",
      }}
    />
  );
}
```

**Error boundary:** Wrap SwapWidget in a React error boundary. If it fails to render, show the text fallback with direct links to Uniswap/Squid web app.

### Redesigned: `UserFundsCard.tsx`
Complete rewrite with:
- Conditional swap widget display (based on COPm balance)
- Quick-pick amount buttons
- Step progress indicator
- Post-donation receipt/share screen (with confetti)
- Donation info stats (total donated, active beneficiaries)
- **Preserved:** Divvi referral SDK integration (getReferralTag, dataSuffix, submitReferral)
- **Preserved:** Toast notifications for approve/donate/error states

### Updated: `frontend/.env`
- Add `VITE_SQUID_INTEGRATOR_ID=<your-id>` (not committed to git — add to `.env.example`)

### Updated: `package.json`
- Add `@0xsquid/widget` dependency
- Add `canvas-confetti` + `@types/canvas-confetti` for thank-you animation

---

## What Does NOT Change

- **Smart contract** — deployed at `0x947C6dB1569edc9fd37B017B791cA0F008AB4946`, single-token COPm, `addFunds(uint256)`
- **Backend API** — no changes
- **Subgraph** — already indexes `Funds.totalSupplied` and `Beneficiary.isActive`, no changes needed
- **Admin page** — no changes

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@0xsquid/widget` | Cross-chain swap widget |
| `canvas-confetti` | Lightweight confetti animation for thank-you screen |

Existing deps already cover:
- `wagmi` / `viem` — contract interaction
- `@divvi/referral-sdk` — referral attribution
- Subgraph client — already configured

---

## Squid Integrator ID

Required for the widget. Obtain free from:
- [Squid Studio](https://studio.squidrouter.com/) — also used to customize widget theme
- Or via [Squid integrator form](https://squidrouter.typeform.com/integrator-id)

**Pre-implementation blocker:** Verify that COPm (`0x8A567e2aE79CA692Bd748aB832081C45de4041eA`) is available on Squid's token list for Celo chain. Check via: `https://api.squidrouter.com/v1/tokens` (filter by chainId 42220).

---

## Testing Plan

- [ ] Verify COPm is available on Squid's token list for Celo
- [ ] Verify Squid widget renders with correct destination lock (Celo + COPm)
- [ ] Test swap from ETH mainnet USDC → COPm on Celo
- [ ] Verify COPm balance refreshes after swap completes
- [ ] Test zero-balance flow (widget shown prominently)
- [ ] Test positive-balance flow (widget collapsed)
- [ ] Test quick-pick amounts (10k, 50k, 100k, 500k)
- [ ] Test custom amount input
- [ ] Test approve → addFunds flow end-to-end
- [ ] Verify Divvi referral tag is appended to addFunds tx
- [ ] Verify submitReferral is called after successful donation
- [ ] Verify thank-you screen renders with correct tx hash + confetti
- [ ] Test share button generates correct Twitter/X link
- [ ] Verify donation info stats match subgraph data
- [ ] Test Squid widget error fallback (disable network to simulate)
- [ ] Mobile responsiveness (widget + donate form)
- [ ] Verify build succeeds (`npm run build`)
