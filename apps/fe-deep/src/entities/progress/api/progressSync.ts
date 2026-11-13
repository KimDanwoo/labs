'use client';

import { createClient } from '@shared/api/supabaseClient';
import { getLocalProgress, saveLocalProgress } from '../model/services/progressStorage';
import type { UserProgress } from '../model/types/types';

let cachedUserId: string | null | undefined = undefined;

let sharedClient: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!sharedClient) sharedClient = createClient();
  return sharedClient;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  const {
    data: { user },
  } = await getClient().auth.getUser();
  cachedUserId = user?.id ?? null;
  return cachedUserId;
}

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

  const { data: remoteRows, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);

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

  const allQuestionIds = new Set([...Object.keys(localData), ...remoteMap.keys()]);

  // 삭제된 질문의 로컬 진도가 섞이면 FK 위반으로 upsert 배치 전체가 실패하므로,
  // 실재하는 질문만 남기고 유령 id는 로컬에서도 정리한다.
  const { data: validRows, error: validError } = await supabase
    .from('questions')
    .select('id')
    .in('id', [...allQuestionIds]);

  if (validError) {
    console.error('syncProgress valid ids fetch error:', validError);
    return;
  }

  const validIds = new Set((validRows ?? []).map((row) => row.id as string));

  const merged: Record<string, UserProgress> = {};
  const toUpsert: UserProgress[] = [];

  for (const qId of allQuestionIds) {
    if (!validIds.has(qId)) continue;
    const local = localData[qId];
    const remote = remoteMap.get(qId);

    if (local && remote) {
      const localTime = new Date(local.last_reviewed).getTime();
      const remoteTime = new Date(remote.last_reviewed).getTime();
      const winner = localTime >= remoteTime ? { ...local, user_id: userId } : remote;
      merged[qId] = winner;
      if (localTime > remoteTime) {
        toUpsert.push(winner);
      }
    } else if (local) {
      const entry = { ...local, user_id: userId };
      merged[qId] = entry;
      toUpsert.push(entry);
    } else if (remote) {
      merged[qId] = remote;
    }
  }

  saveLocalProgress(merged);

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
  const { error } = await supabase.from('user_progress').upsert(
    {
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
    },
    { onConflict: 'user_id,question_id' },
  );

  // 23503(FK 위반) = 삭제된 질문의 진도 — 다음 syncProgress가 로컬을 정리하므로 조용히 넘긴다.
  if (error && error.code !== '23503') {
    console.error('syncSingleCard error:', error);
  }
}
