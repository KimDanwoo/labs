'use server';

import { createAdminSupabaseClient } from '@shared/api/supabaseAdmin';
import { requireAdmin } from '@shared/lib/requireAdmin';
import { randomUUID } from 'crypto';
import type { Question, QuestionInput } from '../types/types';

export async function createQuestion(data: QuestionInput): Promise<Question> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  let orderNum = data.order_num;
  if (orderNum === null || orderNum === undefined) {
    const { data: last, error } = await admin
      .from('questions')
      .select('order_num')
      .eq('category_id', data.category_id)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`질문 순서 조회 실패: ${error.message}`);
    orderNum = (last?.order_num ?? 0) + 1;
  }

  const { data: created, error } = await admin
    .from('questions')
    .insert({ id: randomUUID(), ...data, order_num: orderNum })
    .select()
    .single();

  if (error) throw new Error(`질문 생성 실패: ${error.message}`);
  return created as Question;
}

export async function updateQuestion(id: string, data: Partial<QuestionInput>): Promise<Question> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data: updated, error } = await admin.from('questions').update(data).eq('id', id).select().single();

  if (error) throw new Error(`질문 수정 실패: ${error.message}`);
  return updated as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('questions').delete().eq('id', id);
  if (error) throw new Error(`질문 삭제 실패: ${error.message}`);
}

export async function deleteQuestions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('questions').delete().in('id', ids);
  if (error) throw new Error(`일괄 삭제 실패: ${error.message}`);
}

export async function updateQuestionsVisibility(
  ids: string[],
  fields: { show_in_daily?: boolean; show_in_flashcard?: boolean },
): Promise<void> {
  if (ids.length === 0) return;
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('questions').update(fields).in('id', ids);
  if (error) throw new Error(`노출 설정 변경 실패: ${error.message}`);
}

export async function updateCategoryVisibility(
  categoryId: string,
  fields: { show_in_daily?: boolean; show_in_flashcard?: boolean },
): Promise<void> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('questions').update(fields).eq('category_id', categoryId);
  if (error) throw new Error(`카테고리 노출 설정 변경 실패: ${error.message}`);
}

export async function reorderQuestions(categoryId: string, orderedIds: string[]): Promise<void> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const updates = orderedIds.map((id, index) =>
    admin
      .from('questions')
      .update({ order_num: index + 1 })
      .eq('id', id)
      .eq('category_id', categoryId),
  );

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(`질문 순서 변경 실패: ${error.message}`);
}
