DO $$
BEGIN
  CREATE TYPE app_locale AS ENUM ('en', 'zh-HK', 'zh-CN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE app_theme AS ENUM ('dark', 'light');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE base_currency AS ENUM ('USD', 'HKD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY,
  default_locale app_locale NOT NULL DEFAULT 'zh-HK',
  default_theme app_theme NOT NULL DEFAULT 'dark',
  default_base_currency base_currency NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (id, default_locale, default_theme, default_base_currency)
VALUES (1, 'zh-HK', 'dark', 'USD')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  locale app_locale,
  theme app_theme,
  base_currency base_currency,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_reference_snapshots (
  id TEXT PRIMARY KEY,
  published_version_id TEXT NOT NULL REFERENCES published_versions(id) ON DELETE CASCADE,
  reference_kind TEXT NOT NULL,
  reference_key TEXT NOT NULL,
  asset_id TEXT,
  label TEXT NOT NULL,
  source_currency TEXT NOT NULL,
  target_currency TEXT,
  quote_day DATE NOT NULL,
  quote_value NUMERIC(24, 8) NOT NULL
);
