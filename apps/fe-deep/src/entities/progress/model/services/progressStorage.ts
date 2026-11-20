'use client';
import { todayString } from '@entities/progress/lib/progressDates';
import { parseStoredProgress } from '@entities/progress/lib/storedProgress';
import type { UserProgress } from '@entities/progress/model/types/types';
import { STORAGE_KEYS } from '@shared/config/storageKeys';

function readStoredProgress(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROGRESS);
  } catch {
    return null;
  }
}

export function getLocalProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {};
  const { progress, isRepaired } = parseStoredProgress(readStoredProgress(), todayString());
  if (isRepaired) saveLocalProgress(progress);
  return progress;
}

export function saveLocalProgress(progress: Record<string, UserProgress>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}
