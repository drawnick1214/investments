# Development Plan — Investment Portfolio Dashboard
**Version:** 1.0
**Date:** March 5, 2026
**Based on:** PRD_Investment_Tracker.md + investment_portfolio.md

---

## 1. Data Access Strategy

### What can be auto-fetched (V1 hybrid approach)

| Data Point | Source | Method | Frequency |
|------------|--------|--------|-----------|
| US Stock prices (NVDA, PLTR, GOOG, NU) | Yahoo Finance API | Free REST API, no key needed | On form open |
| Bitcoin Trust CFD (IBIT or similar) | Yahoo Finance API | By ticker symbol | On form open |
| TRM (COP/USD) | Banco de la Republica API / exchangerate-api.com | Free REST API | Daily auto |
| Savings & CDT interest | Internal calculation | Formula: `Daily = Balance x ((1 + EA)^(1/365) - 1)` | Auto on each snapshot |
| Colombian stocks (Terpel, Cemargos) | Yahoo Finance (TERPEL.CL, CEMARGOS.CL) | Try auto; fallback manual | On form open |

### What requires manual entry

| Data Point | Why | Effort |
|------------|-----|--------|
| XTB Investment Plan #2 value | Proprietary managed plan | 1 field |
| XTB Gold plan value | Proprietary managed plan | 1 field |
| Trii Accicuenta Moderado NAV | Proprietary fund | 1 field |
| Savings account balance | Only changes on deposit/withdrawal | 1 field (pre-filled from last entry) |
| CDT balances | Only changes on maturity | 2 fields (pre-filled from last entry) |
| XTB margin level % | Platform-specific | 1 field |
| XTB available cash | Platform-specific | 1 field |

**Result:** ~7 manual fields per day, rest auto-fetched or auto-calculated. Under 3 minutes.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | React-based, SSG/SSR, great DX |
| **Language** | TypeScript | Type safety for financial data |
| **Styling** | Tailwind CSS + shadcn/ui | Dark theme out of the box, mobile-first |
| **Charts** | Recharts | React-native charts, good for line/pie/donut |
| **Database** | Supabase (Postgres) | Free tier, 500MB, persistent cloud storage, REST API auto-generated |
| **PWA** | next-pwa | Offline support, installable on phone |
| **Data fetching** | Server actions / API routes | Proxy Yahoo Finance calls to avoid CORS |
| **Export** | Papa Parse | CSV export/import |
| **Deployment** | Vercel (free tier) | Zero-config Next.js hosting |

### Why Supabase?
Daily investment snapshots are valuable historical data — you can't risk losing them to a browser reset or device change. Supabase gives us:
- **Postgres database** on a free tier (500MB = years of daily snapshots)
- **Auto-generated REST API** — no backend code needed, just query from the frontend via `@supabase/supabase-js`
- **Row-level security (RLS)** — lock data to your user with a simple auth policy
- **Multi-device access** — check your portfolio from phone, laptop, or tablet
- **Built-in auth** — simple email/password or magic link, keeps your data private
- **Automatic backups** — Supabase handles Postgres backups on the free tier
- **SQL power** — complex queries for weekly/monthly/YTD aggregations run server-side, not in the browser

### Data flow
```
[User enters data] --> [Next.js app] --> [Supabase Postgres]
                                    --> [Yahoo Finance API for prices]
                                    --> [TRM API for exchange rate]

[User opens dashboard] --> [Next.js app] <-- [Supabase: fetch snapshots]
                                         <-- [Calculate aggregations]
```

### Supabase free tier limits (more than enough)
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- 500,000 edge function invocations
- Unlimited API requests

---

## 3. Data Model (Supabase Postgres Tables)

