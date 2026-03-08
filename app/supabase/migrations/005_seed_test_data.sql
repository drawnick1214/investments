-- 005_seed_test_data.sql
-- Generates ~3 years of realistic test data (Mar 2023 → Mar 2026)
-- Run AFTER 001, 002, 003, and 004 migrations
-- WARNING: This will fail if data already exists. Run DELETE commands below first if needed.
--
-- To clear existing data before running:
--   DELETE FROM snapshot_funds;
--   DELETE FROM snapshot_savings;
--   DELETE FROM snapshot_plans;
--   DELETE FROM snapshot_positions;
--   DELETE FROM snapshots;

DO $$
DECLARE
  d DATE;
  prev_total NUMERIC := 0;

  -- XTB Stock prices (USD) — starting at realistic Mar 2023 levels
  nvda NUMERIC := 27.50;     -- post 10:1 split adjusted
  pltr NUMERIC := 0;         -- added later (Mar 2024)
  ibit NUMERIC := 0;         -- launched Jan 2024
  googl NUMERIC := 96.00;
  nu NUMERIC := 5.20;

  -- Trii Stock prices (COP)
  terpel NUMERIC := 15500;
  cemargos NUMERIC := 8900;

  -- XTB Plans (current value in USD)
  plan2_inv NUMERIC := 200.00;
  plan2_val NUMERIC := 200.00;
  gold_inv NUMERIC := 0;       -- added mid 2024
  gold_val NUMERIC := 0;

  -- Trii Fund (COP)
  fund_inv NUMERIC := 480000;
  fund_val NUMERIC := 480000;

  -- Savings (COP)
  sav_bal NUMERIC := 2000000;
  cdt1_bal NUMERIC := 0;       -- added Jun 2023
  cdt2_bal NUMERIC := 0;       -- added Jun 2024

  -- XTB account
  xtb_cash NUMERIC := 180.00;
  margin_lvl NUMERIC := 300.00;

  -- TRM
  trm_val NUMERIC;
  trm_base NUMERIC;
  days_in_seg INT;

  -- Shares (fixed quantities — match portfolio_config)
  nvda_sh NUMERIC := 3.0000;
  pltr_sh NUMERIC := 3.3867;
  ibit_sh NUMERIC := 10.0000;
  googl_sh NUMERIC := 0.7643;
  nu_sh NUMERIC := 0.8997;
  terpel_sh NUMERIC := 10.0000;
  cemargos_sh NUMERIC := 20.0000;

  -- Avg costs (purchase price) — for positions that start from day 1
  nvda_avg NUMERIC := 27.50;
  googl_avg NUMERIC := 96.00;
  nu_avg NUMERIC := 5.20;
  terpel_avg NUMERIC := 15500;
  cemargos_avg NUMERIC := 8900;
  pltr_avg NUMERIC := 22.00;   -- bought in Mar 2024
  ibit_avg NUMERIC := 26.50;   -- bought at launch Jan 2024

  -- Calculated totals
  xtb_usd NUMERIC;
  trii_cop NUMERIC;
  sav_cop NUMERIC;
  total_usd NUMERIC;
  d_change NUMERIC;
  d_pct NUMERIC;

  -- Temp vars for position calculations
  mv NUMERIC;
  pnl_v NUMERIC;
  pnl_pct NUMERIC;
  inv_v NUMERIC;

  -- Interest calc helpers
  dr NUMERIC;  -- daily rate

BEGIN

