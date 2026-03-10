-- ============================================================
-- Migration 003: 질문 노출 설정 (오늘의 학습 / 플래시카드)
-- ============================================================

ALTER TABLE questions
  ADD COLUMN show_in_daily BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN show_in_flashcard BOOLEAN NOT NULL DEFAULT TRUE;
