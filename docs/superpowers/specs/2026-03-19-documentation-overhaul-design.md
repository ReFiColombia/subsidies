# Documentation Overhaul Design Spec

**Date:** 2026-03-19
**Status:** Draft
**Audience:** Public (contributors, community, developers)
**Language:** English (app going bilingual EN/ES later)
**Production URL:** https://subsidios.reficolombia.org

---

## 1. Problem Statement

The project documentation is fragmented, outdated, and contains security issues. Specific problems:

- **Root README** (549 lines) references outdated URL `subsidio.refimedellin.org`
- **Backend has 7 separate doc files** that overlap and contradict each other: `README.md`, `QUICK_START.md`, `SUMMARY.md`, `DEPLOYMENT.md`, `PRODUCTION_SETUP.md`, `VERCEL_DEPLOYMENT.md`, `VERCEL_QUICK_START.md`
- **No smart-contracts README** — the most critical package has zero documentation
- **Exposed API keys** in `smart-contracts/foundry.toml` (Celoscan key) and `backend/.env` (Dune key)
- **Incomplete `.env.example` files** — frontend missing `VITE_PROJECT_ID` and `VITE_CONTRACT_ADDRESS`
- **No LICENSE file** in repo root (MIT referenced in headers and package.json)
- **`.gitmodules` typo** — all 4 submodule names use `smart-cotracts` (missing 'n')
- **Contract address inconsistency** — `subgraph/networks.json` points to V1 (`0x947C6dB...`) while `subgraph/subgraph.yaml` points to V2 proxy (`0xAbE493F...`)
- **Misleading comments** — `frontend/src/constants/index.ts` labels an Alfajores testnet address as "Future contract"
- **No CI/CD** — no GitHub Actions or automated pipelines exist

## 2. Approach

**Monorepo-Standard Docs** — one root README as the project entry point, per-package READMEs for each workspace, and a `docs/` folder for cross-cutting references.

## 3. Contract Registry

All deployed contracts, verified from source code and Foundry broadcast files:

| Address | Network | Role | Status |
|---------|---------|------|--------|
| `0x947C6dB1569edc9fd37B017B791cA0F008AB4946` | Celo Mainnet | V1 SubsidyProgram (non-upgradeable) | **Active in frontend** |
| `0xAbE493F082f41B432696F715f84D5471F48cdA2B` | Celo Mainnet | V2 SubsidyProgram (UUPS Proxy) | Deployed, not yet active |
| `0x35108fAa4511BAfe42ABD85F0BAB71f67Cc4AC1d` | Celo Mainnet | V2 SubsidyProgram (Implementation) | Behind proxy |
| `0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf` | Celo Alfajores (44787) | Old test deployment | Testnet only |
| `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Celo Mainnet | cCOP Token (ERC-20) | Active |

### V1 Contract Functions (Active — `0x947C6dB...`)

Non-upgradeable, single-token (cCOP only). Source: `frontend/src/constants/index.ts` ABI.

| Function | Access | Description |
|----------|--------|-------------|
| `addBeneficiary(address)` | Owner | Register a beneficiary |
| `removeBeneficiary(address)` | Owner | Remove a beneficiary |
| `addFunds(uint256)` | Public | Deposit cCOP tokens (single token) |
| `withdrawFunds()` | Owner | Withdraw all cCOP balance |
| `claimSubsidy()` | Beneficiary | Claim weekly cCOP subsidy |
| `setClaimInterval(uint256)` | Owner | Change claim interval |
| `setClaimableAmount(uint256)` | Owner | Change claimable amount per period |
| `isBeneficiary(address)` | View | Check beneficiary status |
| `addressToUser(address)` | View | Get user's lastClaimed and totalClaimed |
| `subsidyClaimInterval()` | View | Current claim interval |
| `subsidyClaimableAmount()` | View | Current claimable amount |
| `token()` | View | Token contract address |
| `owner()` | View | Contract owner |

### V2 Contract Functions (Deployed, not active — `0xAbE493F...`)

UUPS upgradeable, multi-token with Uniswap V3 auto-swap. Source: `smart-contracts/src/SubsidyProgram.sol`.

**New in V2 (not in V1):**

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(address, address, address)` | Initializer | Set token, swap router, and owner |
| `addToken(address)` | Owner | Whitelist a new token for donations |
| `removeToken(address)` | Owner | Remove a whitelisted token |
| `changeTokenPriority(address, uint256)` | Owner | Reorder token in priority array |
| `setTokenFeeTier(address, uint24)` | Owner | Set Uniswap V3 fee tier for token swaps |
| `getWhitelistedTokens()` | View | List all whitelisted token addresses |
| `swapRouter()` | View | Uniswap V3 swap router address |
| `tokenToFeeTier(address)` | View | Fee tier for a given token |

**Changed in V2:**

