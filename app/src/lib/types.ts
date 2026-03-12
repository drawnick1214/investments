export type InstrumentType = 'stock' | 'cfd' | 'etf' | 'etn' | 'etc' | 'forex' | 'fund' | 'plan';

export type EntryMode = 'shares' | 'value';

export interface YahooSearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  quoteType: string;
  exchange: string;
}

export interface InstrumentEntry {
  id: string;
  asset: string;
  ticker: string | null;
  instrument_type: InstrumentType;
  entry_mode: EntryMode;
  platform: string;
  currency: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  invested: number;
}

export interface SavingsEntry {
  id: string;
  bank: string;
  product_type: string;
  name: string;
  balance_cop: number;
  rate_ea: number;
  term: string | null;
  maturity_date: string | null;
}

export interface PortfolioConfig {
  id: string;
  category: string;
  asset: string;
  ticker: string | null;
  platform: string;
  currency: string;
  asset_type: string;
  instrument_type: InstrumentType | null;
  entry_mode: EntryMode | null;
  bank: string | null;
  shares: number | null;
  avg_cost: number | null;
  invested: number | null;
  rate_ea: number | null;
  term: string | null;
  maturity_date: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Snapshot {
  id: string;
  date: string;
  trm: number;
  xtb_margin: number | null;
  xtb_cash: number | null;
  trii_cash: number | null;
  total_usd: number | null;
  daily_change: number | null;
  daily_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface SnapshotPosition {
  id?: string;
  snapshot_date: string;
  platform: string;
  asset: string;
  asset_type: string;
  instrument_type?: string | null;
  ticker?: string | null;
  invested?: number | null;
  currency: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_percent: number;
}

export interface SnapshotPlan {
  id?: string;
  snapshot_date: string;
  name: string;
  current_value: number;
  invested: number;
  pnl: number;
  pnl_percent: number;
}

export interface SnapshotSaving {
  id?: string;
  snapshot_date: string;
  name: string;
  account_type: string;
  bank?: string;
  balance_cop: number;
  rate_ea: number;
  term: string | null;
  maturity_date: string | null;
  daily_interest: number;
  monthly_interest: number;
  annual_interest: number;
}

export interface SnapshotFund {
  id?: string;
  snapshot_date: string;
  name: string;
  invested: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
}

export interface FullSnapshot {
  snapshot: Snapshot;
  positions: SnapshotPosition[];
  plans: SnapshotPlan[];
  savings: SnapshotSaving[];
  funds: SnapshotFund[];
}

export interface EntryFormData {
  date: string;
  trm: number;
  xtb_margin: number;
  xtb_cash: number;
  trii_cash: number;
  positions: {
    asset: string;
    platform: string;
    asset_type: string;
    instrument_type: InstrumentType;
    entry_mode: EntryMode;
    ticker: string | null;
    currency: string;
    shares: number;
    avg_cost: number;
    current_price: number;
    invested: number;
  }[];
  savings: {
    name: string;
    account_type: string;
    bank: string;
    balance_cop: number;
    rate_ea: number;
    term: string | null;
    maturity_date: string | null;
  }[];
}

export type Language = "es" | "en";
