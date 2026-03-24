DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'investor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE publish_status AS ENUM ('running', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE cashflow_event_type AS ENUM ('subscription', 'redemption', 'deposit', 'withdrawal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS investors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  investor_id TEXT REFERENCES investors(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_credentials (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investor_account_mappings (
  investor_id TEXT PRIMARY KEY REFERENCES investors(id) ON DELETE CASCADE,
  distribution_account_id TEXT NOT NULL,
  fund_asset_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS published_versions (
  id TEXT PRIMARY KEY,
  master_snapshot_filename TEXT NOT NULL,
  distribution_snapshot_filename TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS published_versions_one_current_idx
  ON published_versions ((1))
  WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS publish_runs (
  id TEXT PRIMARY KEY,
  status publish_status NOT NULL,
  published_version_id TEXT REFERENCES published_versions(id) ON DELETE SET NULL,
  master_snapshot_filename TEXT,
  distribution_snapshot_filename TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fund_operation_events (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  source_activity_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  symbol TEXT,
  asset_name TEXT,
  unit_price NUMERIC(24, 8),
  fee NUMERIC(24, 8),
  currency TEXT NOT NULL,
  account_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS investor_cashflow_events (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  source_activity_id TEXT NOT NULL,
  event_type cashflow_event_type NOT NULL,
  occurred_at TEXT NOT NULL,
  amount NUMERIC(24, 8),
  currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS investor_position_snapshots (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  distribution_account_id TEXT NOT NULL,
  fund_asset_id TEXT NOT NULL,
  latest_nav NUMERIC(24, 8) NOT NULL,
  latest_unit_price NUMERIC(24, 8) NOT NULL,
  units_held NUMERIC(24, 8) NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS investor_performance_snapshots (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  nav NUMERIC(24, 8) NOT NULL
);

CREATE TABLE IF NOT EXISTS unit_price_snapshots (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  fund_asset_id TEXT NOT NULL,
  quote_day DATE NOT NULL,
  unit_price NUMERIC(24, 8) NOT NULL
);
