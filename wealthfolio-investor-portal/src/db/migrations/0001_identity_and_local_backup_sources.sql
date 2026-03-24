ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE users
SET username = CASE
  WHEN role = 'admin' THEN 'admin'
  ELSE lower(
    regexp_replace(
      coalesce(nullif(split_part(coalesce(email, ''), '@', 1), ''), display_name, 'investor') || '_' || substr(id, 1, 4),
      '[^a-zA-Z0-9_]+',
      '_',
      'g'
    )
  )
END
WHERE username IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users(username);
