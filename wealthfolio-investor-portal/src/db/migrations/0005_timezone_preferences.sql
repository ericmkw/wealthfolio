ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS default_timezone TEXT;

INSERT INTO app_settings (id, default_timezone)
VALUES (1, 'Asia/Hong_Kong')
ON CONFLICT (id) DO NOTHING;

UPDATE app_settings
SET default_timezone = 'Asia/Hong_Kong',
    updated_at = NOW()
WHERE id = 1 OR default_timezone IS DISTINCT FROM 'Asia/Hong_Kong';

ALTER TABLE app_settings
  ALTER COLUMN default_timezone SET DEFAULT 'Asia/Hong_Kong';

ALTER TABLE app_settings
  ALTER COLUMN default_timezone SET NOT NULL;

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT;

UPDATE user_preferences
SET timezone = 'Asia/Hong_Kong',
    updated_at = NOW();
