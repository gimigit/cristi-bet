-- =============================================
-- 003_config_bankroll_start
-- Unifică BANKROLL_START într-o singură sursă: tabelul config
-- =============================================
INSERT INTO config (key, value) VALUES
  ('bankroll_start', '10.0'::jsonb)
ON CONFLICT (key) DO NOTHING;