-- Investment Portfolio Dashboard - Initial Schema
-- Run this in Supabase SQL Editor

-- Snapshots: one row per day
CREATE TABLE snapshots (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL UNIQUE,
  trm         NUMERIC(10,2) NOT NULL,
  xtb_margin  NUMERIC(6,2),
  xtb_cash    NUMERIC(12,2) DEFAULT 0,
  total_usd   NUMERIC(12,2),
  daily_change NUMERIC(12,2),
  daily_pct   NUMERIC(6,3),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Positions: XTB stocks/CFDs + Trii stocks per day
CREATE TABLE snapshot_positions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  asset           TEXT NOT NULL,
  asset_type      TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  shares          NUMERIC(10,4),
  avg_cost        NUMERIC(12,4),
  current_price   NUMERIC(12,4),
  market_value    NUMERIC(12,2),
  pnl             NUMERIC(12,2),
  pnl_percent     NUMERIC(6,3),
  UNIQUE(snapshot_date, platform, asset)
);

-- Plans: XTB investment plans per day
CREATE TABLE snapshot_plans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  current_value   NUMERIC(12,2) NOT NULL,
  invested        NUMERIC(12,2) NOT NULL,
  pnl             NUMERIC(12,2),
  pnl_percent     NUMERIC(6,3),
  UNIQUE(snapshot_date, name)
);

-- Savings & CDTs per day
CREATE TABLE snapshot_savings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date    DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  account_type     TEXT NOT NULL,
  balance_cop      NUMERIC(14,2) NOT NULL,
  rate_ea          NUMERIC(6,4) NOT NULL,
  term             TEXT,
  maturity_date    DATE,
  daily_interest   NUMERIC(10,2),
  monthly_interest NUMERIC(12,2),
  annual_interest  NUMERIC(14,2),
  UNIQUE(snapshot_date, name)
);

-- Trii fund per day
CREATE TABLE snapshot_funds (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   DATE NOT NULL REFERENCES snapshots(date) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  invested        NUMERIC(14,2) NOT NULL,
  current_value   NUMERIC(14,2) NOT NULL,
  pnl             NUMERIC(14,2),
  pnl_percent     NUMERIC(6,3),
  UNIQUE(snapshot_date, name)
);

-- Portfolio config: static asset definitions
CREATE TABLE portfolio_config (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category      TEXT NOT NULL,
  asset         TEXT NOT NULL UNIQUE,
  ticker        TEXT,
  platform      TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  asset_type    TEXT NOT NULL,
  shares        NUMERIC(10,4),
  avg_cost      NUMERIC(12,4),
  invested      NUMERIC(14,2),
  rate_ea       NUMERIC(6,4),
  term          TEXT,
  maturity_date DATE,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast time-range queries
CREATE INDEX idx_snapshots_date ON snapshots(date DESC);
CREATE INDEX idx_positions_date ON snapshot_positions(snapshot_date DESC);
CREATE INDEX idx_plans_date ON snapshot_plans(snapshot_date DESC);
CREATE INDEX idx_savings_date ON snapshot_savings(snapshot_date DESC);
CREATE INDEX idx_funds_date ON snapshot_funds(snapshot_date DESC);

-- Disable RLS for single-user app (no auth needed)
ALTER TABLE snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_savings DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_config DISABLE ROW LEVEL SECURITY;
