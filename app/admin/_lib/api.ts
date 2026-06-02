/** 관리자 서버 API 경로 (도메인별). 하드코딩 금지 — 항상 이 상수 참조. */
export const ADMIN_API = {
  characters: '/api/admin/characters',
  meetingScenes: '/api/admin/meeting-scenes',
  quiz: '/api/admin/quiz',
} as const;

/** 관리자 페이지 경로. */
export const ADMIN_ROUTE = {
  dashboard: '/admin',
  characters: '/admin/characters',
  meetingScenes: '/admin/meeting-scenes',
  quiz: '/admin/quiz',
} as const;