FOR d IN SELECT generate_series('2023-03-01'::date, '2026-03-07'::date, '1 day')::date
LOOP
  -- Skip weekends
  IF EXTRACT(DOW FROM d) IN (0, 6) THEN CONTINUE; END IF;

  -- Skip ~15% of weekdays randomly (user doesn't enter every day)
  -- But always keep first and last few days
  IF random() < 0.15
     AND d > '2023-03-05'::date
     AND d < '2026-03-05'::date
  THEN CONTINUE; END IF;

  -- ================================================================
  -- TRM: Piecewise linear interpolation based on real COP/USD values
  -- ================================================================
  -- 2023-03-01 to 2023-06-01: 4750 → 4220
  -- 2023-06-01 to 2023-10-01: 4220 → 4050
  -- 2023-10-01 to 2024-01-01: 4050 → 3870
  -- 2024-01-01 to 2024-04-01: 3870 → 3910
  -- 2024-04-01 to 2024-07-01: 3910 → 4020
  -- 2024-07-01 to 2024-10-01: 4020 → 4180
  -- 2024-10-01 to 2025-01-01: 4180 → 4420
  -- 2025-01-01 to 2025-04-01: 4420 → 4150
  -- 2025-04-01 to 2025-07-01: 4150 → 4050
  -- 2025-07-01 to 2025-10-01: 4050 → 4200
  -- 2025-10-01 to 2026-01-01: 4200 → 4260
  -- 2026-01-01 to 2026-03-08: 4260 → 4310

  IF d < '2023-06-01' THEN
    days_in_seg := '2023-06-01'::date - '2023-03-01'::date;
    trm_base := 4750 + (4220 - 4750) * (d - '2023-03-01'::date)::numeric / days_in_seg;
  ELSIF d < '2023-10-01' THEN
    days_in_seg := '2023-10-01'::date - '2023-06-01'::date;
    trm_base := 4220 + (4050 - 4220) * (d - '2023-06-01'::date)::numeric / days_in_seg;
  ELSIF d < '2024-01-01' THEN
    days_in_seg := '2024-01-01'::date - '2023-10-01'::date;
    trm_base := 4050 + (3870 - 4050) * (d - '2023-10-01'::date)::numeric / days_in_seg;
  ELSIF d < '2024-04-01' THEN
    days_in_seg := '2024-04-01'::date - '2024-01-01'::date;
    trm_base := 3870 + (3910 - 3870) * (d - '2024-01-01'::date)::numeric / days_in_seg;
  ELSIF d < '2024-07-01' THEN
    days_in_seg := '2024-07-01'::date - '2024-04-01'::date;
    trm_base := 3910 + (4020 - 3910) * (d - '2024-04-01'::date)::numeric / days_in_seg;
  ELSIF d < '2024-10-01' THEN
    days_in_seg := '2024-10-01'::date - '2024-07-01'::date;
    trm_base := 4020 + (4180 - 4020) * (d - '2024-07-01'::date)::numeric / days_in_seg;
  ELSIF d < '2025-01-01' THEN
    days_in_seg := '2025-01-01'::date - '2024-10-01'::date;
    trm_base := 4180 + (4420 - 4180) * (d - '2024-10-01'::date)::numeric / days_in_seg;
  ELSIF d < '2025-04-01' THEN
    days_in_seg := '2025-04-01'::date - '2025-01-01'::date;
    trm_base := 4420 + (4150 - 4420) * (d - '2025-01-01'::date)::numeric / days_in_seg;
  ELSIF d < '2025-07-01' THEN
    days_in_seg := '2025-07-01'::date - '2025-04-01'::date;
    trm_base := 4150 + (4050 - 4150) * (d - '2025-04-01'::date)::numeric / days_in_seg;
  ELSIF d < '2025-10-01' THEN
    days_in_seg := '2025-10-01'::date - '2025-07-01'::date;
    trm_base := 4050 + (4200 - 4050) * (d - '2025-07-01'::date)::numeric / days_in_seg;
  ELSIF d < '2026-01-01' THEN
    days_in_seg := '2026-01-01'::date - '2025-10-01'::date;
    trm_base := 4200 + (4260 - 4200) * (d - '2025-10-01'::date)::numeric / days_in_seg;
  ELSE
    days_in_seg := '2026-03-08'::date - '2026-01-01'::date;
    trm_base := 4260 + (4310 - 4260) * (d - '2026-01-01'::date)::numeric / GREATEST(days_in_seg, 1);
  END IF;

  trm_val := ROUND((trm_base + (random() - 0.5) * 50)::NUMERIC, 2);

  -- ================================================================
  -- STOCK PRICES — random walk with drift + clamps
  -- ================================================================

  -- NVDA: $27.50 → ~$130 over 3 years (huge AI rally)
  nvda := nvda * (1 + 0.0017 + (random() - 0.5) * 0.04);
  nvda := GREATEST(nvda, 18);
  nvda := LEAST(nvda, 165);

  -- GOOGL: $96 → ~$170
  googl := googl * (1 + 0.0006 + (random() - 0.5) * 0.025);
  googl := GREATEST(googl, 75);
  googl := LEAST(googl, 210);

  -- NU: $5.20 → ~$12
  nu := nu * (1 + 0.0009 + (random() - 0.5) * 0.035);
  nu := GREATEST(nu, 3);
  nu := LEAST(nu, 18);

  -- PLTR: added Mar 2024 at $22, rallies to ~$90
  IF d >= '2024-03-01'::date THEN
    IF pltr = 0 THEN pltr := 22.00; END IF;
    pltr := pltr * (1 + 0.003 + (random() - 0.5) * 0.05);
    pltr := GREATEST(pltr, 14);
    pltr := LEAST(pltr, 110);
  END IF;

  -- IBIT: launched Jan 11 2024 at ~$26.50, grows to ~$55
  IF d >= '2024-01-11'::date THEN
    IF ibit = 0 THEN ibit := 26.50; END IF;
    ibit := ibit * (1 + 0.001 + (random() - 0.5) * 0.045);
    ibit := GREATEST(ibit, 16);
    ibit := LEAST(ibit, 70);
  END IF;

  -- Terpel (COP): $15,500 → ~$19,700
  terpel := terpel * (1 + 0.0003 + (random() - 0.5) * 0.02);
  terpel := GREATEST(terpel, 11000);
  terpel := LEAST(terpel, 26000);

  -- Cemargos (COP): $8,900 → ~$12,300
  cemargos := cemargos * (1 + 0.0004 + (random() - 0.5) * 0.025);
  cemargos := GREATEST(cemargos, 6000);
  cemargos := LEAST(cemargos, 17000);

  -- ================================================================
  -- XTB PLANS
  -- ================================================================

  -- Investment Plan #2: slow growth, periodic $50 deposits quarterly
  plan2_val := plan2_val * (1 + 0.0008 + (random() - 0.5) * 0.015);
  IF EXTRACT(DAY FROM d) BETWEEN 1 AND 3 AND EXTRACT(MONTH FROM d) IN (1,4,7,10) THEN
    plan2_inv := plan2_inv + 50;
    plan2_val := plan2_val + 50;
  END IF;

  -- Gold plan: added Jun 2024, periodic $30 deposits twice a year
  IF d >= '2024-06-01'::date THEN
    IF gold_inv = 0 THEN
      gold_inv := 180.00;
      gold_val := 180.00;
    END IF;
    gold_val := gold_val * (1 + 0.0005 + (random() - 0.5) * 0.012);
    IF EXTRACT(DAY FROM d) BETWEEN 1 AND 3 AND EXTRACT(MONTH FROM d) IN (3,9) THEN
      gold_inv := gold_inv + 30;
      gold_val := gold_val + 30;
    END IF;
  END IF;

  -- ================================================================
  -- TRII FUND
  -- ================================================================
  fund_val := fund_val * (1 + 0.0003 + (random() - 0.5) * 0.008);
  -- Quarterly $50K COP deposits
  IF EXTRACT(DAY FROM d) BETWEEN 1 AND 3 AND EXTRACT(MONTH FROM d) IN (2,5,8,11) THEN
    fund_inv := fund_inv + 50000;
    fund_val := fund_val + 50000;
  END IF;

  -- ================================================================
  -- SAVINGS (COP)
  -- ================================================================

  -- Savings account: daily interest + monthly ~$100K deposit on 1st weekday
  sav_bal := sav_bal * (1 + 0.0875 / 365.0);
  IF EXTRACT(DAY FROM d) <= 3 AND EXTRACT(DOW FROM d) = 1 THEN
    sav_bal := sav_bal + 100000;
  END IF;

  -- CDT #1: added Jun 2023, 9% EA
  IF d >= '2023-06-01'::date THEN
    IF cdt1_bal = 0 THEN cdt1_bal := 5000000; END IF;
    cdt1_bal := cdt1_bal * (1 + 0.09 / 365.0);
  END IF;

  -- CDT #2: added Jun 2024, 9.75% EA
  IF d >= '2024-06-01'::date THEN
    IF cdt2_bal = 0 THEN cdt2_bal := 3000000; END IF;
    cdt2_bal := cdt2_bal * (1 + 0.0975 / 365.0);
  END IF;

  -- ================================================================
  -- XTB CASH & MARGIN
  -- ================================================================
  xtb_cash := xtb_cash + (random() - 0.48) * 3;
  xtb_cash := GREATEST(xtb_cash, 60);
  xtb_cash := LEAST(xtb_cash, 350);

  margin_lvl := margin_lvl + (random() - 0.5) * 10;
  margin_lvl := GREATEST(margin_lvl, 115);
  margin_lvl := LEAST(margin_lvl, 450);

  -- ================================================================
  -- CALCULATE TOTAL USD
  -- ================================================================
  xtb_usd := nvda * nvda_sh
           + googl * googl_sh
           + nu * nu_sh
           + (CASE WHEN pltr > 0 THEN pltr * pltr_sh ELSE 0 END)
           + (CASE WHEN ibit > 0 THEN ibit * ibit_sh ELSE 0 END)
           + plan2_val
           + (CASE WHEN gold_val > 0 THEN gold_val ELSE 0 END)
           + xtb_cash;

  trii_cop := terpel * terpel_sh + cemargos * cemargos_sh;
  sav_cop := sav_bal + cdt1_bal + cdt2_bal;

  total_usd := xtb_usd + (trii_cop + fund_val + sav_cop) / trm_val;
  total_usd := ROUND(total_usd, 2);

  d_change := CASE WHEN prev_total > 0 THEN ROUND(total_usd - prev_total, 2) ELSE NULL END;
  d_pct := CASE WHEN prev_total > 0 AND prev_total != 0
                THEN ROUND(((total_usd - prev_total) / prev_total) * 100, 3)
                ELSE NULL END;

  -- ================================================================
  -- INSERT SNAPSHOT
  -- ================================================================
  INSERT INTO snapshots (date, trm, xtb_margin, xtb_cash, total_usd, daily_change, daily_pct)
  VALUES (d, trm_val, ROUND(margin_lvl, 2), ROUND(xtb_cash, 2), total_usd, d_change, d_pct);

  -- ================================================================
  -- INSERT POSITIONS
  -- ================================================================

  -- NVDA
  mv := ROUND(nvda * nvda_sh, 2);
  inv_v := ROUND(nvda_sh * nvda_avg, 2);
  pnl_v := mv - inv_v;
  pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
  INSERT INTO snapshot_positions
    (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
  VALUES
    (d, 'xtb', 'Nvidia', 'stock', 'stock', 'NVDA', inv_v, 'USD', nvda_sh, nvda_avg, ROUND(nvda, 4), mv, ROUND(pnl_v, 2), pnl_pct);

  -- GOOGL
  mv := ROUND(googl * googl_sh, 2);
  inv_v := ROUND(googl_sh * googl_avg, 2);
  pnl_v := mv - inv_v;
  pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
  INSERT INTO snapshot_positions
    (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
  VALUES
    (d, 'xtb', 'Alphabet', 'stock', 'stock', 'GOOGL', inv_v, 'USD', googl_sh, googl_avg, ROUND(googl, 4), mv, ROUND(pnl_v, 2), pnl_pct);

  -- NU
  mv := ROUND(nu * nu_sh, 2);
  inv_v := ROUND(nu_sh * nu_avg, 2);
  pnl_v := mv - inv_v;
  pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
  INSERT INTO snapshot_positions
    (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
  VALUES
    (d, 'xtb', 'Nu Holdings', 'stock', 'stock', 'NU', inv_v, 'USD', nu_sh, nu_avg, ROUND(nu, 4), mv, ROUND(pnl_v, 2), pnl_pct);

  -- PLTR (from Mar 2024)
  IF pltr > 0 THEN
    mv := ROUND(pltr * pltr_sh, 2);
    inv_v := ROUND(pltr_sh * pltr_avg, 2);
    pnl_v := mv - inv_v;
    pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
    INSERT INTO snapshot_positions
      (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
    VALUES
      (d, 'xtb', 'Palantir', 'stock', 'stock', 'PLTR', inv_v, 'USD', pltr_sh, pltr_avg, ROUND(pltr, 4), mv, ROUND(pnl_v, 2), pnl_pct);
  END IF;

  -- IBIT (from Jan 2024)
  IF ibit > 0 THEN
    mv := ROUND(ibit * ibit_sh, 2);
    inv_v := ROUND(ibit_sh * ibit_avg, 2);
    pnl_v := mv - inv_v;
    pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
    INSERT INTO snapshot_positions
      (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
    VALUES
      (d, 'xtb', 'Bitcoin Trust', 'cfd', 'cfd', 'IBIT', inv_v, 'USD', ibit_sh, ibit_avg, ROUND(ibit, 4), mv, ROUND(pnl_v, 2), pnl_pct);
  END IF;

  -- Terpel (Trii)
  mv := ROUND(terpel * terpel_sh, 2);
  inv_v := ROUND(terpel_sh * terpel_avg, 2);
  pnl_v := mv - inv_v;
  pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
  INSERT INTO snapshot_positions
    (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
  VALUES
    (d, 'trii', 'Terpel', 'stock', 'stock', 'TERPEL.CL', inv_v, 'COP', terpel_sh, terpel_avg, ROUND(terpel, 4), mv, ROUND(pnl_v, 2), pnl_pct);

  -- Cemargos (Trii)
  mv := ROUND(cemargos * cemargos_sh, 2);
  inv_v := ROUND(cemargos_sh * cemargos_avg, 2);
  pnl_v := mv - inv_v;
  pnl_pct := CASE WHEN inv_v != 0 THEN ROUND((pnl_v / inv_v) * 100, 3) ELSE 0 END;
  INSERT INTO snapshot_positions
    (snapshot_date, platform, asset, asset_type, instrument_type, ticker, invested, currency, shares, avg_cost, current_price, market_value, pnl, pnl_percent)
  VALUES
    (d, 'trii', 'Cemargos', 'stock', 'stock', 'CEMARGOS.CL', inv_v, 'COP', cemargos_sh, cemargos_avg, ROUND(cemargos, 4), mv, ROUND(pnl_v, 2), pnl_pct);

  -- ================================================================
  -- INSERT PLANS
  -- ================================================================
  INSERT INTO snapshot_plans (snapshot_date, name, current_value, invested, pnl, pnl_percent)
  VALUES (
    d, 'Investment Plan #2',
    ROUND(plan2_val, 2), ROUND(plan2_inv, 2),
    ROUND(plan2_val - plan2_inv, 2),
    CASE WHEN plan2_inv > 0 THEN ROUND(((plan2_val - plan2_inv) / plan2_inv) * 100, 3) ELSE 0 END
  );

  IF gold_val > 0 THEN
    INSERT INTO snapshot_plans (snapshot_date, name, current_value, invested, pnl, pnl_percent)
    VALUES (
      d, 'Gold',
      ROUND(gold_val, 2), ROUND(gold_inv, 2),
      ROUND(gold_val - gold_inv, 2),
      CASE WHEN gold_inv > 0 THEN ROUND(((gold_val - gold_inv) / gold_inv) * 100, 3) ELSE 0 END
    );
  END IF;

  -- ================================================================
  -- INSERT SAVINGS
  -- ================================================================

  -- Savings account (always present)
  dr := POWER(1 + 0.0875, 1.0/365.0) - 1;
  INSERT INTO snapshot_savings
    (snapshot_date, name, account_type, bank, balance_cop, rate_ea, term, maturity_date,
     daily_interest, monthly_interest, annual_interest)
  VALUES (
    d, 'Cuenta de Ahorros', 'liquid', 'Bancolombia',
    ROUND(sav_bal, 2), 0.0875, NULL, NULL,
    ROUND(sav_bal * dr, 2),
    ROUND(sav_bal * dr * 30, 2),
    ROUND(sav_bal * 0.0875, 2)
  );

  -- CDT #1 (from Jun 2023)
  IF cdt1_bal > 0 THEN
    dr := POWER(1 + 0.09, 1.0/365.0) - 1;
    INSERT INTO snapshot_savings
      (snapshot_date, name, account_type, bank, balance_cop, rate_ea, term, maturity_date,
       daily_interest, monthly_interest, annual_interest)
    VALUES (
      d, 'CDT #1', 'cdt', 'Bancolombia',
      ROUND(cdt1_bal, 2), 0.09, '2 meses', '2026-05-05',
      ROUND(cdt1_bal * dr, 2),
      ROUND(cdt1_bal * dr * 30, 2),
      ROUND(cdt1_bal * 0.09, 2)
    );
  END IF;

  -- CDT #2 (from Jun 2024)
  IF cdt2_bal > 0 THEN
    dr := POWER(1 + 0.0975, 1.0/365.0) - 1;
    INSERT INTO snapshot_savings
      (snapshot_date, name, account_type, bank, balance_cop, rate_ea, term, maturity_date,
       daily_interest, monthly_interest, annual_interest)
    VALUES (
      d, 'CDT #2', 'cdt', 'Davivienda',
      ROUND(cdt2_bal, 2), 0.0975, '5 meses', '2026-08-05',
      ROUND(cdt2_bal * dr, 2),
      ROUND(cdt2_bal * dr * 30, 2),
      ROUND(cdt2_bal * 0.0975, 2)
    );
  END IF;

  -- ================================================================
  -- INSERT FUND
  -- ================================================================
  INSERT INTO snapshot_funds (snapshot_date, name, invested, current_value, pnl, pnl_percent)
  VALUES (
    d, 'Accicuenta Moderado',
    ROUND(fund_inv, 2), ROUND(fund_val, 2),
    ROUND(fund_val - fund_inv, 2),
    CASE WHEN fund_inv > 0 THEN ROUND(((fund_val - fund_inv) / fund_inv) * 100, 3) ELSE 0 END
  );

  prev_total := total_usd;

END LOOP;

RAISE NOTICE 'Seed data generation complete!';

END $$;
