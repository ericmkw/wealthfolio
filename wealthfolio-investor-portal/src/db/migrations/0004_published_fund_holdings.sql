CREATE TABLE IF NOT EXISTS published_fund_holdings (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  position_kind TEXT NOT NULL,
  asset_id TEXT,
  symbol TEXT,
  asset_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  latest_price NUMERIC(24, 8),
  day_change_pct NUMERIC(24, 8),
  total_return_pct NUMERIC(24, 8),
  weight_pct NUMERIC(24, 8) NOT NULL,
  sort_order INTEGER NOT NULL
);
