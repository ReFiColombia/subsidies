# Subsidies Project - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Smart Contracts](#smart-contracts)
4. [Frontend Application](#frontend-application)
5. [Subgraph (The Graph)](#subgraph-the-graph)
6. [How It Works](#how-it-works)
7. [Key Features](#key-features)
8. [Project Structure](#project-structure)
9. [Setup Instructions](#setup-instructions)
10. [Deployment Information](#deployment-information)
11. [Technology Stack](#technology-stack)

---

## Project Overview

This is a **Subsidy Program** built on the **Celo blockchain** that enables eligible beneficiaries to claim periodic subsidies in cCOP (Celo Colombian Peso). The project consists of four main components:

1. **Smart Contracts** - Solidity contracts managing the subsidy program logic
2. **Frontend** - React/TypeScript web application for users and administrators
3. **Subgraph** - The Graph protocol integration for indexing and querying blockchain events
4. **Backend API** - Node.js/Express API with SQLite database for storing beneficiary names and contact information

The system allows:
- Beneficiaries to claim subsidies at regular intervals
- Automatic token swapping from multiple whitelisted tokens to cCOP
- Admin management of beneficiaries, funds, and program parameters
- Real-time tracking of claims, funds, and beneficiary statistics

---

## Architecture Overview

```
┌─────────────────┐
│   Frontend       │  React + TypeScript + Wagmi
│   (React App)    │  └─ User Interface
│                  │  └─ Admin Dashboard
└────────┬─────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
┌────────▼─────────┐  ┌────▼──────────┐ ┌────▼───────────┐
│  Smart Contract  │  │   Subgraph    │ │  Backend API   │
│  (SubsidyProgram)│  │  (The Graph)  │ │  (Node.js)     │
│  on Celo         │  │  └─ Indexing  │ │  └─ SQLite DB  │
└──────────────────┘  └───────────────┘ └────────────────┘
         │
         │
┌────────▼─────────┐
│  Uniswap V3      │
│  Swap Router     │
└──────────────────┘
```

---

## Smart Contracts

### Main Contract: `SubsidyProgram.sol`

**Location:** `smart-cotracts/src/SubsidyProgram.sol`

#### Key Features:
- **Upgradeable Contract** - Uses UUPS (Universal Upgradeable Proxy Standard) pattern
- **Ownable** - Only owner can manage beneficiaries and program parameters
- **Multi-Token Support** - Accepts multiple ERC20 tokens, swaps them to cCOP
- **Automatic Swapping** - Uses Uniswap V3 to swap alternative tokens to cCOP when needed

#### Core Functionality:

**1. Beneficiary Management**
- `addBeneficiary(address)` - Owner can add eligible beneficiaries
- `removeBeneficiary(address)` - Owner can remove beneficiaries
- `isBeneficiary(address)` - Check if an address is a beneficiary

**2. Token Management**
- `addToken(address)` - Add whitelisted tokens
- `removeToken(address)` - Remove tokens from whitelist
- `changeTokenPriority(address, uint256)` - Reorder token priority for swapping
- `setTokenFeeTier(address, uint24)` - Set Uniswap fee tier for token swaps
- `getWhitelistedTokens()` - Get all whitelisted tokens

**3. Fund Management**
- `addFunds(uint256, address)` - Anyone can add funds (donations)
- `withdrawFunds(address)` - Owner can withdraw funds
- Automatic token swapping when cCOP balance is insufficient

**4. Subsidy Claims**
- `claimSubsidy()` - Beneficiaries can claim their periodic subsidy
  - Enforces claim interval (default: 7 days)
  - Automatically swaps other tokens to cCOP if needed
  - Tracks total claimed per beneficiary

**5. Configuration**
- `setClaimInterval(uint256)` - Set time between claims
- `setClaimableAmount(uint256)` - Set subsidy amount per claim

#### Storage Pattern:
Uses OpenZeppelin's storage pattern to avoid storage collisions in upgradeable contracts:
```solidity
struct SubsidyProgramStorage {
    mapping(address => User) addressToUser;
    uint256 subsidyClaimInterval;
    uint256 subsidyClaimableAmount;
    address[] tokens;
    mapping(address => uint256) tokenIndex;
    ISwapRouter swapRouter;
    mapping(address => uint24) tokenToFeeTier;
}
```

#### Events Emitted:
- `BeneficiaryAdded`, `BeneficiaryRemoved`
- `SubsidyClaimed`
- `FundsAdded`, `FundsWithdrawn`
- `TokenAdded`, `TokenRemoved`, `TokenPriorityChanged`
- `TokenSwapped`
- `ClaimIntervalSet`, `ClaimableAmountSet`

### Deployment Script

**Location:** `smart-cotracts/script/DeploySubsidyProgram.s.sol`

Deploys the contract using:
- **ERC1967Proxy** for upgradeability
- Initializes with token address, swap router, and owner
- Supports both testnet and mainnet deployments

---

## Frontend Application

### Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wagmi** + **Reown AppKit** for Web3 connectivity
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Recharts** for data visualization
- **GraphQL** for querying The Graph subgraph

### Project Structure

```
frontend/
├── src/
│   ├── App.tsx              # Main user interface
│   ├── pages/
│   │   └── Admin.tsx        # Admin dashboard
│   ├── components/
│   │   ├── pages/
│   │   │   ├── main/        # User-facing components
│   │   │   └── admin/        # Admin components
│   │   ├── layout/          # Layout components (NavBar)
│   │   └── ui/              # Reusable UI components
│   ├── hooks/
│   │   ├── useSubsidyContract.ts  # Custom hook for contract interactions
│   │   └── use-toast.ts     # Toast notifications
│   ├── queries/             # GraphQL queries
│   ├── constants/           # Contract addresses and ABIs
│   ├── config/              # Wagmi/AppKit configuration
│   └── providers.tsx        # React providers setup
```

### Key Components

#### User Interface (`App.tsx`)
- **Claim Button** - Allows beneficiaries to claim subsidies
- **User Status** - Shows if user is whitelisted and claim eligibility
- **Claim History** - Displays last claimed time and total claimed
- **Donation Interface** - Users can donate funds to the program
- **Divvi Integration** - Referral tracking for attribution

#### Admin Dashboard (`Admin.tsx`)
- **Beneficiaries Management** - View and manage beneficiary list
- **Funds Overview** - Monitor contract balances and token holdings
- **Analytics Dashboard** - Charts and statistics for:
  - Daily claims
  - Total funds supplied/withdrawn
  - Beneficiary activity

#### Custom Hooks

**`useSubsidyContract`**
- Reads contract state: beneficiary status, claim eligibility, intervals
- Returns: `isWhiteListed`, `isAbleToClaim`, `lastClaimed`, `totalClaimed`, `claimInterval`, `valueToClaim`

### GraphQL Queries

The frontend queries The Graph subgraph for:
- **Beneficiaries** - List of all beneficiaries and their stats
- **Daily Claims** - Daily aggregation of claims
- **Funds** - Contract balance and token information

### Configuration

**Network:** Celo Mainnet (Chain ID: 42220)
**Contract Address:** `0x947C6dB1569edc9fd37B017B791cA0F008AB4946`
**cCOP Token:** `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
**Divvi Consumer:** `0x302E2A0D4291ac14Aa1160504cA45A0A1F2E7a5c`

---

## Subgraph (The Graph)

### Purpose
Indexes blockchain events from the SubsidyProgram contract to provide efficient querying of historical data and statistics.

### Schema (`schema.graphql`)

**Entities:**

1. **Beneficiary**
   - `id` - Beneficiary address
   - `totalClaimed` - Total amount claimed
   - `dateAdded` - When added as beneficiary
   - `dateRemoved` - When removed (if applicable)
   - `isActive` - Current status

2. **Funds**
   - `id` - Contract address
   - `totalSupplied` - Total funds added
   - `totalWithdrawn` - Total funds withdrawn
   - `totalClaimed` - Total subsidies claimed
   - `contractBalance` - Current cCOP balance
   - `tokens` - Related token balances

3. **TokenBalance**
   - `id` - Token address
   - `token` - Token address
   - `balance` - Current balance
   - `totalSwapped` - Total swapped to cCOP
   - `totalWithdrawn` - Total withdrawn

4. **DailyClaim**
   - `id` - Date (YYYY-MM-DD format)
   - `date` - Timestamp
   - `totalClaims` - Number of claims that day
   - `totalAmount` - Total amount claimed
   - `beneficiaries` - List of addresses who claimed

### Event Handlers (`subsidy-program.ts`)

- `handleBeneficiaryAdded` - Creates new Beneficiary entity
- `handleBeneficiaryRemoved` - Marks beneficiary as inactive
- `handleSubsidyClaimed` - Updates beneficiary stats and daily claims
- `handleFundsAdded` - Updates fund balances
- `handleFundsWithdrawn` - Updates withdrawal stats
- `handleTokenAdded` - Creates TokenBalance entity
- `handleTokenSwapped` - Updates swap statistics

### Deployment
- **Network:** Celo
- **Contract:** `0xAbE493F082f41B432696F715f84D5471F48cdA2B`
- **Start Block:** 51341193
- **Subgraph Name:** `refimedubi-celo`

---

## How It Works

### User Flow: Claiming a Subsidy

1. **User connects wallet** via Reown AppKit
2. **Frontend checks** if address is a beneficiary via `isBeneficiary()`
3. **Frontend checks** claim eligibility:
   - Time since last claim >= claim interval
   - User is whitelisted
4. **User clicks "Reclamar"** button
5. **Transaction sent** to `claimSubsidy()` function
6. **Contract logic:**
   - Verifies beneficiary status
   - Checks claim interval
   - If cCOP balance insufficient:
     - Iterates through whitelisted tokens (reverse priority)
     - Swaps tokens to cCOP via Uniswap V3
   - Transfers subsidy amount to beneficiary
   - Updates `lastClaimed` timestamp
   - Emits `SubsidyClaimed` event
7. **Subgraph indexes** the event
8. **Frontend updates** with new data

### Admin Flow: Managing Program

1. **Admin connects wallet** (must be contract owner)
2. **Accesses `/admin` route**
3. **Can perform:**
   - Add/remove beneficiaries
   - Add/remove whitelisted tokens
   - Set claim interval and amount
   - Withdraw funds
   - View analytics dashboard

### Token Swapping Mechanism

When a claim is made and cCOP balance is insufficient:
1. Contract iterates through tokens in **reverse priority order** (lowest priority first)
2. For each token:
   - Checks balance
   - Attempts swap via Uniswap V3 `exactOutputSingle`
   - Swaps enough to cover the subsidy amount
   - Stops when sufficient cCOP is obtained
3. If still insufficient after all swaps, transaction reverts

---

## Key Features

### 1. **Multi-Token Support**
- Accepts donations in multiple ERC20 tokens
- Automatic conversion to cCOP when needed
- Configurable token priority for swapping order

### 2. **Time-Locked Claims**
- Enforces minimum interval between claims (default: 7 days)
- Prevents abuse and ensures fair distribution

### 3. **Upgradeable Contract**
- Uses UUPS pattern for future improvements
- Maintains state across upgrades

### 4. **Comprehensive Tracking**
- The Graph subgraph indexes all events
- Real-time analytics and historical data
- Daily claim aggregations

### 5. **Referral Attribution**
- Integrated with Divvi SDK for referral tracking
- Helps track user acquisition sources

### 6. **User-Friendly Interface**
- Clear status indicators
- Transaction notifications with Celoscan links
- Responsive design for mobile and desktop

### 7. **Admin Dashboard**
- Visual analytics with charts
- Beneficiary management interface
- Fund monitoring and token balance tracking

---

## Project Structure

```
subsidies/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── App.tsx             # Main user interface
│   │   ├── pages/              # Page components
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks (includes useBeneficiaries)
│   │   ├── queries/            # GraphQL queries
│   │   ├── constants/          # Contract addresses, ABIs
│   │   └── config/             # Wagmi/AppKit config
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js API server
│   ├── src/
│   │   └── index.ts            # Express API server
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data (32 beneficiaries)
│   ├── package.json
│   ├── README.md               # Backend documentation
│   └── QUICK_START.md          # Quick setup guide
│
├── smart-cotracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── SubsidyProgram.sol  # Main contract
│   │   └── ISwapRouter.sol     # Uniswap interface
│   ├── script/
│   │   └── DeploySubsidyProgram.s.sol
│   ├── test/                   # Foundry tests
│   └── foundry.toml
│
├── subgraph/                    # The Graph subgraph
│   ├── schema.graphql          # GraphQL schema
│   ├── subgraph.yaml           # Subgraph manifest
│   ├── src/
│   │   └── subsidy-program.ts  # Event handlers
│   └── abis/                   # Contract ABIs
│
└── INTEGRATION_GUIDE.md         # Guide for integrating backend with frontend
```

---

## Setup Instructions

### Prerequisites
- Node.js 20
- Foundry (for smart contracts)
- The Graph CLI (for subgraph)

### Backend Setup

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed              # Seed with 32 beneficiaries
npm run dev               # Runs on http://localhost:3001
```

**Environment Variables:**

- `DATABASE_URL` - SQLite database path (default: `file:./dev.db`)
- `PORT` - Server port (default: 3001)

See [backend/README.md](backend/README.md) for API documentation.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Add VITE_PROJECT_ID and VITE_API_URL
npm run dev
```

**Environment Variables:**
- `VITE_PROJECT_ID` - Reown/WalletConnect project ID
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`)

### Smart Contracts Setup

```bash
cd smart-cotracts
forge install
forge build
forge test
```

**Deployment:**
```bash
# Set environment variables
export TOKEN_ADDRESS=<cCOP_address>
export SWAP_ROUTER_ADDRESS=<uniswap_router>
export INITIAL_OWNER=<owner_address>

# Deploy
forge script script/DeploySubsidyProgram.s.sol:DeploySubsidyProgram \
  --rpc-url celo \
  --broadcast \
  --verify
```

### Subgraph Setup

```bash
cd subgraph
npm install
npm run codegen
npm run build

# Deploy to The Graph Studio
npm run deploy
```

---

## Deployment Information

### Smart Contract
- **Network:** Celo Mainnet
- **Contract Address:** `0x947C6dB1569edc9fd37B017B791cA0F008AB4946`
- **Implementation:** Deployed via ERC1967Proxy (UUPS pattern)
- **cCOP Token:** `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`

### Frontend
- **Framework:** Vite + React
- **Deployment:** Vercel (based on `vercel.json`)
- **URL:** `https://subsidio.refimedellin.org`

### Subgraph
- **Network:** Celo
- **Subgraph Name:** `refimedubi-celo`
- **Start Block:** 51341193
- **Contract:** `0xAbE493F082f41B432696F715f84D5471F48cdA2B`

---

## Technology Stack

### Smart Contracts
- **Solidity** ^0.8.28
- **Foundry** - Development framework
- **OpenZeppelin** - Upgradeable contracts library
- **Uniswap V3** - Token swapping

### Frontend
- **React** 18.3
- **TypeScript** 5.6
- **Vite** - Build tool
- **Wagmi** 2.13 - Ethereum React hooks
- **Reown AppKit** - Wallet connection
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Recharts** - Data visualization
- **GraphQL** - Subgraph queries

### Subgraph
- **The Graph Protocol**
- **AssemblyScript** - Event handler language
- **GraphQL** - Query interface

### Blockchain
- **Celo Network** - Mainnet deployment
- **cCOP** - Colombian Peso stablecoin on Celo

---

## Additional Notes

### Security Considerations
- Contract uses OpenZeppelin's battle-tested upgradeable patterns
- Owner-only functions for critical operations
- Input validation on all public functions
- Reentrancy protection via Uniswap's router

### Gas Optimization
- Uses storage slots efficiently with custom storage pattern
- Batch operations where possible
- Minimal external calls during claims

### Future Enhancements
- Contract is upgradeable, allowing for future improvements
- Subgraph can be extended with additional entities
- Frontend can add more analytics and features

---

## License

MIT License (as indicated in smart contract SPDX headers)

---

*Last Updated: Based on current codebase analysis*

