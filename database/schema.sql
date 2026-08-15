CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  photo_url text,
  is_admin boolean NOT NULL DEFAULT false,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_sign_in_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique_idx ON app_users (lower(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  uid text PRIMARY KEY,
  email text,
  display_name text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES user_profiles(uid) ON DELETE CASCADE,
  title text NOT NULL,
  language text NOT NULL DEFAULT 'auto',
  content text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES user_profiles(uid) ON DELETE CASCADE,
  title text NOT NULL,
  mode text NOT NULL DEFAULT 'chat',
  language text NOT NULL DEFAULT 'auto',
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity ADD COLUMN IF NOT EXISTS details text;

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES user_profiles(uid) ON DELETE CASCADE,
  title text NOT NULL,
  language text NOT NULL DEFAULT 'auto',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  email text,
  mode text NOT NULL,
  language text NOT NULL DEFAULT 'auto',
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  output_characters integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snippets_user_created_idx ON snippets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_user_created_idx ON activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_user_updated_idx ON conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_requests_created_idx ON ai_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_requests_user_idx ON ai_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions (expires_at);
