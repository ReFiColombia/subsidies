# Subgraph

The Graph subgraph indexing SubsidyProgram contract events on Celo mainnet.

Subgraph name: `refimedubi-celo`

## Contract Configuration

`subgraph.yaml` indexes the **V2 proxy** contract:

- **Address:** `0xAbE493F082f41B432696F715f84D5471F48cdA2B`
- **Start block:** 51341193
- **Network:** Celo

> **Note:** `networks.json` still references the V1 contract (`0x947C6dB...`, start block 29277553). This file is not currently used by the deployment pipeline — `subgraph.yaml` takes precedence.

## Indexed Events

| Event | Handler |
|-------|---------|
| `BeneficiaryAdded(indexed address)` | `handleBeneficiaryAdded` |
| `BeneficiaryRemoved(indexed address)` | `handleBeneficiaryRemoved` |
| `SubsidyClaimed(indexed address, uint256, uint256)` | `handleSubsidyClaimed` |
| `FundsAdded(uint256, address, uint256)` | `handleFundsAdded` |
| `FundsWithdrawn(address, uint256)` | `handleFundsWithdrawn` |
| `TokenAdded(indexed address, uint256)` | `handleTokenAdded` |
| `TokenSwapped(indexed address, uint256, uint256)` | `handleTokenSwapped` |

## Schema Entities

Defined in `schema.graphql`:

- **Beneficiary** — tracks each beneficiary's total claimed amount, active status, and add/remove dates
- **Funds** — singleton entity tracking total supplied, withdrawn, claimed, and current contract balance
- **TokenBalance** — per-token balance, total swapped, and total withdrawn (derived from Funds)
- **DailyClaim** — daily aggregation of claims with count, total amount, and list of claimant addresses

## Grafting

The subgraph uses [grafting](https://thegraph.com/docs/en/developing/creating-a-subgraph/#grafting-onto-existing-subgraphs) to continue from a previous deployment:

- **Base:** `Qmb6TtJ3e8btLVkwcBYQFktAXJWgRjcYwjHszQ865YvHcv`
- **Block:** 51667562

This means the subgraph inherits indexed data up to block 51667562 from the base deployment and continues indexing from there.

## Development

```bash
# Generate types from schema and ABI
npm run codegen

# Build the subgraph
npm run build

# Run tests
npm run test

# Deploy to The Graph Studio
npm run deploy
```

## Tech Stack

- **Graph CLI:** 0.97.0
- **Graph TS:** 0.37.0
- **Testing:** Matchstick 0.6.0
- **Runtime:** Node.js 22.x
