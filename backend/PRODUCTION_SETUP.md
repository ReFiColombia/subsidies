# Quick Production Setup

## 🚀 Deploy to Railway (Easiest)

### 1. Push to GitHub

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add .
git commit -m "Add backend API"
git push origin master
```

### 2. Create Railway Project

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `subsidies` repository
4. Set root directory to `/backend`

### 3. Add PostgreSQL

1. Click "+ New" in your project
2. Select "Database" → "PostgreSQL"
3. Done! Railway auto-sets `DATABASE_URL`

### 4. Set Environment Variable

Copy this command and run it on your local machine to generate the environment variable value:

```bash
cat /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/backend/prisma/beneficiaries.json | jq -c .
```

This will output a single-line JSON string like:
```
[{"name":"Luz Elena","address":"0xf01365c382f29861ec27e2ad332f0b94171f7f93",...}]
```

Copy that entire output, then in Railway:

1. Go to your service → "Variables" tab
2. Click "+ New Variable"
3. Name: `BENEFICIARIES_DATA`
4. Value: (paste the JSON string you copied)
5. Click "Add"

### 5. Configure Build & Deploy

In Railway → Settings:

**Custom Build Command**:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Custom Start Command**:
```bash
npm run start
```

### 6. Run Seed (One-Time Setup)

After first deployment, go to Railway → your service → click the three dots → "Run Command":

```bash
npm run seed
```

### 7. Update Frontend

Get your Railway URL (looks like `https://subsidies-backend-production.up.railway.app`)

Update `frontend/.env`:
```bash
VITE_API_URL=https://your-railway-url.up.railway.app
```

### 8. Test It

```bash
curl https://your-railway-url.up.railway.app/health
curl https://your-railway-url.up.railway.app/api/beneficiaries
```

---

## 📋 Checklist

- [ ] `beneficiaries.json` is in `.gitignore` (already done)
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] `BENEFICIARIES_DATA` environment variable set
- [ ] Build and start commands configured
- [ ] Seed script executed
- [ ] Frontend `.env` updated with production URL
- [ ] API tested and working

---

## 🔐 Security Notes

✅ **Safe**: The `beneficiaries.json` file is gitignored and will NOT be pushed to GitHub

✅ **Safe**: Sensitive data is stored in Railway's encrypted environment variables

✅ **Safe**: Database is private and only accessible by your backend

---

## 🆘 Troubleshooting

### Can't find `jq` command?

Install it:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or manually copy the file content without jq:
cat backend/prisma/beneficiaries.json
# Copy the output (make sure it's all on one line for the env var)
```

### Seed fails with "No beneficiaries data found"

Make sure you set the `BENEFICIARIES_DATA` environment variable correctly in Railway.

### Database connection error

Railway automatically sets `DATABASE_URL` when you add PostgreSQL. If it's missing, check that the database service is linked to your web service.

---

## 💰 Cost

Railway Hobby Plan: **$5/month**
- Includes PostgreSQL database
- No credit card required for trial
- $5 free credits on signup

---

## 🔄 Updating Beneficiaries in Production

### Option 1: Update Environment Variable

1. Update `backend/prisma/beneficiaries.json` locally
2. Regenerate the JSON string:
   ```bash
   cat backend/prisma/beneficiaries.json | jq -c .
   ```
3. Update `BENEFICIARIES_DATA` in Railway
4. Redeploy
5. Run seed again

### Option 2: Use Prisma Studio

```bash
# Via Railway CLI
railway login
railway link
railway run npx prisma studio
```

Opens a GUI at `http://localhost:5555` to edit database directly.

---

## 📊 Monitoring

**View Logs**: Railway Dashboard → Deployments → Logs

**Database Access**: Railway Dashboard → PostgreSQL → Connect

**Metrics**: Railway Dashboard → Metrics tab

---

## Alternative: Deploy to Render (Free Tier)

If you prefer a free option:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Root directory: `backend`
5. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
6. Start command: `npm run start`
7. Add PostgreSQL (New → PostgreSQL)
8. Set environment variables (same as Railway)
9. Deploy!

**Note**: Free tier spins down after 15 minutes of inactivity (slower cold starts).
