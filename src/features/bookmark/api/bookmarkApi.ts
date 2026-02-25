'use client';

const BOOKMARKS_KEY = 'fe-interview-bookmarks';

// ============================================================
// Bookmarks (localStorage)
// ============================================================

/** localStorage에서 북마크된 질문 ID 목록을 반환한다. */
export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** 질문의 북마크 상태를 토글한다. 토글 후의 상태(true=추가됨, false=제거됨)를 반환한다. */
export function toggleBookmark(questionId: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(questionId);

  if (index >= 0) {
    bookmarks.splice(index, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks.push(questionId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  }
}

/** 질문이 북마크되어 있는지 확인한다. */
export function isBookmarked(questionId: string): boolean {
  return getBookmarks().includes(questionId);
}
