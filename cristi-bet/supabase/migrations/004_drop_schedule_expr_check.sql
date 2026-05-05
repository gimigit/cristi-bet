-- =============================================
-- DROP CHECK constraint on cron_jobs.schedule_expr
-- to avoid error 23514
-- =============================================

ALTER TABLE cron_jobs
DROP CONSTRAINT IF EXISTS cron_jobs_schedule_expr_check;
