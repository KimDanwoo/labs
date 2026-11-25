import { GUESS_WORD_NO_STORE } from '@entities/guess-word';
import { todayAnswer } from '@entities/guess-word/index.server';
import { connection } from 'next/server';

export async function GET() {
  await connection();
  return Response.json(await todayAnswer(new Date()), { headers: GUESS_WORD_NO_STORE });
}
