import { loadQuestionContent } from '@entities/question/index.server';

export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await loadQuestionContent());
}
