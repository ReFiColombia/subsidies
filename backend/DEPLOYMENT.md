# Production Deployment Guide

This guide explains how to deploy the backend to production while keeping sensitive beneficiary data secure.

## Security Approach

The seed data is **not stored in Git**. Instead, it's loaded from:
1. **Development**: Local `prisma/beneficiaries.json` file (gitignored)
2. **Production**: `BENEFICIARIES_DATA` environment variable

This ensures sensitive beneficiary information (names, phone numbers) is never exposed in your GitHub repository.

---

## Option 1: Deploy to Railway (Recommended)

Railway provides easy PostgreSQL database and deployment.

### Step 1: Prepare Your Repository

```bash
# Ensure beneficiaries.json is gitignored
git status  # Should NOT show prisma/beneficiaries.json

# Commit and push your code
git add .
git commit -m "Add backend with secure seed approach"
git push origin master
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database and set `DATABASE_URL` automatically

### Step 4: Set Environment Variables

In Railway, go to your service → Variables tab and add:

```bash
# Database (already set automatically)
DATABASE_URL=postgresql://...

# Port (already set automatically)
PORT=3001

# Beneficiaries data (you need to add this)
BENEFICIARIES_DATA='[{"name":"Luz Elena","address":"0xf01365c382f29861ec27e2ad332f0b94171f7f93","responsable":"Ana","phoneNumber":null},{"name":"Rosiris De Angel","address":"0xa1fa3a33e97b7d7dc9c3f41efd62d062edec55bc","responsable":"Juan","phoneNumber":"321 6973247"}...]'
```

**To get the BENEFICIARIES_DATA value:**

```bash
# On your local machine, copy the file contents
cat backend/prisma/beneficiaries.json | jq -c .
# Copy the output and paste it into Railway's BENEFICIARIES_DATA variable
```

### Step 5: Update Prisma Schema for PostgreSQL

Railway will use PostgreSQL, so update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from sqlite
  url      = env("DATABASE_URL")
}
```

Commit this change:

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

### Step 6: Run Migrations and Seed

In Railway, go to your service → Settings → Deploy:

1. **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
2. **Start Command**: `npm run build && npm run start`

Or run manually via Railway CLI:

```bash
railway run npx prisma migrate deploy
railway run npm run seed
```

### Step 7: Update Frontend

Update `frontend/.env`:

```bash
VITE_API_URL=https://your-app.railway.app
```

---

## Option 2: Deploy to Render

### Step 1: Create New Web Service

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repository
4. Select `backend` directory as root

### Step 2: Configure Service

```yaml
Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
Start Command: npm run start
```

### Step 3: Add PostgreSQL Database

1. In Render Dashboard, New → PostgreSQL
2. Copy the **Internal Database URL**
3. In your web service, add environment variable:
   - `DATABASE_URL` = (paste internal database URL)

### Step 4: Add Environment Variables

```bash
DATABASE_URL=(from step 3)
PORT=3001
BENEFICIARIES_DATA='[...]'  # Paste your beneficiaries JSON here
```

### Step 5: Deploy

Render will automatically deploy. Then run seed:

```bash
# Via Render Shell
npm run seed
```

---

## Option 3: Deploy to Vercel (Serverless)

For serverless deployment, you'll need to adapt the Express app to Vercel's serverless functions format.

1. Install Vercel CLI: `npm i -g vercel`
2. Add `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "BENEFICIARIES_DATA": "@beneficiaries-data"
  }
}
```

3. Add secrets:

```bash
vercel secrets add database-url "postgresql://..."
vercel secrets add beneficiaries-data "$(cat prisma/beneficiaries.json | jq -c .)"
```

4. Deploy:

```bash
vercel --prod
```

---

## Option 4: Manual VPS Deployment

For deploying to your own server (DigitalOcean, AWS EC2, etc.):

### Step 1: SSH into your server

```bash
ssh user@your-server.com
```

### Step 2: Install dependencies

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

### Step 3: Create database

```bash
sudo -u postgres psql
CREATE DATABASE subsidies;
CREATE USER subsidies_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE subsidies TO subsidies_user;
\q
```

### Step 4: Clone and setup

```bash
git clone https://github.com/yourusername/subsidies.git
cd subsidies/backend
npm install
```

### Step 5: Create .env file

```bash
cat > .env << EOF
DATABASE_URL="postgresql://subsidies_user:your_secure_password@localhost:5432/subsidies"
PORT=3001
EOF
```

### Step 6: Upload beneficiaries data

