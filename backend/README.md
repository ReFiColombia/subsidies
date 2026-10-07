# Backend API

Express API serving Dune Analytics program statistics and beneficiary management for the Subsidios RefiColombia platform.

## Quick Start

```bash
npm install
cp .env.example .env         # fill in DUNE_API_KEY
npm run prisma:generate
npm run prisma:migrate
npm run dev                   # http://localhost:3001
```

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

### Dune Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dune/stats` | Program stats (funds added, distributed, recipients, balance) |
| `GET` | `/api/dune/monthly` | Monthly distribution data for charts |

Responses are cached for 1 hour.

### Beneficiaries

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/beneficiaries` | List all beneficiaries |
| `GET` | `/api/beneficiaries/:address` | Get beneficiary by Ethereum address |
| `POST` | `/api/beneficiaries` | Create a beneficiary |
| `PUT` | `/api/beneficiaries/:address` | Update a beneficiary |
| `DELETE` | `/api/beneficiaries/:address` | Delete a beneficiary |
| `POST` | `/api/beneficiaries/batch` | Batch lookup by address array |

#### Create/Update Body

```json
{
  "address": "0x...",
  "name": "John Doe",
  "phoneNumber": "+57 123 456 7890",
  "responsable": "Ana"
}
```

`phoneNumber` and `responsable` are optional.

#### Batch Lookup Body

```json
{
  "addresses": ["0x...", "0x..."]
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | PostgreSQL connection string (used by Prisma) |
| `PORT` | No | Server port (default: `3001`) |
| `DUNE_API_KEY` | Yes | Dune Analytics API key for program stats |
| `BENEFICIARIES_DATA` | No | JSON string used by `npm run seed` |
| `ADMIN_ADDRESSES` | No | Extra admin wallets, comma separated. The contract owner is always an admin |
| `SUBSIDY_CONTRACT_ADDRESS` | No | Contract whose owner is the admin. Defaults to the V1 SubsidyProgram |
| `CELO_RPC_URL` | No | RPC used to read the contract owner. Defaults to forno.celo.org |
| `ALLOWED_ORIGINS` | No | Extra browser origins allowed to call the API, comma separated |

## Database

Uses Prisma ORM with PostgreSQL. The Prisma schema reads from the `POSTGRES_URL` environment variable.

```prisma
model Beneficiary {
  id          String   @id @default(uuid())
  address     String   @unique
  name        String
  phoneNumber String?
  responsable String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([address])
}
```

### Useful Commands

```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open database GUI
npm run seed              # Seed from prisma/beneficiaries.json or BENEFICIARIES_DATA
```

## Deployment (Railway)

The backend is deployed on Railway from the `main` branch, using `backend/railway.json`. It runs as a long-lived Node process next to a Railway Postgres database.

Environment variables in the Railway service:

- `POSTGRES_URL`: PostgreSQL connection string (Railway Postgres)
- `DUNE_API_KEY`: Dune Analytics API key (only used as a fallback for stats)
- `ADMIN_ADDRESSES`: optional, extra admin wallets (comma separated)
- `ALLOWED_ORIGINS`: optional, extra sites allowed to call the API (comma separated)
- `SUBGRAPH_URL`: optional, overrides the subsidies subgraph endpoint

Migrations run before each deploy with `prisma migrate deploy`. The health check is `GET /health`.

## Tech Stack

- **Runtime:** Node.js 22.x
- **Framework:** Express with CORS
- **Database:** Prisma ORM with PostgreSQL
- **Analytics:** Dune Analytics client SDK (1-hour cache)
- **Validation:** viem (Ethereum address validation)
- **Language:** TypeScript (tsx for dev, tsc for build)

## Admin access

Beneficiary records hold names and phone numbers, so every `/api/beneficiaries`
route needs an admin signature. `/health` and `/api/dune/*` stay public.

The caller sends three headers:

| Header | Value |
|---|---|
| `x-admin-address` | Admin wallet address |
| `x-admin-timestamp` | Time of signing, in milliseconds |
| `x-admin-signature` | Wallet signature over the message below |

```
ReFi Colombia Subsidies
Sign to access beneficiary records as an admin.
Address: <address in lowercase>
Issued at: <timestamp>
```

A signature is valid for 8 hours. The wallet must be the owner of the
SubsidyProgram contract or be listed in `ADMIN_ADDRESSES`. The frontend handles
this in `src/lib/adminAuth.ts`: the admin signs once per browser session.
