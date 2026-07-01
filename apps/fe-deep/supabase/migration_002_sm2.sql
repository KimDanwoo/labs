-- ============================================================
-- SM-2 Spaced Repetition fields for user_progress
-- ============================================================

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS easiness_factor REAL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetition INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review DATE DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_user_progress_next_review
  ON user_progress(user_id, next_review);
