# Subsidies — Task Tracker

## Current: Enhanced Donation Experience (Phase 1)

### Pre-Implementation

- [ ] Obtain Squid integrator ID from [Squid Studio](https://studio.squidrouter.com/)
- [ ] Verify COPm token is available on Squid's token list for Celo (check `https://api.squidrouter.com/v1/tokens`)
- [ ] Add `VITE_SQUID_INTEGRATOR_ID` to `.env` and `.env.example`

### Implementation

- [x] Install `@0xsquid/widget` and `canvas-confetti` dependencies
- [x] Build `SwapWidget.tsx` component (Squid integration with error boundary)
- [x] Redesign `UserFundsCard.tsx`:
  - [x] Smart COPm detection (show swap widget if balance is 0)
  - [x] Quick-pick amount buttons (10k, 50k, 100k, 500k)
  - [x] Multi-step progress indicator (Approve → Donate → Done)
  - [x] Post-donation thank-you screen (confetti, share button, tx link)
  - [x] Preserve Divvi referral SDK integration (getReferralTag, dataSuffix, submitReferral)
- [x] Add donation info section (total donated from subgraph, active beneficiary count)
- [x] Add GraphQL query for active beneficiary count
- [x] COPm balance auto-refresh on Squid widget swap completion
- [x] "Dona aquí" button triggers wallet connect for non-connected users (`appKit.open()`)

### Verification

- [ ] Test end-to-end donation flow (approve → addFunds)
- [ ] Test Squid widget swap and balance refresh
- [ ] Test zero-balance vs positive-balance conditional UI
- [ ] Verify Divvi referral tags in transactions
- [ ] Mobile responsiveness
- [ ] Build succeeds (`npm run build`)
- [ ] Commit and PR

---

## Completed: Codebase & Visual Standardization

- [x] Phase 1: Code standardization (naming, imports, exports, formatting)
- [x] Phase 2: Visual standardization (brand purple palette, dark theme, chart colors)
- [x] Phase 3: Semantic token migration (replaced all hardcoded non-brand colors)
- [x] Phase 4: Typography uniformity (text-xs/text-sm/text-lg scale across all components)
- [x] "Lo sentimos" banner toned down (gradient → muted bordered box)
- [x] "Registrate aquí" changed from link variant to solid branded button
- [x] COPm swap button made more visible with brand highlight
- [x] BRANDKIT.md updated with standardized typography scale and wallet connect pattern

---

## Future: Phase 2 — Donor Leaderboard

- [ ] Add `Donor` entity to subgraph schema (totalDonated, donationCount, address, firstDonation)
- [ ] Update `handleFundsAdded` handler to track per-donor contributions
- [ ] Redeploy subgraph
- [ ] Build leaderboard component on frontend (top donors, recent donations)

## Future: Phase 3 — Recurring Donations

- [ ] Research keeper services (Gelato / Chainlink Automation) vs streaming (Superfluid)
- [ ] Design recurring donation contract or module
- [ ] Build frontend for setting up recurring donations (frequency, amount)
- [ ] Deploy and integrate

## Future: Phase 4 — Single-Step Donation (Approach 2)

Build a custom token/chain selector using the Squid SDK instead of the widget.
Chain swap + approve + addFunds into a seamless multi-tx flow.

- [ ] Build custom token/chain selector UI
- [ ] Integrate Squid SDK for programmatic swap quotes
- [ ] Chain swap → approve → addFunds in a single user flow
- [ ] Error handling for cross-chain swap failures

**Trade-off:** Much more frontend work, but full control over UX.

## Future: Phase 5 — One-Click Donation (Approach 3)

Use Squid SDK with a `postHook` to call addFunds automatically after swap.
Requires contract upgrade.

- [ ] Upgrade contract: add `deposit()` function that accepts direct ERC20 transfers (current `addFunds` uses `transferFrom` which won't work from a postHook)
- [ ] Integrate Squid SDK with postHook pointing to `deposit()` on the subsidy contract
- [ ] Handle cross-chain failure scenarios (swap succeeds but hook fails)
- [ ] Update subgraph for new deposit event

**Trade-off:** Most elegant UX (one-click from any chain), but needs contract upgrade + complex cross-chain failure handling.
