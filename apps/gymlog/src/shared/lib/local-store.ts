// 비회원용 로컬 영속. 로그인 유저는 Firestore가 진실이라 이 키들을 쓰지 않는다.
export const STORAGE_KEYS = {
  profile: 'gymlog:profile',
  routines: 'gymlog:routines',
  activeSession: 'gymlog:active-session',
  history: 'gymlog:history',
} as const;

export const loadLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveLocal = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과 등은 조용히 무시
  }
};