| Function | V1 Signature | V2 Signature | Change |
|----------|-------------|-------------|--------|
| `addFunds` | `addFunds(uint256)` | `addFunds(uint256, address)` | Now requires specifying which token |
| `withdrawFunds` | `withdrawFunds()` | `withdrawFunds(address)` | Now requires specifying which token |

**V2 Auto-Swap Mechanism:**

When `claimSubsidy()` is called, if the contract lacks sufficient cCOP (token at index 0), it auto-swaps other tokens to cCOP via Uniswap V3:

1. Iterates `tokens[]` array in **reverse order** (highest index first = lowest priority = spent first)
2. For each token, calls internal `_swapTokenToCCop()` which uses `ISwapRouter.exactOutputSingle()` — specifying the exact cCOP amount needed as output
3. If the swap produces enough cCOP, the loop breaks
4. After swaps, requires `cCopBalance >= subsidyClaimableAmount`
5. Token at index 0 (cCOP) is never swapped — it's the target token

**Priority system:** Lower array index = higher priority = preserved longer. The owner controls priority via `changeTokenPriority()`. Each non-cCOP token must have a fee tier set via `setTokenFeeTier()` before it can be swapped.

**Storage pattern:** Uses OpenZeppelin namespaced storage (`SubsidyProgramStorage` struct at a computed slot) for UUPS upgrade safety.

## 4. Root README Design

Replace current 549-line README with a concise project entry point (~150 lines):

```
# Subsidios RefiColombia

One-line description + link to subsidios.reficolombia.org

## What is this?
2-3 sentence explanation of the subsidy program

## Architecture
Monorepo diagram:
  subsidies/
  ├── frontend/       — Vite + React + wagmi (Celo)
  ├── backend/        — Express + Prisma + Dune Analytics
  ├── smart-contracts/ — Foundry (Solidity ^0.8.28)
  └── subgraph/       — The Graph (Celo Mainnet)

## Deployed Contracts
Contract registry table (from Section 3 above)

## Quick Start
Prerequisites + clone + per-package setup links

## Tech Stack
Brief list with versions

## Contributing
Link to CONTRIBUTING.md

## License
MIT — link to LICENSE file
```

## 5. Per-Package READMEs

### 5.1 `smart-contracts/README.md` (NEW — does not exist)

The most important new document. Contents:

- **Overview** — what the contracts do
- **Contract Registry** — full table from Section 3
- **V1 vs V2 Comparison** — side-by-side function table
- **V2 Architecture** — UUPS proxy, namespaced storage, auto-swap mechanism
- **Function Reference** — complete V2 function docs with parameters, access, and descriptions
- **Auto-Swap Deep Dive** — priority system, fee tiers, Uniswap V3 integration
- **Development** — Foundry setup, build, test, deploy commands
- **Deployment** — how to deploy via Foundry scripts, network configs
- **Environment Variables** — what goes in `.env` (RPC URLs, private keys, Celoscan key)

### 5.2 `backend/README.md` (REWRITE — consolidate 7 files into 1)

Delete: `QUICK_START.md`, `SUMMARY.md`, `DEPLOYMENT.md`, `PRODUCTION_SETUP.md`, `VERCEL_DEPLOYMENT.md`, `VERCEL_QUICK_START.md`

Single README contents:

- **Overview** — Express API serving Dune Analytics data + beneficiary management
- **API Endpoints** — `/health`, `/api/dune/stats`, `/api/dune/monthly`, `/api/beneficiaries/*`
- **Local Development** — install, env setup, run
- **Deployment (Vercel)** — consolidated from the 6 deleted files
- **Environment Variables** — `DATABASE_URL`, `PORT`, `DUNE_API_KEY`
- **Database** — Prisma schema, migrations

### 5.3 `frontend/README.md` (REWRITE)

- **Overview** — Vite + React + wagmi/RainbowKit on Celo
- **Key Components** — ProgramStats (Dune integration), SwapWidget (Squid), UserFundsCard
- **Local Development** — install, env setup, run
- **Deployment (Vercel)** — note about `VITE_*` vars baked at build time
- **Environment Variables** — complete list with descriptions
- **Divvi Integration** — consumer address and registration

### 5.4 `subgraph/README.md` (REWRITE)

- **Overview** — The Graph subgraph indexing contract events on Celo
- **Entities** — Beneficiary, Funds, TokenBalance, DailyClaim
- **Contract Address Note** — document the `networks.json` vs `subgraph.yaml` discrepancy and resolution
- **Development** — codegen, build, deploy commands
- **Grafting** — explain current grafting configuration

## 6. Cleanup & Housekeeping

### 6.1 Security Fixes

| Issue | File | Action |
|-------|------|--------|
| Exposed Celoscan API key | `smart-contracts/foundry.toml` | Replace with `${CELOSCAN_API_KEY}` env var reference |
| Exposed Dune API key | `backend/.env` | Ensure `.env` is in `.gitignore` (already is), but key is in git history |

