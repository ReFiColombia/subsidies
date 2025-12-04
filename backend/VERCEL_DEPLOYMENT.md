# Deploy to Vercel - Step by Step Guide

Complete guide to deploy your subsidies backend API to Vercel with PostgreSQL database.

---

## 🎯 Overview

Vercel deployment uses:
- **Vercel Serverless Functions** for the API
- **Vercel Postgres** (powered by Neon) for the database
- **Environment Variables** for sensitive beneficiary data
- **GitHub** for automatic deployments

**Cost**: Free for hobby projects (includes 256MB PostgreSQL database)

---

## 📋 Prerequisites

- GitHub account with your code pushed
- Vercel account (sign up at https://vercel.com)
- `jq` installed locally (for JSON formatting)

Install jq if needed:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies

# Make sure beneficiaries.json is gitignored (already done)
git status | grep beneficiaries.json  # Should show nothing

# Add all files
git add .

# Commit
git commit -m "Add backend API with Vercel support"

# Push to GitHub
git push origin master
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. Click **"Import Git Repository"**
4. Select your `subsidies` repository
5. Click **"Import"**

### Step 3: Configure Project Settings

In the project configuration screen:

**Framework Preset**: Other

**Root Directory**: Click "Edit" → Enter `backend`

**Build Settings**:
- Build Command: `npx prisma generate && npm run build`
- Output Directory: `dist` (leave default)
- Install Command: `npm install`

Click **"Deploy"** (it will fail first - that's expected, we need to add database and env vars)

### Step 4: Add PostgreSQL Database

1. In your Vercel project dashboard, go to the **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a database name (e.g., `beneficiaries-db`)
5. Select your region (closest to your users)
6. Click **"Create"**

Vercel will automatically:
- Create the database
- Add `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc. to your environment variables
- Link the database to your project

### Step 5: Update Prisma Schema for PostgreSQL

Update `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL") // uses connection pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // uses a direct connection
}
```

Commit and push:

```bash
git add backend/prisma/schema.prisma
git commit -m "Update Prisma schema for Vercel Postgres"
git push origin master
```

### Step 6: Set Environment Variables

#### 6.1 Generate Beneficiaries Data

On your local machine, run:

```bash
cat /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/backend/prisma/beneficiaries.json | jq -c .
```

Copy the entire output (it's a single-line JSON array).

#### 6.2 Add to Vercel

1. Go to your Vercel project → **"Settings"** → **"Environment Variables"**
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `BENEFICIARIES_DATA` | (paste the JSON from step 6.1) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**Important**: For `BENEFICIARIES_DATA`:
- Click "Add New"
- Name: `BENEFICIARIES_DATA`
- Value: Paste the entire JSON string
- Select all environments (Production, Preview, Development)
- Click "Save"

### Step 7: Add Build Script

Vercel needs to run Prisma migrations during deployment. Update `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "vercel-build": "npx prisma generate && npx prisma migrate deploy && npm run build"
  }
}
```

Add this change:

```bash
cd backend
# Edit package.json to add vercel-build script
git add package.json
git commit -m "Add vercel-build script for Prisma migrations"
git push origin master
```

### Step 8: Trigger Redeploy

1. Go to Vercel Dashboard → Your Project → **"Deployments"**
2. Click the three dots on the latest deployment → **"Redeploy"**
3. Check **"Use existing Build Cache"** → Click **"Redeploy"**

Vercel will:
- Install dependencies
- Generate Prisma client
- Run migrations
- Build TypeScript
- Deploy serverless functions

### Step 9: Seed the Database

After successful deployment, you need to seed the database once:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
cd backend
vercel link

# Run seed command
vercel env pull .env.local  # Download env vars locally
npx tsx prisma/seed.ts
```

Wait, this won't work because we need to run it on Vercel's environment. Use Option B instead.

#### Option B: Create a Seed API Endpoint (Temporary)

