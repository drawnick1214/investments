-- 004_entry_mode.sql
-- Adds entry_mode column to portfolio_config
-- Allows shares-based instruments to be tracked by invested value instead of volume
-- 'shares' = traditional shares × avg_cost (default)
-- 'value'  = invested amount + current value (like funds/plans)

ALTER TABLE portfolio_config ADD COLUMN entry_mode TEXT DEFAULT 'shares';

-- Backfill: plans and funds already use value-based entry
UPDATE portfolio_config SET entry_mode = 'value' WHERE instrument_type IN ('plan', 'fund');
UPDATE portfolio_config SET entry_mode = 'value' WHERE category = 'savings';
