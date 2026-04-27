'use server';

import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { createAdminSupabaseClient } from '@/shared/config/supabase/admin';

export type FeedbackType = 'add_question' | 'edit_question';

interface CreateFeedbackInput {
  type: FeedbackType;
  content: string;
  questionId?: string;
}

/** 로그인 사용자의 피드백을 생성한다. */
export async function createFeedback(input: CreateFeedbackInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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

/** 관리자: 모든 피드백을 조회한다. */
export async function getFeedbacks(status?: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const admin = createAdminSupabaseClient();
  let query = admin
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`피드백 조회 실패: ${error.message}`);
  return data;
}

/** 관리자: 피드백 상태를 변경한다. */
export async function updateFeedbackStatus(id: string, status: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('feedbacks')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`상태 변경 실패: ${error.message}`);
}
