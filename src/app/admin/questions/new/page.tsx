import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { getAllCategories } from '@/entities/question/api';
import { QuestionForm } from '../../_components/question-form';

export default async function NewQuestionPage() {
  const supabase = await createServerSupabaseClient();
  const categories = await getAllCategories(supabase);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">새 질문 추가</h1>
      <QuestionForm categories={categories} />
    </div>
  );
}
