# Subsidies Backend API

Backend API for managing beneficiary information including names, phone numbers, and responsible persons.

## Features

- Store beneficiary names, phone numbers, and responsible persons mapped to Ethereum addresses
- RESTful API with full CRUD operations
- Address validation using viem
- SQLite database with Prisma ORM
- TypeScript support

## Setup

### Prerequisites

- Node.js >= 20
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed the database with initial data:

   The seed script loads beneficiary data from either:

   - `prisma/beneficiaries.json` (local development - create this file with your data)
   - `BENEFICIARIES_DATA` environment variable (production)

   ```bash
   npm run seed
   ```

**Note**: `beneficiaries.json` is gitignored for security. See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.

### Development

Run the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Production

Build and run:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### Beneficiaries

#### Get all beneficiaries
```bash
GET /api/beneficiaries
```

#### Get beneficiary by address
```bash
GET /api/beneficiaries/:address
```

#### Create new beneficiary
```bash
POST /api/beneficiaries
Content-Type: application/json

{
  "address": "0x...",
  "name": "John Doe",
  "phoneNumber": "+57 123 456 7890",  // optional
  "responsable": "Ana"                 // optional
}
```

#### Update beneficiary
```bash
PUT /api/beneficiaries/:address
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phoneNumber": "+57 123 456 7890",
  "responsable": "Ana"
}
```

#### Delete beneficiary
```bash
DELETE /api/beneficiaries/:address
```

#### Batch get beneficiaries
```bash
POST /api/beneficiaries/batch
Content-Type: application/json

{
  "addresses": ["0x...", "0x..."]
}
```

## Database Schema

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

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Example Usage

### Fetch beneficiary name for an address:
```typescript
const response = await fetch('http://localhost:3001/api/beneficiaries/0xf01365c382f29861ec27e2ad332f0b94171f7f93');
const beneficiary = await response.json();
console.log(beneficiary.name); // "Luz Elena"
```

### Create a new beneficiary:
```typescript
const response = await fetch('http://localhost:3001/api/beneficiaries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: '0x1234...',
    name: 'Maria Garcia',
    phoneNumber: '+57 300 123 4567',
    responsable: 'Ana'
  })
});
```
