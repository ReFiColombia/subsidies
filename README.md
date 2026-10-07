# Subsidios RefiColombia

A subsidy distribution platform on the Celo blockchain that enables eligible beneficiaries to claim periodic subsidies in COPm (Colombian Peso stablecoin).

Live at [subsidios.reficolombia.org](https://subsidios.reficolombia.org)

## What is this?

This program allows registered beneficiaries to claim a fixed amount of COPm at regular intervals. An admin manages beneficiaries, funds, and program parameters. The V2 smart contract supports multi-token donations with automatic Uniswap V3 swaps to COPm at claim time.

## Repository Structure

```
subsidies/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json
│   └── README.md
│
├── docs/
│   └── BRANDKIT.md
│
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   ├── manifest.json
│   │   ├── refi_logo.png
│   │   └── sw.js
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── pages/
│   │   │   │   ├── admin/
│   │   │   │   └── main/
│   │   │   └── ui/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   │   └── locales/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── queries/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── providers.tsx
│   ├── .env.example
│   ├── .graphclientrc.yml
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── vite.config.ts
│   ├── wagmi.config.ts
│   └── README.md
│
├── smart-contracts/
│   ├── lib/
│   ├── script/
│   │   └── DeploySubsidyProgram.s.sol
│   ├── src/
│   │   ├── SubsidyProgram.sol
│   │   └── ISwapRouter.sol
│   ├── test/
│   │   ├── helpers/
│   │   ├── mock/
│   │   └── unit/
│   ├── .env.example
│   ├── foundry.toml
│   ├── remappings.txt
│   └── README.md
│
├── subgraph/
│   ├── abis/
│   │   └── SubsidyProgram.json
│   ├── src/
│   │   └── subsidy-program.ts
│   ├── tests/
│   │   ├── subsidy-program.test.ts
│   │   └── subsidy-program-utils.ts
│   ├── docker-compose.yml
│   ├── networks.json
│   ├── package.json
│   ├── schema.graphql
│   ├── subgraph.yaml
│   ├── tsconfig.json
│   └── README.md
│
├── .gitmodules
├── .nvmrc
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── vercel.json
```

Each package has its own README with setup instructions and detailed documentation.

## Deployed Contracts

| Address | Network | Role | Status |
|---------|---------|------|--------|
| `0x947C6dB1569edc9fd37B017B791cA0F008AB4946` | Celo Mainnet | V1 SubsidyProgram | **Active** |
| `0xAbE493F082f41B432696F715f84D5471F48cdA2B` | Celo Mainnet | V2 SubsidyProgram (UUPS Proxy) | Deployed, not yet active |
| `0x35108fAa4511BAfe42ABD85F0BAB71f67Cc4AC1d` | Celo Mainnet | V2 Implementation | Behind proxy |
| `0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf` | Celo Alfajores | Test deployment | Testnet only |
| `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Celo Mainnet | COPm Token (ERC-20) | Active |

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
| Frontend | Vite, React 18, TailwindCSS, wagmi, Reown, i18next |
| Backend | Express, Prisma, Dune Analytics SDK |
| Subgraph | The Graph (AssemblyScript) |
| Swap | Uniswap V3 (on-chain), Squid Router (frontend widget) |
| Deployment | Vercel (frontend + backend) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch conventions, and PR process.

## License

[MIT](LICENSE)
