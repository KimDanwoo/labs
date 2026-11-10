import { getAllCategories, getQuestionById } from '@entities/question';
import { QuestionForm } from '@features/question-form';
import { createServerSupabaseClient } from '@shared/api/supabaseServer';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [question, categories] = await Promise.all([getQuestionById(id, supabase), getAllCategories(supabase)]);

  if (!question) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">질문 편집</h1>
      <QuestionForm categories={categories} question={question} />
    </div>
  );
}
