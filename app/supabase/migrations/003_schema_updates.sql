-- 003_schema_updates.sql
-- Adds instrument_type, bank columns for dynamic instrument management

-- New columns in portfolio_config
ALTER TABLE portfolio_config ADD COLUMN instrument_type TEXT;
ALTER TABLE portfolio_config ADD COLUMN bank TEXT;

-- New columns in snapshot_positions
ALTER TABLE snapshot_positions ADD COLUMN instrument_type TEXT;
ALTER TABLE snapshot_positions ADD COLUMN ticker TEXT;
ALTER TABLE snapshot_positions ADD COLUMN invested NUMERIC(14,2);

-- New column in snapshot_savings
ALTER TABLE snapshot_savings ADD COLUMN bank TEXT;

-- Change UNIQUE constraint from asset to (platform, asset)
ALTER TABLE portfolio_config DROP CONSTRAINT portfolio_config_asset_key;
ALTER TABLE portfolio_config ADD CONSTRAINT portfolio_config_platform_asset_unique UNIQUE(platform, asset);

-- Backfill existing data
UPDATE portfolio_config SET instrument_type = 'stock' WHERE asset_type = 'stock';
UPDATE portfolio_config SET instrument_type = 'cfd' WHERE asset_type = 'cfd';
UPDATE portfolio_config SET instrument_type = 'plan' WHERE category = 'xtb_plan';
UPDATE portfolio_config SET instrument_type = 'fund' WHERE category = 'trii_fund';
UPDATE portfolio_config SET instrument_type = 'savings' WHERE category = 'savings';
UPDATE snapshot_positions SET instrument_type = asset_type;

-- Indexes
CREATE INDEX idx_positions_instrument_type ON snapshot_positions(instrument_type);
CREATE INDEX idx_savings_bank ON snapshot_savings(bank);
