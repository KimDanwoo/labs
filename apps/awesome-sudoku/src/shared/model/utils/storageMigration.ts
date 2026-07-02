/**
 * Zustand persist 포맷을 Jotai atomWithStorage 개별 키로 1회 마이그레이션한다.
 * layout.tsx inline script에서 호출.
 */
export function migrateFromZustand(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('sudoku:migrated')) return;

  try {
    // 게임 상태: awesome-sudoku-storage → sudoku:* 개별 키
    const gameRaw = localStorage.getItem('awesome-sudoku-storage');
    if (gameRaw) {
      const parsed = JSON.parse(gameRaw);
      const state = parsed?.state;
      if (state && typeof state === 'object') {
        for (const [key, value] of Object.entries(state)) {
          localStorage.setItem(`sudoku:${key}`, JSON.stringify(value));
        }
      }
      localStorage.removeItem('awesome-sudoku-storage');
    }

    // 인증: sudoku-auth → sudoku-user
    const authRaw = localStorage.getItem('sudoku-auth');
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      const state = parsed?.state;
      if (state?.user) {
        localStorage.setItem('sudoku-user', JSON.stringify(state.user));
      }
      localStorage.removeItem('sudoku-auth');
    }

    // 테마: awesome-sudoku-theme → sudoku-theme
    const themeRaw = localStorage.getItem('awesome-sudoku-theme');
    if (themeRaw) {
      const parsed = JSON.parse(themeRaw);
      const state = parsed?.state;
      if (state?.theme) {
        localStorage.setItem('sudoku-theme', JSON.stringify(state.theme));
      }
      localStorage.removeItem('awesome-sudoku-theme');
    }
  } catch {
    // 마이그레이션 실패 시 무시 — 새 게임으로 시작
  }

  localStorage.setItem('sudoku:migrated', 'true');
}