On your **local machine**, copy the data to the server:

```bash
scp backend/prisma/beneficiaries.json user@your-server.com:~/subsidies/backend/prisma/
```

### Step 7: Run migrations and seed

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### Step 8: Start with PM2

```bash
# Install PM2
npm install -g pm2

# Build and start
npm run build
pm2 start dist/index.js --name subsidies-api

# Save PM2 config and setup startup
pm2 save
pm2 startup
```

### Step 9: Setup Nginx reverse proxy

```bash
sudo apt-get install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/subsidies
```

```nginx
server {
    listen 80;
    server_name api.yourdom ain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/subsidies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Setup SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Security Best Practices

### 1. Never Commit Sensitive Data

- ✅ `beneficiaries.json` is in `.gitignore`
- ✅ `.env` is in `.gitignore`
- ❌ Never commit phone numbers or names to Git

### 2. Secure Environment Variables

- Use your platform's secret management (Railway Secrets, Render Env Vars, etc.)
- Never log sensitive environment variables
- Rotate secrets regularly

### 3. Database Security

- Use strong passwords
- Enable SSL for database connections
- Restrict database access to your backend only
- Regular backups

### 4. API Security (Future Enhancements)

Consider adding:
- Authentication (JWT tokens)
- Rate limiting
- CORS restrictions to your frontend domain only
- Input validation and sanitization
- API keys for admin operations

---

## Updating Beneficiary Data in Production

### Option 1: Update via Environment Variable

```bash
# In Railway/Render dashboard
# Update BENEFICIARIES_DATA with new JSON
# Redeploy or run: railway run npm run seed
```

### Option 2: Direct Database Access

```bash
# Via Prisma Studio (Railway/Render)
npx prisma studio

# Or via SQL
psql $DATABASE_URL
INSERT INTO "Beneficiary" (id, address, name, "phoneNumber", responsable)
VALUES (gen_random_uuid(), '0x...', 'Name', '123456', 'Person');
```

### Option 3: Create Admin API Endpoint

Add CRUD endpoints with authentication for managing beneficiaries through a secure admin panel.

---

## Monitoring and Maintenance

### Health Checks

Your API has a health endpoint at `/health`:

```bash
curl https://your-api.railway.app/health
# Response: {"status":"ok","timestamp":"2024-..."}
```

### Logs

- **Railway**: View in Dashboard → Deployments → Logs
- **Render**: View in Dashboard → Logs tab
- **VPS**: `pm2 logs subsidies-api`

### Database Backups

- **Railway**: Automatic daily backups
- **Render**: Automatic backups (paid plans)
- **VPS**: Setup cron job:

```bash
# Add to crontab (crontab -e)
0 2 * * * pg_dump subsidies > /backup/subsidies-$(date +\%Y\%m\%d).sql
```

---

## Testing Production Deployment

```bash
# Test health endpoint
curl https://your-api-url.com/health

# Test get all beneficiaries
curl https://your-api-url.com/api/beneficiaries

# Test get specific beneficiary
curl https://your-api-url.com/api/beneficiaries/0xf01365c382f29861ec27e2ad332f0b94171f7f93
```

Expected response:
```json
{
  "id": "...",
  "address": "0xf01365c382f29861ec27e2ad332f0b94171f7f93",
  "name": "Luz Elena",
  "phoneNumber": null,
  "responsable": "Ana",
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

---

## Troubleshooting

### "No beneficiaries data found" error

- Ensure `BENEFICIARIES_DATA` env var is set correctly
- Or ensure `beneficiaries.json` file exists (for VPS)
- Check that JSON is valid: `echo $BENEFICIARIES_DATA | jq .`

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check database is running
- Verify firewall allows connections

### Prisma migration errors

- Run: `npx prisma migrate deploy` (not `npx prisma migrate dev`)
- Ensure database is PostgreSQL, not SQLite
- Check Prisma schema matches database

---

## Cost Estimates

- **Railway**: $5/month (Hobby plan) - Includes PostgreSQL
- **Render**: Free tier available (spins down after inactivity)
- **Vercel**: Free for hobby projects
- **VPS** (DigitalOcean): $6/month for basic droplet

---

## Next Steps After Deployment

1. Update frontend `.env` with production API URL
2. Deploy frontend to Vercel/Netlify
3. Setup custom domain (optional)
4. Add authentication for admin operations
5. Setup monitoring (Sentry, LogRocket, etc.)
6. Configure CORS to only allow your frontend domain
