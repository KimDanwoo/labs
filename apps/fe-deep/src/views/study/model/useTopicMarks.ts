'use client';

import { getCurrentUserId } from '@entities/progress/services';
import { createClient } from '@shared/config/supabase/client';
import { useCallback, useEffect, useState } from 'react';

// ============================================================
// 주제 단위 표시(이해됨 · 오답노트) 공용 훅
// 비로그인: localStorage만 사용
// 로그인: 서버 테이블이 진실 — 로드 시 로컬 전용 항목을 서버로 올리고 합집합 사용
// ============================================================

/** 문서 slug → 표시된 주제 제목 목록 */
type MarkMap = Record<string, string[]>;

interface TopicMarkStore {
  /** 서버 테이블 이름. 스키마는 (user_id, doc_slug, topic_key)로 동일하다. */
  table: string;
  storageKey: string;
}

function readLocal(storageKey: string): MarkMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(storageKey: string, docSlug: string, titles: Set<string>): void {
  const map = readLocal(storageKey);
  map[docSlug] = [...titles];
  localStorage.setItem(storageKey, JSON.stringify(map));
}

async function syncToggle(table: string, docSlug: string, topicKey: string, isAdding: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = isAdding
    ? await supabase
        .from(table)
        .upsert(
          { user_id: userId, doc_slug: docSlug, topic_key: topicKey },
          { onConflict: 'user_id,doc_slug,topic_key' },
        )
    : await supabase.from(table).delete().match({ user_id: userId, doc_slug: docSlug, topic_key: topicKey });

  if (error) console.error(`syncToggle(${table}) error:`, error);
}

export function useTopicMarks(docSlug: string, { table, storageKey }: TopicMarkStore) {
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = new Set(readLocal(storageKey)[docSlug] ?? []);
      const userId = await getCurrentUserId();

      if (!userId) {
        if (!cancelled) {
          setMarked(local);
          setIsLoaded(true);
        }
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .select('topic_key')
        .eq('user_id', userId)
        .eq('doc_slug', docSlug);

      if (error) {
        console.error(`loadTopicMarks(${table}) error:`, error);
        if (!cancelled) {
          setMarked(local);
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
          .from(table)
          .upsert(rows, { onConflict: 'user_id,doc_slug,topic_key' });
        if (upsertError) console.error(`uploadLocalTopicMarks(${table}) error:`, upsertError);
      }

      if (!cancelled) {
        saveLocal(storageKey, docSlug, merged);
        setMarked(merged);
        setIsLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [docSlug, table, storageKey]);

  const toggle = useCallback(
    (topicTitle: string) => {
      const next = new Set(marked);
      const isAdding = !next.has(topicTitle);
      if (isAdding) next.add(topicTitle);
      else next.delete(topicTitle);

      setMarked(next);
      saveLocal(storageKey, docSlug, next);
      void syncToggle(table, docSlug, topicTitle, isAdding);
    },
    [docSlug, marked, table, storageKey],
  );

  return { marked, isLoaded, toggle };
}
