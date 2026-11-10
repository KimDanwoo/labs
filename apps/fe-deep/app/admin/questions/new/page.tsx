import { getAllCategories } from '@entities/question';
import { QuestionForm } from '@features/question-form';
import { createServerSupabaseClient } from '@shared/api/supabaseServer';

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
