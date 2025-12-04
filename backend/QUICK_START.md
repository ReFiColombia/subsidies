# Quick Start Guide

## Installation & Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
echo "init_beneficiaries" | npx prisma migrate dev

# Seed database with 32 beneficiaries
npm run seed

# Start development server
npm run dev
```

Server will be running at `http://localhost:3001`

## Test the API

```bash
# Health check
curl http://localhost:3001/health

# Get all beneficiaries
curl http://localhost:3001/api/beneficiaries

# Get specific beneficiary
curl http://localhost:3001/api/beneficiaries/0xf01365c382f29861ec27e2ad332f0b94171f7f93

# Create new beneficiary
curl -X POST http://localhost:3001/api/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "name": "Test User",
    "phoneNumber": "+57 300 123 4567",
    "responsable": "Ana"
  }'

# Update beneficiary
curl -X PUT http://localhost:3001/api/beneficiaries/0x1234567890123456789012345678901234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phoneNumber": "+57 300 999 9999"
  }'

# Delete beneficiary
curl -X DELETE http://localhost:3001/api/beneficiaries/0x1234567890123456789012345678901234567890
```

## Database GUI

View and edit the database visually:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## Current Database

The database is pre-seeded with 32 beneficiaries:

- Luz Elena (Ana)
- Rosiris De Angel (Juan)
- Samuel Guzmán (Juan)
- Blanca, Emily Ruda, Gloria Denise, etc. (Platohedro)
- Daisi De Angel, Emerson, Julieth Suarez, etc. (Rosiris)
- Santiago Laguna Monsalve (Sebastian)
- Heidy Jazmín López Cerrón, Emmy Milena Vasallo Florez (Waira)

All beneficiaries have:
- Unique Ethereum address
- Name
- Responsible person
- Phone number field (currently null, can be added)
