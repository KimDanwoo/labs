'use client';

import { getCurrentUserId } from '@entities/progress/services';
import { createClient } from '@shared/config/supabase/client';
import { STORAGE_KEYS } from '@shared/constants';
import { useCallback, useEffect, useState } from 'react';

// ============================================================
// 주제 "이해됨" 체크
// 비로그인: localStorage만 사용
// 로그인: 서버(study_understood)가 진실 — 로드 시 로컬 전용 항목을 서버로 올리고 합집합 사용
// ============================================================

type UnderstoodMap = Record<string, string[]>;

function readLocal(): UnderstoodMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_UNDERSTOOD);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(docSlug: string, titles: Set<string>): void {
  const map = readLocal();
  map[docSlug] = [...titles];
  localStorage.setItem(STORAGE_KEYS.STUDY_UNDERSTOOD, JSON.stringify(map));
}

async function syncToggle(docSlug: string, topicKey: string, isAdding: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = isAdding
    ? await supabase
        .from('study_understood')
        .upsert(
          { user_id: userId, doc_slug: docSlug, topic_key: topicKey },
          { onConflict: 'user_id,doc_slug,topic_key' },
        )
    : await supabase
        .from('study_understood')
        .delete()
        .match({ user_id: userId, doc_slug: docSlug, topic_key: topicKey });

  if (error) console.error('syncToggle error:', error);
}

export function useUnderstoodTopics(docSlug: string) {
  const [understood, setUnderstood] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = new Set(readLocal()[docSlug] ?? []);
      const userId = await getCurrentUserId();

      if (!userId) {
        if (!cancelled) {
          setUnderstood(local);
          setIsLoaded(true);
        }
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('study_understood')
        .select('topic_key')
        .eq('user_id', userId)
        .eq('doc_slug', docSlug);

      if (error) {
        console.error('loadUnderstood error:', error);
        if (!cancelled) {
          setUnderstood(local);
          setIsLoaded(true);
        }
        return;
      }

      const remote = new Set((data ?? []).map((row) => row.topic_key as string));
      const merged = new Set([...local, ...remote]);

      const localOnly = [...local].filter((title) => !remote.has(title));
      if (localOnly.length > 0) {
        const rows = localOnly.map((title) => ({ user_id: userId, doc_slug: docSlug, topic_key: title }));
        const { error: upsertError } = await supabase
          .from('study_understood')
          .upsert(rows, { onConflict: 'user_id,doc_slug,topic_key' });
        if (upsertError) console.error('uploadLocalUnderstood error:', upsertError);
      }

      if (!cancelled) {
        saveLocal(docSlug, merged);
        setUnderstood(merged);
        setIsLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [docSlug]);

  const toggle = useCallback(
    (topicTitle: string) => {
      const next = new Set(understood);
      const isAdding = !next.has(topicTitle);
      if (isAdding) next.add(topicTitle);
      else next.delete(topicTitle);

      setUnderstood(next);
      saveLocal(docSlug, next);
      void syncToggle(docSlug, topicTitle, isAdding);
    },
    [docSlug, understood],
  );

  return { understood, isLoaded, toggle };
}
