-- 007_cash_flows.sql
-- Cash flow tracking for deposits, withdrawals, and transfers

-- Cash flows table
CREATE TABLE cash_flows (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'COP', 'EUR')),

  -- For deposits and withdrawals
  account         TEXT,  -- xtb_cash, trii_cash, savings account name, etc.

  -- For transfers
  from_account    TEXT,
  to_account      TEXT,

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Ensure either account (for deposit/withdrawal) or from/to accounts (for transfer) are set
  CONSTRAINT valid_accounts CHECK (
    (type IN ('deposit', 'withdrawal') AND account IS NOT NULL AND from_account IS NULL AND to_account IS NULL)
    OR
    (type = 'transfer' AND account IS NULL AND from_account IS NOT NULL AND to_account IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_cash_flows_date ON cash_flows(date DESC);
CREATE INDEX idx_cash_flows_type ON cash_flows(type);
CREATE INDEX idx_cash_flows_account ON cash_flows(account);

-- Disable RLS for single-user app
ALTER TABLE cash_flows DISABLE ROW LEVEL SECURITY;

-- Add currency column to portfolio_config for bank accounts
ALTER TABLE portfolio_config ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'COP';

-- Update existing savings accounts to have COP currency
UPDATE portfolio_config SET currency = 'COP' WHERE category = 'savings';
