-- Watchtower schema (idempotent — applied on startup).

CREATE TABLE IF NOT EXISTS sessions (
  id              text PRIMARY KEY,         -- UVS session id
  name            text,
  kind            text,
  purpose         text,
  priority        text,
  persona         text,
  cwd             text,
  worktree        text,
  branch          text,
  pid             integer,
  tmux_target     text,                     -- e.g. "uvs_<sid>" (null if not owned)
  state           text DEFAULT 'active',    -- active | idle | awaiting_human | terminated
  started_at      timestamptz DEFAULT now(),
  ended_at        timestamptz
);

CREATE TABLE IF NOT EXISTS events (
  id          bigserial PRIMARY KEY,
  session_id  text,
  event_type  text,
  tool_name   text,
  command     text,
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_session_created ON events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at DESC);

CREATE TABLE IF NOT EXISTS approvals (
  id          bigserial PRIMARY KEY,
  session_id  text,
  tool_name   text,
  command     text,
  request     jsonb,
  status      text DEFAULT 'pending',       -- pending | approved | denied | expired
  decided_by  text,
  created_at  timestamptz DEFAULT now(),
  decided_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_approvals_session_status ON approvals (session_id, status);
