ALTER TABLE t_p28942620_humster_kombat_proje.player_progress
ADD COLUMN last_daily_reward TIMESTAMP,
ADD COLUMN daily_streak INTEGER DEFAULT 0,
ADD COLUMN completed_tasks JSONB DEFAULT '[]'::jsonb;