Add this to `src/index.ts` temporarily:

```typescript
// Temporary seed endpoint (remove after seeding)
app.post('/api/seed', async (req, res) => {
  const { secret } = req.body;

  if (secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { readFileSync, existsSync } = require('fs');
    const { join, dirname } = require('path');
    const { fileURLToPath } = require('url');

    let beneficiaries;
    if (process.env.BENEFICIARIES_DATA) {
      beneficiaries = JSON.parse(process.env.BENEFICIARIES_DATA);
    } else {
      return res.status(500).json({ error: 'No beneficiaries data found' });
    }

    for (const beneficiary of beneficiaries) {
      await prisma.beneficiary.upsert({
        where: { address: beneficiary.address.toLowerCase() },
        update: {
          name: beneficiary.name,
          responsable: beneficiary.responsable,
          phoneNumber: beneficiary.phoneNumber,
        },
        create: {
          address: beneficiary.address.toLowerCase(),
          name: beneficiary.name,
          responsable: beneficiary.responsable,
          phoneNumber: beneficiary.phoneNumber,
        },
      });
    }

    res.json({ success: true, count: beneficiaries.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

Add `SEED_SECRET` env var in Vercel:
- Name: `SEED_SECRET`
- Value: `your-random-secret-key-12345`

Then call it:

```bash
curl -X POST https://your-project.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-random-secret-key-12345"}'
```

**After seeding, remove this endpoint from your code for security!**

#### Option C: Simple - Use Database GUI

1. In Vercel Dashboard → Storage → Your Database
2. Click **"Query"** tab
3. Manually insert a few test records to verify connection:

```sql
INSERT INTO "Beneficiary" (id, address, name, "phoneNumber", responsable, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '0xf01365c382f29861ec27e2ad332f0b94171f7f93', 'Luz Elena', NULL, 'Ana', NOW(), NOW());
```

Or better yet, export your local database and import it (see Alternative Method below).

### Step 10: Test Your Deployment

Get your Vercel URL (e.g., `https://your-project.vercel.app`) and test:

```bash
# Health check
curl https://your-project.vercel.app/health

# Get all beneficiaries
curl https://your-project.vercel.app/api/beneficiaries

# Get specific beneficiary
curl https://your-project.vercel.app/api/beneficiaries/0xf01365c382f29861ec27e2ad332f0b94171f7f93
```

### Step 11: Update Frontend

Update `frontend/.env`:

```bash
VITE_PROJECT_ID=cb2f490d219d3ae517e5da175d402351
VITE_CONTRACT_ADDRESS=0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf
VITE_API_URL=https://your-project.vercel.app
```

Commit and deploy frontend:

```bash
git add frontend/.env
git commit -m "Update API URL for production"
git push origin master
```

If your frontend is also on Vercel, it will auto-deploy.

---

## 🔄 Alternative: Import Existing Database

If you want to import your existing local SQLite data to Vercel Postgres:

### Step 1: Export from SQLite

```bash
cd backend

# Export as SQL dump
sqlite3 prisma/dev.db .dump > data-dump.sql
```

### Step 2: Convert SQLite to PostgreSQL Format

SQLite and PostgreSQL have different SQL syntax. You'll need to manually adjust or use a tool:

```bash
# Remove SQLite-specific commands
sed -i '' '/PRAGMA/d' data-dump.sql
sed -i '' '/BEGIN TRANSACTION/d' data-dump.sql
sed -i '' '/COMMIT/d' data-dump.sql

# Convert AUTOINCREMENT to SERIAL
sed -i '' 's/AUTOINCREMENT/SERIAL/g' data-dump.sql
```

### Step 3: Get Vercel Postgres Connection String

In Vercel Dashboard → Storage → Your Database → **.env.local** tab

Copy the `POSTGRES_URL` value.

### Step 4: Connect and Import

```bash
# Connect to Vercel Postgres
psql "POSTGRES_URL_HERE"

# Inside psql:
\i data-dump.sql
```

