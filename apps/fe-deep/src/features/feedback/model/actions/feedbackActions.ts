'use server';

import { createAdminSupabaseClient } from '@shared/api/supabaseAdmin';
import { createServerSupabaseClient } from '@shared/api/supabaseServer';
import { requireAdmin } from '@shared/lib/requireAdmin';
import type { CreateFeedbackInput } from '../types/types';

export async function createFeedback(input: CreateFeedbackInput) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('feedbacks').insert({
    user_id: user.id,
    type: input.type,
    content: input.content,
    question_id: input.questionId ?? null,
  });

  if (error) throw new Error(`피드백 제출 실패: ${error.message}`);
}

export async function getFeedbacks(status?: string) {
  await requireAdmin();

  const admin = createAdminSupabaseClient();
  let query = admin.from('feedbacks').select('*').order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`피드백 조회 실패: ${error.message}`);
  return data;
}

export async function updateFeedbackStatus(id: string, status: string) {
  await requireAdmin();

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('feedbacks').update({ status }).eq('id', id);

  if (error) throw new Error(`상태 변경 실패: ${error.message}`);
}
