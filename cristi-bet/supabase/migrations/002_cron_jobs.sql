-- =============================================
-- CRON_JOBS — pentru sincronizare cu Hermes
-- =============================================

CREATE TABLE IF NOT EXISTS cron_jobs (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  schedule      TEXT,
  schedule_kind TEXT,
  schedule_expr TEXT, -- changed from VARCHAR(200) to avoid CHECK constraint
  schedule_minutes INTEGER,
  state         TEXT DEFAULT 'active',
  enabled       BOOLEAN DEFAULT true,
  last_run_at   TIMESTAMPTZ,
  last_status   TEXT,
  last_error    TEXT,
  last_output   TEXT,
  next_run_at   TIMESTAMPTZ,
  run_count     INTEGER DEFAULT 0,
  deliver       TEXT DEFAULT 'origin',
  source        TEXT DEFAULT 'supabase',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;

-- Politici RLS
DROP POLICY IF EXISTS "public_read_cron_jobs" ON cron_jobs;
DROP POLICY IF EXISTS "service_write_cron_jobs" ON cron_jobs;

CREATE POLICY "public_read_cron_jobs" ON cron_jobs FOR SELECT USING (true);
CREATE POLICY "service_write_cron_jobs" ON cron_jobs FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX IF NOT EXISTS idx_cron_jobs_name ON cron_jobs(name);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_updated ON cron_jobs(updated_at DESC);
