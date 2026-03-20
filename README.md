# Subsidios RefiColombia

A subsidy distribution platform on the Celo blockchain that enables eligible beneficiaries to claim periodic subsidies in cCOP (Colombian Peso stablecoin).

Live at [subsidios.reficolombia.org](https://subsidios.reficolombia.org)

## What is this?

This program allows registered beneficiaries to claim a fixed amount of cCOP at regular intervals. An admin manages beneficiaries, funds, and program parameters. The V2 smart contract supports multi-token donations with automatic Uniswap V3 swaps to cCOP at claim time.

## Repository Structure

```
subsidies/
├── README.md                          ← Project entry point
├── CONTRIBUTING.md                    ← Setup, branch conventions, PR process
├── LICENSE                            ← MIT
│
├── frontend/                          ← Vite + React + wagmi (Celo)
│   ├── README.md                      ← Components, env vars, Vercel deployment
│   └── .env.example
│
├── backend/                           ← Express + Prisma + Dune Analytics
│   ├── README.md                      ← API endpoints, database, Vercel deployment
│   └── .env.example
│
├── smart-contracts/                   ← Foundry (Solidity ^0.8.28)
│   ├── README.md                      ← Contract registry, V1/V2 docs, auto-swap
│   └── .env.example
│
├── subgraph/                          ← The Graph (Celo Mainnet)
│   └── README.md                      ← Indexed events, schema, grafting
│
└── docs/
    ├── BRANDKIT.md                    ← Typography & design tokens
    └── superpowers/                   ← Design specs & implementation plans
```

Each package has its own README with setup instructions and detailed documentation.

## Deployed Contracts

| Address | Network | Role | Status |
|---------|---------|------|--------|
| `0x947C6dB1569edc9fd37B017B791cA0F008AB4946` | Celo Mainnet | V1 SubsidyProgram | **Active** |
| `0xAbE493F082f41B432696F715f84D5471F48cdA2B` | Celo Mainnet | V2 SubsidyProgram (UUPS Proxy) | Deployed, not yet active |
| `0x35108fAa4511BAfe42ABD85F0BAB71f67Cc4AC1d` | Celo Mainnet | V2 Implementation | Behind proxy |
| `0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf` | Celo Alfajores | Test deployment | Testnet only |
| `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Celo Mainnet | cCOP Token (ERC-20) | Active |

See [smart-contracts/README.md](smart-contracts/README.md) for full V1 vs V2 comparison and function reference.

## Quick Start

### Prerequisites

- Node.js 22.x
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)

### Setup

```bash
git clone https://github.com/ReFiColombia/subsidies.git
cd subsidies
```

Then follow the README in each package:

- [frontend/README.md](frontend/README.md) — `npm install && npm run dev`
- [backend/README.md](backend/README.md) — `npm install && npm run dev`
- [smart-contracts/README.md](smart-contracts/README.md) — `forge build`
- [subgraph/README.md](subgraph/README.md) — `npm run codegen && npm run build`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Celo Mainnet |
| Smart Contracts | Solidity ^0.8.28, Foundry, OpenZeppelin (UUPS) |
| Frontend | Vite, React 18, TailwindCSS, wagmi, Reown |
| Backend | Express, Prisma, Dune Analytics SDK |
| Subgraph | The Graph (AssemblyScript) |
| Swap | Uniswap V3 (on-chain), Squid Router (frontend widget) |
| Deployment | Vercel (frontend + backend) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch conventions, and PR process.

## License

[MIT](LICENSE)
