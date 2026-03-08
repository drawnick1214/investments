-- Seed portfolio config with current positions

-- XTB Stocks & CFDs
INSERT INTO portfolio_config (category, asset, ticker, platform, currency, asset_type, shares, avg_cost, sort_order) VALUES
  ('xtb_position', 'Nvidia',          'NVDA',  'xtb', 'USD', 'stock', 3.0000,   184.87, 1),
  ('xtb_position', 'Palantir',        'PLTR',  'xtb', 'USD', 'stock', 3.3867,   164.40, 2),
  ('xtb_position', 'Bitcoin Trust',   'IBIT',  'xtb', 'USD', 'cfd',   10.0000,  38.40,  3),
  ('xtb_position', 'Alphabet',        'GOOGL', 'xtb', 'USD', 'stock', 0.7643,   299.38, 4),
  ('xtb_position', 'Nu Holdings',     'NU',    'xtb', 'USD', 'stock', 0.8997,   16.66,  5);

-- XTB Investment Plans
INSERT INTO portfolio_config (category, asset, platform, currency, asset_type, invested, sort_order) VALUES
  ('xtb_plan', 'Investment Plan #2', 'xtb', 'USD', 'plan', 258.33, 1),
  ('xtb_plan', 'Gold',              'xtb', 'USD', 'plan', 224.45, 2);

-- Trii Stocks (BVC)
INSERT INTO portfolio_config (category, asset, ticker, platform, currency, asset_type, shares, avg_cost, sort_order) VALUES
  ('trii_stock', 'Terpel',   'TERPEL.CL', 'trii', 'COP', 'stock', 10.0000, 19680.00, 1),
  ('trii_stock', 'Cemargos', 'CEMARGOS.CL', 'trii', 'COP', 'stock', 20.0000, 12320.00, 2);

-- Trii Fund
INSERT INTO portfolio_config (category, asset, platform, currency, asset_type, invested, sort_order) VALUES
  ('trii_fund', 'Accicuenta Moderado', 'trii', 'COP', 'fund', 527050.00, 1);

-- Savings & CDTs
INSERT INTO portfolio_config (category, asset, platform, currency, asset_type, rate_ea, sort_order) VALUES
  ('savings', 'Cuenta de Ahorros', 'bank', 'COP', 'liquid', 0.0875, 1);

INSERT INTO portfolio_config (category, asset, platform, currency, asset_type, rate_ea, term, maturity_date, sort_order) VALUES
  ('savings', 'CDT #1', 'bank', 'COP', 'cdt', 0.0900, '2 meses', '2026-05-05', 2),
  ('savings', 'CDT #2', 'bank', 'COP', 'cdt', 0.0975, '5 meses', '2026-08-05', 3);
