CREATE TABLE IF NOT EXISTS published_distribution_accounts (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS published_distribution_assets (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  label TEXT NOT NULL
);
