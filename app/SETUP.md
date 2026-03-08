# Setup Guide

## 1. Create Database Tables

Go to your Supabase dashboard:
https://supabase.com/dashboard/project/suhcjawnmpomezfbsklj/sql/new

Copy and paste the contents of these files **in order**:

1. `supabase/migrations/001_initial_schema.sql` - Creates all tables
2. `supabase/migrations/002_seed_config.sql` - Seeds your portfolio config

Click "Run" for each one.

## 2. Run the App

```bash
cd app
npm run dev
```

Open http://localhost:3000

## 3. First Entry

1. Click the green "+" button in the bottom nav
2. Stock prices will auto-fetch from Yahoo Finance
3. TRM will auto-fetch
4. Fill in the 5 manual fields (XTB plans, margin, cash, Trii fund)
5. Confirm savings balances (pre-filled)
6. Hit Save

## 4. Daily Usage

Every night after 10pm:
1. Open the app
2. Tap "+" to create today's entry
3. Prices auto-fill, confirm/adjust
4. Type the 5 manual values from XTB and Trii apps
5. Save - done in under 3 minutes
