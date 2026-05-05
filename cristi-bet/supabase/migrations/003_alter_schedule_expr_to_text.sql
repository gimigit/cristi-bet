-- =============================================
-- ALTER cron_jobs.schedule_expr from VARCHAR to TEXT
-- to avoid CHECK constraint (error 23514)
-- =============================================

ALTER TABLE cron_jobs
ALTER COLUMN schedule_expr TYPE TEXT;
