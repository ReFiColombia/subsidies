# Vercel Quick Start - 10 Minute Setup

Fast track guide to deploy your backend to Vercel.

---

## ⚡ Quick Steps

### 1. Prepare Code

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies

# Verify beneficiaries.json is gitignored
git status | grep beneficiaries  # Should be empty

# Commit and push
git add .
git commit -m "Add backend with Vercel config"
git push origin master
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your `subsidies` repository
3. **Root Directory**: `backend`
4. **Framework**: Other
5. Click **Deploy** (will fail - that's expected)

### 3. Add PostgreSQL Database

1. Project Dashboard → **Storage** tab
2. **Create Database** → **Postgres**
3. Name: `beneficiaries-db`
4. Click **Create**

Vercel auto-adds these env vars:
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 4. Add Beneficiaries Data

Generate the environment variable:

```bash
cat backend/prisma/beneficiaries.json | jq -c .
```

Copy the output, then:

1. Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `BENEFICIARIES_DATA`
   - **Value**: (paste the JSON)
   - **Environments**: Check all (Production, Preview, Development)
3. Click **Save**

### 5. Add NODE_ENV

While in Environment Variables:

- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: Production only

### 6. Redeploy

1. Go to **Deployments** tab
2. Click latest deployment → three dots → **Redeploy**
3. **Use existing Build Cache** → **Redeploy**

Wait for build to complete (~2 minutes).

### 7. Seed Database

**Easiest Method - Direct SQL**:

1. Vercel Dashboard → **Storage** → Your Database
2. Click **Query** tab
3. Run this (repeat for each beneficiary):

```sql
INSERT INTO "Beneficiary" (id, address, name, "phoneNumber", responsable, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '0xf01365c382f29861ec27e2ad332f0b94171f7f93', 'Luz Elena', NULL, 'Ana', NOW(), NOW()),
  (gen_random_uuid(), '0xa1fa3a33e97b7d7dc9c3f41efd62d062edec55bc', 'Rosiris De Angel', '321 6973247', 'Juan', NOW(), NOW());
  -- Add more rows...
```

Or use the seed script (see full guide: VERCEL_DEPLOYMENT.md).

### 8. Test API

```bash
# Get your Vercel URL from dashboard
curl https://your-project.vercel.app/health

curl https://your-project.vercel.app/api/beneficiaries
```

### 9. Update Frontend

Update `frontend/.env`:

```
VITE_API_URL=https://your-project.vercel.app
```

Commit and push:

```bash
git add frontend/.env
git commit -m "Update API URL to production"
git push
```

### 10. Deploy Frontend

If frontend is also on Vercel, it will auto-deploy.

Otherwise, deploy it:
1. https://vercel.com/new
2. Import same repository
3. **Root Directory**: `frontend`
4. **Framework**: Vite
5. Deploy!

---

## ✅ Done!

Your backend is live at: `https://your-project.vercel.app`

**Test it**:
- Health: `https://your-project.vercel.app/health`
- API: `https://your-project.vercel.app/api/beneficiaries`

---

## 🔧 Useful Commands

### View Logs
```bash
vercel logs https://your-project.vercel.app
```

### Pull Environment Variables
```bash
cd backend
vercel env pull .env.local
```

### Rollback Deployment
Vercel Dashboard → Deployments → Previous → Promote to Production

---

## 📚 Need More Details?

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for:
- Troubleshooting
- Alternative seed methods
- Database management
- Security configuration
- Monitoring setup

---

## ⚠️ Important Notes

1. **Database**: Vercel Postgres is PostgreSQL, not SQLite
2. **Migrations**: Run automatically via `vercel-build` script
3. **Secrets**: Never commit `beneficiaries.json` to Git
4. **Free Tier**: Includes 256MB database (enough for 1000s of beneficiaries)
5. **Auto-deploy**: Every `git push` triggers a new deployment

---

## 🚨 Common Issues

**Build fails**: Check that `vercel-build` script exists in package.json

**"No beneficiaries data found"**: Make sure `BENEFICIARIES_DATA` env var is set

**Database connection error**: Vercel Postgres env vars should be auto-set. If missing, recreate the database link.

**CORS error**: Add frontend URL to CORS config in `src/index.ts`

---

## 💡 Pro Tips

1. **Custom Domain**: Vercel Dashboard → Settings → Domains
2. **Environment for dev/prod**: Use Preview deployments for testing
3. **Rollback**: Keep git history clean for easy rollbacks
4. **Monitor**: Enable Vercel Analytics in dashboard
5. **Logs**: Real-time logs in Vercel Dashboard → Deployments

---

**Need help?** See full documentation in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