Or simpler: Just re-run the seed script (Option B above).

---

## 📊 Manage Database

### View Data

**Option 1**: Vercel Dashboard
- Go to Storage → Your Database → "Query" tab
- Run SQL queries:
  ```sql
  SELECT * FROM "Beneficiary" LIMIT 10;
  ```

**Option 2**: Prisma Studio
```bash
# Download env vars
vercel env pull .env.local

# Open Prisma Studio
npx prisma studio
```

**Option 3**: Any PostgreSQL client
- Use the connection string from Vercel Dashboard
- Tools: TablePlus, DBeaver, pgAdmin

### Update Beneficiary Data

To add/update beneficiaries in production:

1. Update local `beneficiaries.json`
2. Regenerate JSON:
   ```bash
   cat backend/prisma/beneficiaries.json | jq -c .
   ```
3. Update `BENEFICIARIES_DATA` in Vercel Dashboard
4. Redeploy
5. Re-run seed (use one of the methods above)

---

## 🔐 Security Checklist

- [x] `beneficiaries.json` is gitignored
- [x] Sensitive data is in environment variables
- [x] Database is private (Vercel Postgres is not publicly accessible)
- [ ] Add API authentication (future improvement)
- [ ] Add rate limiting (future improvement)
- [ ] Restrict CORS to your frontend domain only

To restrict CORS:

```typescript
// In src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

Add `FRONTEND_URL` env var in Vercel:
- Name: `FRONTEND_URL`
- Value: `https://your-frontend.vercel.app`

---

## 🐛 Troubleshooting

### Build Fails: "Cannot find module '@prisma/client'"

Make sure `vercel-build` script includes `npx prisma generate`:

```json
"vercel-build": "npx prisma generate && npx prisma migrate deploy && npm run build"
```

### Runtime Error: "PrismaClient is unable to run in an edge runtime"

Vercel Functions use Node.js runtime (not Edge), so this shouldn't happen. If it does, add to `vercel.json`:

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Database Connection Issues

Make sure environment variables are set:
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

These are automatically added when you create Vercel Postgres.

### Migrations Don't Run

Check build logs in Vercel Dashboard → Deployments → View Logs

Make sure migration files exist in `prisma/migrations/`

If migrations are missing, run locally first:

```bash
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add migration files"
git push
```

### Seed Endpoint Returns "No beneficiaries data found"

Make sure `BENEFICIARIES_DATA` environment variable is set correctly in Vercel Dashboard → Settings → Environment Variables.

The value should be a valid JSON array (single line, no line breaks).

---

## 💰 Costs

**Vercel Free (Hobby) Plan includes**:
- Unlimited deployments
- 100 GB bandwidth
- Serverless Functions
- PostgreSQL database (256 MB storage)

**If you exceed free tier**:
- Vercel Pro: $20/month
- PostgreSQL overages: ~$0.02/GB

For 41 beneficiaries with names and phone numbers, you'll use <1MB of database storage.

---

## 🎉 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Verify frontend can fetch beneficiary data
3. ✅ Add custom domain (optional)
4. ⬜ Add authentication for admin operations
5. ⬜ Setup monitoring (Vercel Analytics)
6. ⬜ Add error tracking (Sentry)
7. ⬜ Create admin panel for managing beneficiaries
8. ⬜ Backup database regularly

---

## 📝 Summary

Your backend is now deployed to Vercel as serverless functions with:
- ✅ PostgreSQL database (Vercel Postgres)
- ✅ Automatic deployments from GitHub
- ✅ Secure environment variables for sensitive data
- ✅ Zero-downtime deployments
- ✅ Global CDN for fast response times
- ✅ Free SSL certificate

**Your API URL**: `https://your-project.vercel.app`

**Admin Dashboard**: https://vercel.com/dashboard

**Database Dashboard**: Vercel Dashboard → Storage → Your Database
