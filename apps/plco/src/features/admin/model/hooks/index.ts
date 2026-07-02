'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '../services/adminFetch';
import { ADMIN_API } from '../services/api';
import type { CharacterRow, MeetingSceneRow, QuizRow } from '../types';

export const ADMIN_QUERY_KEYS = {
  characters: ['admin', 'characters'] as const,
  meetingScenes: ['admin', 'meeting-scenes'] as const,
  quiz: ['admin', 'quiz'] as const,
};

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await adminFetch(path);
  if (!res.ok) throw new Error('불러오기에 실패했어요.');
  const { data } = (await res.json()) as { data: T[] };
  return data;
}

async function postUpsert<T>(path: string, body: T): Promise<void> {
  const res = await adminFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('저장에 실패했어요.');
}

async function deleteById(path: string, id: string): Promise<void> {
  const res = await adminFetch(`${path}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('삭제에 실패했어요.');
}

export function useCharacters() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.characters,
    queryFn: () => fetchList<CharacterRow>(ADMIN_API.characters),
  });
}

export function useSaveCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: CharacterRow) => postUpsert(ADMIN_API.characters, row),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.characters }),
  });
}

export function useMeetingScenes() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.meetingScenes,
    queryFn: () => fetchList<MeetingSceneRow>(ADMIN_API.meetingScenes),
  });
}

export function useSaveMeetingScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: MeetingSceneRow) =>
      postUpsert(ADMIN_API.meetingScenes, row),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.meetingScenes }),
  });
}

export function useDeleteMeetingScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteById(ADMIN_API.meetingScenes, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.meetingScenes }),
  });
}

export function useQuizQuestions() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.quiz,
    queryFn: () => fetchList<QuizRow>(ADMIN_API.quiz),
  });
}

export function useSaveQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: QuizRow) => postUpsert(ADMIN_API.quiz, row),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.quiz }),
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteById(ADMIN_API.quiz, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.quiz }),
  });
}
