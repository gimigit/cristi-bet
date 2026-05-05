-- =============================================
-- TABELE PRINCIPALE
-- =============================================

CREATE TABLE IF NOT EXISTS bets (
  id            TEXT PRIMARY KEY,
  event         TEXT NOT NULL,
  selection     TEXT NOT NULL,
  sport         TEXT NOT NULL,
  league        TEXT NOT NULL,
  market        TEXT NOT NULL,
  event_date    TIMESTAMPTZ NOT NULL,
  odds          NUMERIC(6,2) NOT NULL,
  confidence    INTEGER NOT NULL CHECK (confidence BETWEEN 50 AND 99),
  stake         NUMERIC(8,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','WON','LOST','VOID','PUSH')),
  pnl           NUMERIC(8,2),
  rationale     TEXT,
  placed_at     TIMESTAMPTZ DEFAULT NOW(),
  settled_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bankroll_history (
  id          BIGSERIAL PRIMARY KEY,
  balance     NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO bankroll_history (balance) VALUES (10.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- CONFIG — sporturi active
-- =============================================

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO config (key, value) VALUES
  ('active_sports', '["soccer_epl", "basketball_nba"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "public_read_bets" ON bets;
DROP POLICY IF EXISTS "public_read_bankroll" ON bankroll_history;
DROP POLICY IF EXISTS "public_read_config" ON config;
DROP POLICY IF EXISTS "service_write_bets" ON bets;
DROP POLICY IF EXISTS "service_write_bankroll" ON bankroll_history;
DROP POLICY IF EXISTS "service_write_config" ON config;

-- Recreate policies
CREATE POLICY "public_read_bets" ON bets FOR SELECT USING (true);
CREATE POLICY "public_read_bankroll" ON bankroll_history FOR SELECT USING (true);
CREATE POLICY "public_read_config" ON config FOR SELECT USING (true);
CREATE POLICY "service_write_bets" ON bets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_write_bankroll" ON bankroll_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_write_config" ON config FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- DIARY — intrări zilnice generate de AI
-- =============================================

CREATE TABLE IF NOT EXISTS diary (
  date       DATE PRIMARY KEY,
  content    TEXT NOT NULL,
  wins       INT DEFAULT 0,
  losses     INT DEFAULT 0,
  pnl        NUMERIC(8,2) DEFAULT 0,
  bankroll   NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_diary" ON diary;
DROP POLICY IF EXISTS "service_write_diary" ON diary;
CREATE POLICY "public_read_diary" ON diary FOR SELECT USING (true);
CREATE POLICY "service_write_diary" ON diary FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- INDECȘI
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON bets(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_sport ON bets(sport);
CREATE INDEX IF NOT EXISTS idx_bankroll_recorded ON bankroll_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date DESC);
