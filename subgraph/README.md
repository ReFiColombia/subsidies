# Subgraph

The Graph subgraph indexing SubsidyProgram contract events on Celo mainnet.

Subgraph name: `refi-colombia-subsidies` (Studio account of ReFi Colombia)

Query URL: `https://api.studio.thegraph.com/query/1757108/refi-colombia-subsidies/version/latest`

## Contract Configuration

`subgraph.yaml` indexes both contracts on Celo mainnet:

| Data source | Contract | Address | Start block | Status |
|---|---|---|---|---|
| `SubsidyProgramV1` | V1, non-upgradeable | `0x947C6dB1569edc9fd37B017B791cA0F008AB4946` | 29277553 | Active, holds the funds |
| `SubsidyProgram` | V2, UUPS proxy | `0xAbE493F082f41B432696F715f84D5471F48cdA2B` | 51341193 | Deployed, not active yet |

Each contract gets its own `Funds` entity (the id is the contract address).
`Beneficiary` and `DailyClaim` are shared, so the history carries over when
the program moves to V2. No new deployment is needed for that switch.

Studio allows 3 deployed subgraphs per account and 3,000 queries per day on
the development URL.

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

History is copied from the previous deployment
(`Qmb6TtJ3e8btLVkwcBYQFktAXJWgRjcYwjHszQ865YvHcv`) at block 79499496. Blocks
after that are indexed normally.

Why: a full re-index in Studio on 2026-10-07 finished without errors but with
more than half of the Celo events missing (28 of 85 beneficiaries, 4.65M of
27.04M claimed). The block explorer and the previous deployment both have every
event, so the gap is in Studio's historical backfill, not in the mappings. A
replay of the explorer's logs through the same handler logic gives the right
totals.

After grafting, the totals, the 85 beneficiaries and the 544 daily claim rows
match the previous deployment exactly, and `contractBalance` matches the token
balance read from chain.

Do not remove the graft and redeploy without checking the result against the
block explorer.

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
