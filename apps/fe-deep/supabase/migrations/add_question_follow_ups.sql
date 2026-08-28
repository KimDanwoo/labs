-- ============================================================
-- 질문별 꼬리질문(꼬꼬무) 추가
--   [{ "question": "...", "keywords": ["..."], "answer": "..." }]
--   답 확인 후 단계별로 이어서 학습한다.
-- ============================================================

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS follow_ups JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN questions.follow_ups IS '꼬리질문 배열: [{question, keywords[], answer}]';
