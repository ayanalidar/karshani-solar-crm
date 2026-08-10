# KARSHANI ENTERPRISES — Solar CMS

## Deploy to GitLab + Cloudflare Pages

### Step 1: Push to GitLab

```bash
# Create repo at https://gitlab.com/projects/new (name: karshani-enterprises-solar-cms)
# Then push:
cd karshani-crm
git remote add gitlab https://gitlab.com/YOUR_USERNAME/karshani-enterprises-solar-cms.git
git push gitlab main
```

### Step 2: Supabase Database (required)

1. Go to https://supabase.com → New Project (free tier)
2. After creation: Settings → Database → Connection String → **URI**
3. Copy the PostgreSQL URI (looks like `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres`)

### Step 3: Cloudflare Pages

1. Go to https://dash.cloudflare.com → Workers & Pages → Create → Pages
2. Connect to GitLab → select the repo
3. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npx prisma generate && next build`
   - **Output directory:** `.next`
4. Environment variables:
   - `DATABASE_URL` = your Supabase PostgreSQL URI
   - `AUTH_SECRET` = any random string (32+ chars)
   - `NODE_VERSION` = `22`
5. Deploy

### Step 4: Seed the database

After deployment, run locally:
```bash
npm run db:push   # Creates all tables
npm run db:seed   # Inserts products, customers, admin user
```

Or run the SQL directly in Supabase SQL Editor (use `supabase-schema.sql` from the repo root).

---

## Local Development

```bash
npm install
cp .env.example .env    # Edit with your Supabase URL + AUTH_SECRET
npx prisma generate
npm run db:setup         # Create tables + seed
npm run dev              # http://localhost:3000
```

Login: PIN `0000`