### 6.2 `.env.example` Completion

**`frontend/.env.example`** — add missing variables:
```
VITE_PROJECT_ID=
VITE_CONTRACT_ADDRESS=
VITE_API_URL=http://localhost:3001
VITE_SQUID_INTEGRATOR_ID=squid-swap-widget
```

**`backend/.env.example`** — already complete (3 vars).

**`smart-contracts/.env.example`** — create new:
```
PRIVATE_KEY=
CELO_RPC_URL=https://forno.celo.org
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
CELOSCAN_API_KEY=
```

### 6.3 Label Fixes

**`frontend/src/constants/index.ts`** — change misleading comment:
```typescript
// Before:
// Future contract: 0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf (deployed, not yet active)

// After:
// Alfajores testnet deployment: 0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf (chain 44787, test only)
```

### 6.4 `.gitmodules` Typo Fix

All 4 submodule name entries use `smart-cotracts` (missing 'n'). Fix all to `smart-contracts`:
- `[submodule "smart-cotracts/lib/v3-core"]` → `[submodule "smart-contracts/lib/v3-core"]`
- `[submodule "smart-cotracts/lib/v2-core"]` → `[submodule "smart-contracts/lib/v2-core"]`
- `[submodule "smart-cotracts/lib/v3-periphery"]` → `[submodule "smart-contracts/lib/v3-periphery"]`
- `[submodule "smart-cotracts/lib/openzeppelin-contracts-upgradeable"]` → `[submodule "smart-contracts/lib/openzeppelin-contracts-upgradeable"]`

### 6.5 Subgraph Address Inconsistency

`subgraph/networks.json` points to V1 (`0x947C6dB...`, start block 29277553) while `subgraph/subgraph.yaml` points to V2 proxy (`0xAbE493F...`, start block 51341193). Document this discrepancy and resolve — likely `networks.json` is stale and should be updated to V2, or both should be documented with context.

### 6.6 Root README URL Fix

Replace `https://subsidio.refimedellin.org` with `https://subsidios.reficolombia.org` on line 481.

### 6.7 MIT LICENSE File

Create `LICENSE` file in repo root with the standard MIT License text, copyright holder: RefiColombia.

### 6.8 `CONTRIBUTING.md`

Create a top-level `CONTRIBUTING.md` with:
- How to set up the development environment
- Branch naming conventions
- PR process
- Code style (Biome for frontend/backend, Foundry fmt for contracts)

## 7. Future Improvements (Out of Scope)

These are documented for awareness but **not part of this overhaul**:

- **CI/CD Pipeline** — No GitHub Actions currently exist. Worth adding: lint/format checks, contract compilation, frontend build verification, test runs on PR. This is a significant addition that deserves its own design cycle.
- **Bilingual documentation** — App will support EN/ES. Docs are English-first for now; i18n of docs can follow the app's language work.
- **Git history cleanup** — Exposed API keys exist in git history. Consider rotating keys and/or using `git filter-branch` or BFG Repo Cleaner if the repo is ever made fully public.

## 8. File Inventory

### Files to CREATE
| File | Description |
|------|-------------|
| `LICENSE` | MIT license, copyright RefiColombia |
| `CONTRIBUTING.md` | Contributor guide |
| `smart-contracts/README.md` | Full contract documentation |
| `smart-contracts/.env.example` | Environment variable template |

### Files to REWRITE
| File | Description |
|------|-------------|
| `README.md` (root) | Concise project entry point |
| `backend/README.md` | Consolidated from 7 files |
| `frontend/README.md` | Updated with complete env vars and components |
| `subgraph/README.md` | Updated with entities and address notes |

### Files to DELETE
| File | Reason |
|------|--------|
| `backend/QUICK_START.md` | Consolidated into backend/README.md |
| `backend/SUMMARY.md` | Consolidated into backend/README.md |
| `backend/DEPLOYMENT.md` | Consolidated into backend/README.md |
| `backend/PRODUCTION_SETUP.md` | Consolidated into backend/README.md |
| `backend/VERCEL_DEPLOYMENT.md` | Consolidated into backend/README.md |
| `backend/VERCEL_QUICK_START.md` | Consolidated into backend/README.md |

### Files to EDIT (small fixes)
| File | Change |
|------|--------|
| `frontend/src/constants/index.ts` | Fix "Future contract" comment → "Alfajores testnet" |
| `frontend/.env.example` | Add missing `VITE_PROJECT_ID` and `VITE_CONTRACT_ADDRESS` |
| `smart-contracts/foundry.toml` | Replace hardcoded Celoscan key with env var |
| `.gitmodules` | Fix `smart-cotracts` → `smart-contracts` (4 occurrences) |
| `subgraph/networks.json` | Update or document V1 vs V2 address discrepancy |

---

**Total scope:** 4 files created, 4 files rewritten, 6 files deleted, 5 files edited.
