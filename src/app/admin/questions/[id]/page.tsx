import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { getAllCategories, getQuestionById } from '@/entities/question/api';
import { QuestionForm } from '@/widgets/question-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [question, categories] = await Promise.all([
    getQuestionById(id, supabase),
    getAllCategories(supabase),
  ]);

  if (!question) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">질문 편집</h1>
      <QuestionForm categories={categories} question={question} />
    </div>
  );
}
