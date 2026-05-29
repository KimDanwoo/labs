import { supabase } from '@shared/lib';
import type { CharacterId } from '@shared/types';
import type { QuizQuestion } from '../types';

type QuizRpcRow = {
  id: string;
  character_id: string;
  question: string;
  options: string[];
  correct_index: number;
  fact: string;
};

export async function fetchRandomQuizQuestions(
  characterId: CharacterId,
  count: number,
): Promise<QuizQuestion[]> {
  const { data, error } = await supabase.rpc('get_random_quiz_questions', {
    p_character_id: characterId,
    p_count: count,
  });

  if (error) throw error;
  if (!data) return [];

  return (data as QuizRpcRow[]).map((row) => ({
    id: row.id,
    characterId: row.character_id as CharacterId,
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    fact: row.fact,
  }));
}
