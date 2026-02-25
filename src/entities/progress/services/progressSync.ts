'use client';

import { createClient } from '@/shared/config/supabase/client';
import type { UserProgress } from '../model';
import { getLocalProgress, saveLocalProgress } from '../api';

// ============================================================
// Supabase 동기화
// 로그인 시 localStorage ↔ Supabase 양방향 머지
// 학습 시 write-through (localStorage + Supabase)
// ============================================================

/** 캐시된 userId. 동일 세션 내 반복 API 호출을 방지한다. */
let cachedUserId: string | null | undefined = undefined;

/** 모듈 내부에서 공유하는 단일 Supabase 클라이언트 */
let sharedClient: ReturnType<typeof createClient> | null = null;

/** 모듈 내부용 Supabase 클라이언트를 반환한다. */
function getClient() {
  if (!sharedClient) sharedClient = createClient();
  return sharedClient;
}

/** 현재 로그인된 사용자 ID를 반환한다. 비로그인 시 null. 결과를 캐시한다. */
export async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  const { data: { user } } = await getClient().auth.getUser();
  cachedUserId = user?.id ?? null;
  return cachedUserId;
}

/** auth 상태 변경 시 캐시를 초기화한다. */
export function clearUserIdCache() {
  cachedUserId = undefined;
}

/**
 * 로그인 시 localStorage와 Supabase 데이터를 양방향 머지한다.
 * 각 카드에 대해 last_reviewed가 더 최근인 쪽을 채택한다.
 */
export async function syncProgress(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = getClient();
  const localData = getLocalProgress();

  // Supabase에서 전체 진도 가져오기
  const { data: remoteRows, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('syncProgress fetch error:', error);
    return;
  }

  const remoteMap = new Map<string, UserProgress>();
  for (const row of remoteRows ?? []) {
    remoteMap.set(row.question_id, {
      id: row.id,
      user_id: row.user_id,
      question_id: row.question_id,
      status: row.status,
      correct_count: row.correct_count,
      wrong_count: row.wrong_count,
      last_reviewed: row.last_reviewed,
      easiness_factor: row.easiness_factor ?? 2.5,
      interval: row.interval ?? 0,
      repetition: row.repetition ?? 0,
      next_review: row.next_review ?? new Date().toISOString().split('T')[0],
    });
  }

  // 머지: 모든 question_id를 모아서 최신 데이터 채택
  const allQuestionIds = new Set([
    ...Object.keys(localData),
    ...remoteMap.keys(),
  ]);

  const merged: Record<string, UserProgress> = {};
  const toUpsert: UserProgress[] = [];

  for (const qId of allQuestionIds) {
    const local = localData[qId];
    const remote = remoteMap.get(qId);

    if (local && remote) {
      // 둘 다 있으면 last_reviewed가 최신인 쪽 채택
      const localTime = new Date(local.last_reviewed).getTime();
      const remoteTime = new Date(remote.last_reviewed).getTime();
      const winner = localTime >= remoteTime ? { ...local, user_id: userId } : remote;
      merged[qId] = winner;
      // local이 더 최신이면 Supabase 업데이트 필요
      if (localTime > remoteTime) {
        toUpsert.push(winner);
      }
    } else if (local) {
      // local에만 있으면 Supabase에 추가
      const entry = { ...local, user_id: userId };
      merged[qId] = entry;
      toUpsert.push(entry);
    } else if (remote) {
      // remote에만 있으면 local에 추가
      merged[qId] = remote;
    }
  }

  // localStorage 업데이트
  saveLocalProgress(merged);

  // Supabase에 upsert (local이 더 최신인 항목들)
  if (toUpsert.length > 0) {
    const rows = toUpsert.map((p) => ({
      user_id: userId,
      question_id: p.question_id,
      status: p.status,
      correct_count: p.correct_count,
      wrong_count: p.wrong_count,
      last_reviewed: p.last_reviewed,
      easiness_factor: p.easiness_factor,
      interval: p.interval,
      repetition: p.repetition,
      next_review: p.next_review,
    }));

    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert(rows, { onConflict: 'user_id,question_id' });

    if (upsertError) {
      console.error('syncProgress upsert error:', upsertError);
    }
  }
}

/**
 * 단일 카드의 진도를 Supabase에 write-through한다.
 * 비로그인 시 아무 동작하지 않는다. 실패해도 localStorage에는 이미 저장되어 있으므로 무시한다.
 */
export async function syncSingleCard(progress: UserProgress): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = getClient();
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      question_id: progress.question_id,
      status: progress.status,
      correct_count: progress.correct_count,
      wrong_count: progress.wrong_count,
      last_reviewed: progress.last_reviewed,
      easiness_factor: progress.easiness_factor,
      interval: progress.interval,
      repetition: progress.repetition,
      next_review: progress.next_review,
    }, { onConflict: 'user_id,question_id' });

  if (error) {
    console.error('syncSingleCard error:', error);
  }
}