### Table: `snapshots` (one row per day)
```sql
CREATE TABLE snapshots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date          DATE NOT NULL UNIQUE,        -- one snapshot per day
  trm           NUMERIC(10,2) NOT NULL,      -- COP/USD exchange rate
  xtb_margin    NUMERIC(6,2),                -- margin level %
  xtb_cash      NUMERIC(12,2) DEFAULT 0,     -- available cash USD
  total_usd     NUMERIC(12,2),               -- consolidated total (calculated on save)
  daily_change  NUMERIC(12,2),               -- vs previous day
  daily_pct     NUMERIC(6,3),                -- % change vs previous day
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### Table: `snapshot_positions` (XTB + Trii stock entries per day)
```sql
CREATE TABLE snapshot_positions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  platform        TEXT NOT NULL,              -- 'xtb' | 'trii'
  asset           TEXT NOT NULL,              -- 'NVDA', 'Terpel', etc.
  asset_type      TEXT NOT NULL,              -- 'stock' | 'cfd' | 'fund'
  currency        TEXT NOT NULL DEFAULT 'USD',-- 'USD' | 'COP'
  shares          NUMERIC(10,4),
  avg_cost        NUMERIC(12,4),             -- per share
  current_price   NUMERIC(12,4),             -- closing price that day
  market_value    NUMERIC(12,2),             -- shares * current_price
  pnl             NUMERIC(12,2),             -- market_value - (shares * avg_cost)
  pnl_percent     NUMERIC(6,3),
  UNIQUE(snapshot_date, platform, asset)
);
```

### Table: `snapshot_plans` (XTB investment plans per day)
```sql
CREATE TABLE snapshot_plans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  name            TEXT NOT NULL,              -- 'Investment Plan #2', 'Gold'
  current_value   NUMERIC(12,2) NOT NULL,    -- USD (manual entry)
  invested        NUMERIC(12,2) NOT NULL,    -- USD (baseline)
  pnl             NUMERIC(12,2),
  pnl_percent     NUMERIC(6,3),
  UNIQUE(snapshot_date, name)
);
```

### Table: `snapshot_savings` (savings & CDT entries per day)
```sql
CREATE TABLE snapshot_savings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date    DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  name             TEXT NOT NULL,             -- 'Savings Account', 'CDT #1', 'CDT #2'
  account_type     TEXT NOT NULL,             -- 'liquid' | 'cdt'
  balance_cop      NUMERIC(14,2) NOT NULL,
  rate_ea          NUMERIC(6,4) NOT NULL,    -- e.g. 0.0875
  term             TEXT,                      -- e.g. '2 months'
  maturity_date    DATE,
  daily_interest   NUMERIC(10,2),            -- auto-calculated
  monthly_interest NUMERIC(12,2),
  annual_interest  NUMERIC(14,2),
  UNIQUE(snapshot_date, name)
);
```

### Table: `portfolio_config` (static config, rarely changes)
```sql
CREATE TABLE portfolio_config (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category    TEXT NOT NULL,                 -- 'xtb_position' | 'xtb_plan' | 'trii_stock' | 'trii_fund' | 'savings'
  asset       TEXT NOT NULL UNIQUE,
  ticker      TEXT,                          -- Yahoo Finance ticker for auto-fetch
  platform    TEXT NOT NULL,                 -- 'xtb' | 'trii' | 'bank'
  currency    TEXT NOT NULL DEFAULT 'USD',
  asset_type  TEXT NOT NULL,                 -- 'stock' | 'cfd' | 'fund' | 'plan' | 'liquid' | 'cdt'
  shares      NUMERIC(10,4),                -- current holding (updated when you buy/sell)
  avg_cost    NUMERIC(12,4),                -- avg buy price
  rate_ea     NUMERIC(6,4),                 -- for savings/CDTs
  term        TEXT,
  maturity_date DATE,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Why normalized tables instead of one big JSON?
- **SQL aggregations:** `SELECT AVG(total_usd) FROM snapshots WHERE date >= now() - interval '30 days'` — weekly, monthly, YTD metrics are trivial
- **Data integrity:** Foreign keys prevent orphan records; UNIQUE constraints prevent duplicate entries
- **Flexibility:** Adding a new asset = one INSERT into `portfolio_config`; no schema change needed
- **Performance:** Indexes on `date` make time-range queries instant even with years of data
- **Export:** `COPY TO CSV` or query + Papa Parse — both work great

---

## 4. Development Phases

### Phase 1 — Foundation (Day 1-2)
**Goal:** Project scaffold, Supabase setup, data layer, and basic entry form.

| Task | Details |
|------|---------|
| 1.1 | Initialize Next.js project with TypeScript, Tailwind, shadcn/ui |
| 1.2 | Configure dark theme as default |
| 1.3 | Create Supabase project (free tier) and configure environment variables |
| 1.4 | Create all database tables (snapshots, snapshot_positions, snapshot_plans, snapshot_savings, portfolio_config) |
| 1.5 | Enable Row-Level Security (RLS) + set up simple email auth |
| 1.6 | Seed `portfolio_config` with your current positions, shares, avg costs, rates |
| 1.7 | Install `@supabase/supabase-js` and create the Supabase client helper |
| 1.8 | Build the Daily Entry Form — all sections (XTB, Trii, Savings) |
| 1.9 | Implement save/edit snapshot logic (INSERT/UPSERT to Supabase) |
| 1.10 | Add validation (no empty/zero fields) |

**Deliverable:** You can open the app, fill in today's numbers, and save them to Supabase Postgres.

---

### Phase 2 — Auto-Fetch & Calculations (Day 3-4)
**Goal:** Reduce manual effort with API integrations and auto-calculations.

| Task | Details |
|------|---------|
| 2.1 | Create API route to fetch US stock prices from Yahoo Finance |
| 2.2 | Create API route to fetch TRM from Banco de la Republica or fallback API |
| 2.3 | Try fetching Colombian stocks (Terpel, Cemargos) — implement fallback to manual |
| 2.4 | Auto-populate price fields in the entry form when opened |
| 2.5 | Implement interest auto-calculation for savings/CDTs |
| 2.6 | Auto-calculate all derived fields (marketValue, pnl, totals, USD conversions) |
| 2.7 | Pre-fill form with yesterday's data for fields that rarely change |

**Deliverable:** Opening the form auto-fills ~60% of fields. User confirms and fills the rest.

---

### Phase 3 — Dashboard & Visualization (Day 5-7)
**Goal:** Build the main dashboard and chart views.

| Task | Details |
|------|---------|
| 3.1 | Build Dashboard layout — hero total, daily change, platform breakdown strip |
| 3.2 | Implement Portfolio Timeline chart (Recharts line chart) with 7d/30d/All filters |
| 3.3 | Build Asset Allocation donut chart |
| 3.4 | Build bottom navigation bar (Dashboard / Assets / History / Entry FAB) |
| 3.5 | Build XTB Detail View — positions table, margin level indicator, plans |
| 3.6 | Build Trii Detail View — stocks, fund, COP + USD values |
| 3.7 | Build Savings & CDT View — interest calculations, maturity countdown |

**Deliverable:** Full dashboard with all visualizations working from stored snapshots.

---

### Phase 4 — History, Export & Polish (Day 8-9)
**Goal:** Complete feature set and polish for daily use.

| Task | Details |
|------|---------|
| 4.1 | Build Snapshot History Log — list, edit, delete |
| 4.2 | Implement CSV export (all snapshots) |
| 4.3 | Implement CSV import (restore from backup) |
| 4.4 | Add COP/USD toggle on dashboard |
| 4.5 | Add "No entry for today" banner logic |
| 4.6 | Mobile responsive polish — test at 375px width |
| 4.7 | PWA setup — service worker, manifest, offline support |

**Deliverable:** Fully functional app matching all PRD acceptance criteria.

---

### Phase 5 — Deploy & Daily Use (Day 10)
**Goal:** Ship it and start using it.

| Task | Details |
|------|---------|
| 5.1 | Deploy to Vercel |
| 5.2 | Test on mobile (install as PWA) |
| 5.3 | Enter first real snapshot with live data |
| 5.4 | Verify all calculations match manual spreadsheet |
| 5.5 | Document how to add/remove assets in the config |

**Deliverable:** Live app, first snapshot recorded, ready for daily use.

---

## 5. API Integration Details

### Yahoo Finance (Stock Prices)
```
GET https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?interval=1d&range=1d
```
- Tickers: NVDA, PLTR, GOOGL, NU, IBIT (Bitcoin Trust ETF)
- Colombian: TERPEL.CL, CEMARGOS.CL (may need verification)
- No API key required
- Proxied through Next.js API route to avoid CORS

### TRM (Exchange Rate)
```
Primary:   https://www.datos.gov.co/api/views/ceyp-9c7c/rows.json (Colombian gov open data)
Fallback:  https://api.exchangerate-api.com/v4/latest/USD
```
- Free, no key needed
- Cache daily (rate changes once per day)

### Interest Calculation (Local)
```
dailyRate = (1 + rateEA) ^ (1/365) - 1
dailyInterest = balance * dailyRate
monthlyInterest = dailyInterest * 30
annualInterest = balance * rateEA
```

---

## 6. File Structure

```
dashboard_investments/
  src/
    app/
      layout.tsx            # Root layout, dark theme, bottom nav
      page.tsx              # Dashboard (main view)
      entry/page.tsx        # Daily entry form
      assets/page.tsx       # Asset detail views (XTB, Trii, Savings tabs)
      history/page.tsx      # Snapshot history log
      api/
        stocks/route.ts     # Yahoo Finance proxy
        trm/route.ts        # TRM fetch proxy
    components/
      dashboard/
        HeroTotal.tsx
        DailyChange.tsx
        PlatformBreakdown.tsx
        TimelineChart.tsx
        AllocationDonut.tsx
      entry/
        EntryForm.tsx
        XtbSection.tsx
        TriiSection.tsx
        SavingsSection.tsx
      assets/
        XtbDetail.tsx
        TriiDetail.tsx
        SavingsDetail.tsx
        MarginIndicator.tsx
        CdtCountdown.tsx
      history/
        SnapshotList.tsx
        ExportButton.tsx
        ImportButton.tsx
      ui/                   # shadcn/ui components
      BottomNav.tsx
      CurrencyToggle.tsx
    lib/
      supabase/
        client.ts           # Supabase browser client
        server.ts           # Supabase server client (for API routes)
        types.ts            # Auto-generated DB types (npx supabase gen types)
      calculations.ts       # Interest, P&L, totals
      api-clients.ts        # Yahoo Finance, TRM fetchers
      csv.ts                # Export/import logic
      types.ts              # TypeScript interfaces
      config.ts             # Portfolio config (positions, shares, etc.)
    hooks/
      useSnapshot.ts        # CRUD operations for snapshots (via Supabase)
      usePortfolio.ts       # Derived portfolio calculations
      usePrices.ts          # Auto-fetch stock prices
```

---

## 7. Maintainability Considerations

### Adding/Removing Assets
- All assets are defined in `config.ts`. To add a new stock, add one entry to the array. The form, calculations, and views all derive from this config dynamically.

### Adding a New Platform
- Add a new section to the Snapshot interface, a new form section component, and a new detail view tab. The dashboard auto-includes any new section in totals.

### Changing Interest Rates
- Update `rateEA` in config. All calculations use the config value, so historical snapshots keep their original rate while new ones use the updated rate.

### Data Safety
- All data lives in Supabase Postgres with automatic backups.
- CSV export available as secondary backup.
- Multi-device access works out of the box — same account, any browser.

---

## 8. Acceptance Checklist (from PRD)

- [ ] User can enter a daily snapshot in under 5 minutes
- [ ] Dashboard shows total portfolio in USD with correct daily change
- [ ] All 3 platforms (XTB, Trii, Savings) are tracked and displayed
- [ ] Interest is auto-calculated for all savings/CDT accounts
- [ ] XTB margin level is always visible with appropriate alert color
- [ ] Timeline chart displays portfolio value history
- [ ] COP values are shown with correct TRM conversion
- [ ] All data persists in Supabase — accessible from any device
- [ ] User can export all data to CSV
- [ ] App is fully usable on a mobile screen (375px wide minimum)
- [ ] No snapshot data is ever lost silently
- [ ] Auto-fetch works for US stocks and TRM
- [ ] Form pre-fills with yesterday's data and auto-fetched prices

---

## 9. Risk & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Yahoo Finance API changes/blocks | Can't auto-fetch prices | Graceful fallback to manual entry; all fields remain editable |
| Colombian stock tickers unavailable | Must enter Terpel/Cemargos manually | Manual fallback already in form; try alternative data sources |
| Supabase free tier limits | 500MB cap on DB | Daily snapshots are tiny (~2KB each); 500MB = decades of data |
| TRM API downtime | Can't auto-fetch rate | Cache last known rate; user can always override manually |
| XTB adds/removes positions | Form doesn't match portfolio | Config-driven design makes adding/removing assets trivial |

---

## 10. Supabase — Powerful Queries for Analytics

With Postgres, the time-based analytics the PRD requires become trivial SQL:

```sql
-- Daily change vs yesterday
SELECT date, total_usd,
  total_usd - LAG(total_usd) OVER (ORDER BY date) AS daily_change
FROM snapshots ORDER BY date DESC LIMIT 30;

-- Weekly average portfolio value
SELECT date_trunc('week', date) AS week, AVG(total_usd) AS avg_value
FROM snapshots GROUP BY week ORDER BY week;

-- Monthly P&L
SELECT date_trunc('month', date) AS month,
  MAX(total_usd) - MIN(total_usd) AS monthly_change
FROM snapshots GROUP BY month ORDER BY month;

-- Best and worst days
SELECT date, daily_change, daily_pct
FROM snapshots ORDER BY daily_change DESC LIMIT 5; -- best
SELECT date, daily_change, daily_pct
FROM snapshots ORDER BY daily_change ASC LIMIT 5;  -- worst

-- Asset performance over time (e.g., NVDA)
SELECT snapshot_date, current_price, pnl, pnl_percent
FROM snapshot_positions WHERE asset = 'NVDA' ORDER BY snapshot_date;

-- Portfolio composition on any given date
SELECT p.platform, p.asset, p.market_value,
  ROUND(p.market_value / s.total_usd * 100, 1) AS pct
FROM snapshot_positions p
JOIN snapshots s ON s.date = p.snapshot_date
WHERE p.snapshot_date = '2026-03-05'
ORDER BY p.market_value DESC;
```

These queries power the dashboard views directly — no complex frontend calculations needed.

---

*Ready to start Phase 1. Say "let's build" to begin.*
