# Garbage Classic — Deployment Guide
**Total time: ~30-45 minutes. No coding required.**

---

## Step 1 — Create a Supabase account (free database)

1. Go to **supabase.com** → click "Start your project"
2. Sign up with GitHub or email
3. Click "New Project" → name it `garbage-classic` → set a password (save it) → pick the closest region → click "Create new project"
4. Wait ~2 minutes for it to spin up
5. Go to **SQL Editor** (left sidebar) → paste the entire contents of `SUPABASE_SETUP.sql` → click **Run**
6. Go to **Project Settings → API** (left sidebar)
   - Copy **Project URL** → this is your `VITE_SUPABASE_URL`
   - Copy **anon public** key → this is your `VITE_SUPABASE_ANON_KEY`
   - Save both — you'll need them in Step 3

---

## Step 2 — Create a GitHub account and upload the project

1. Go to **github.com** → sign up (free)
2. Click **"New repository"** → name it `garbage-classic` → keep it Public → click "Create repository"
3. On your computer, unzip the project folder
4. Go back to GitHub → click **"uploading an existing file"** link
5. Drag ALL the files into the upload window → click **"Commit changes"**

---

## Step 3 — Deploy on Vercel (free hosting)

1. Go to **vercel.com** → sign up with GitHub
2. Click **"Add New Project"** → import your `garbage-classic` repo
3. Before clicking Deploy, click **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL` → paste your Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` → paste your anon key from Step 1
4. Click **Deploy** → wait ~1 minute
5. Vercel gives you a free URL like `garbage-classic-abc123.vercel.app` — **share this with everyone**

---

## Step 4 (Optional) — Buy a custom domain (~$12/year)

1. Go to **namecheap.com** → search `garbageclassic.com` or similar
2. Buy it (~$10-15/year)
3. In Vercel → your project → **Settings → Domains** → add your domain
4. Follow Vercel's 2-step DNS instructions in Namecheap

---

## How scoring works on event day

- Share the URL with your 4 designated scorers (one per group)
- Anyone who opens the URL can enter scores on any tab
- Every change saves instantly and updates on everyone's screen in real time
- The Leaderboard tab shows the live overall standings at all times

---

## Need help?

Text Drew. He built this. 🗑️⛳
