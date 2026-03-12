-- Add trii_cash column to snapshots table
ALTER TABLE snapshots ADD COLUMN trii_cash NUMERIC(12,2) DEFAULT 0;
