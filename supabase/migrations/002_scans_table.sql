-- =============================================
-- SCANS — istoric scanări zilnice
-- =============================================

CREATE TABLE IF NOT EXISTS scans (
  id            BIGSERIAL PRIMARY KEY,
  scanned_at    TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT NOT NULL
                CHECK (status IN ('BET_PLACED', 'NO_BET', 'ERROR')),
  leagues_scanned INT DEFAULT 0,
  bet_id        TEXT,
  reason        TEXT
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_scans" ON scans;
DROP POLICY IF EXISTS "service_write_scans" ON scans;

CREATE POLICY "public_read_scans" ON scans FOR SELECT USING (true);
CREATE POLICY "service_write_scans" ON scans FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
