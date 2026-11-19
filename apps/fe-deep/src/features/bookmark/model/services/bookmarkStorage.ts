'use client';

import { STORAGE_KEYS } from '@shared/config/storageKeys';

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(questionId: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(questionId);

  if (index >= 0) {
    bookmarks.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks.push(questionId);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return true;
  }
}

export function isBookmarked(questionId: string): boolean {
  return getBookmarks().includes(questionId);
}
