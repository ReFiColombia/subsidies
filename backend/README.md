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
| `POST` | `/api/seed` | Seed database from `BENEFICIARIES_DATA` env var (temporary) |

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
| `BENEFICIARIES_DATA` | No | JSON string for seeding via `POST /api/seed` |

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
}
```

### Useful Commands

```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open database GUI
npm run seed              # Seed from prisma/beneficiaries.json or BENEFICIARIES_DATA
```

## Deployment (Vercel)

The backend is deployed on Vercel as a serverless function.

### Steps

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Add environment variables in the Vercel dashboard:
   - `POSTGRES_URL` — Vercel Postgres or an external PostgreSQL connection string
   - `DUNE_API_KEY` — your Dune Analytics API key
   - `BENEFICIARIES_DATA` — JSON string of seed data (if needed)
4. Deploy: `vercel --prod`

### Important Notes

- **Deployment Protection** must be disabled for the backend project in Vercel settings, otherwise API calls from the frontend will receive 401 responses.
- The `vercel-build` script runs `prisma generate && prisma migrate deploy && tsc`.
- The Prisma schema already uses `postgresql` as the provider.

## Tech Stack

- **Runtime:** Node.js 22.x
- **Framework:** Express with CORS
- **Database:** Prisma ORM with PostgreSQL
- **Analytics:** Dune Analytics client SDK (1-hour cache)
- **Validation:** viem (Ethereum address validation)
- **Language:** TypeScript (tsx for dev, tsc for build)
