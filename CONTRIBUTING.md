# Contributing

Thanks for your interest in contributing to Subsidios RefiColombia!

## Development Setup

### Prerequisites

- Node.js 22.x
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)

### Getting Started

```bash
git clone https://github.com/ReFiColombia/subsidies.git
cd subsidies
```

Each package has its own dependencies:

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Smart contracts
cd smart-contracts && forge install

# Subgraph
cd subgraph && npm install
```

Copy `.env.example` to `.env` in each package and fill in the required values.

## Branch Conventions

- `master` — production branch
- `development` — main development branch
- Feature branches from `development`

## Pull Request Process

1. Create a branch from `development`
2. Make your changes with clear commit messages
3. Test your changes locally
4. Open a PR against `development`
5. Wait for review

## Code Style

- **Frontend:** ESLint + Prettier
- **Smart Contracts:** Formatted with `forge fmt`

Run formatters before committing:

```bash
# Frontend
cd frontend && npx prettier --write . && npx eslint .

# Smart contracts
cd smart-contracts && forge fmt
```

## Project Structure

```
subsidies/
├── frontend/        — Vite + React (see frontend/README.md)
├── backend/         — Express + Prisma (see backend/README.md)
├── smart-contracts/ — Foundry contracts (see smart-contracts/README.md)
├── subgraph/        — The Graph indexer (see subgraph/README.md)
└── docs/            — Design specs and cross-cutting docs
```
