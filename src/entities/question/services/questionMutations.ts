'use server';

import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { createAdminSupabaseClient } from '@/shared/config/supabase/admin';
import { isAdmin } from '@/features/auth';
import type { Question, QuestionInput } from '../model';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    throw new Error('관리자 권한이 필요합니다.');
  }
}

export async function createQuestion(data: QuestionInput): Promise<Question> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  // order_num이 없으면 해당 카테고리 내 마지막 + 1
  let orderNum = data.order_num;
  if (orderNum == null) {
    const { data: last } = await admin
      .from('questions')
      .select('order_num')
      .eq('category_id', data.category_id)
      .order('order_num', { ascending: false })
      .limit(1)
      .single();
    orderNum = (last?.order_num ?? 0) + 1;
  }

  const { data: created, error } = await admin
    .from('questions')
    .insert({ ...data, order_num: orderNum })
    .select()
    .single();

  if (error) throw new Error(`질문 생성 실패: ${error.message}`);
  return created as Question;
}

export async function updateQuestion(
  id: string,
  data: Partial<QuestionInput>
): Promise<Question> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data: updated, error } = await admin
    .from('questions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`질문 수정 실패: ${error.message}`);
  return updated as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('questions').delete().eq('id', id);
  if (error) throw new Error(`질문 삭제 실패: ${error.message}`);
}

export async function reorderQuestions(
  categoryId: string,
  orderedIds: string[]
): Promise<void> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const updates = orderedIds.map((id, index) =>
    admin
      .from('questions')
      .update({ order_num: index + 1 })
      .eq('id', id)
      .eq('category_id', categoryId)
  );

  await Promise.all(updates);
}
