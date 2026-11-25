import { GUESS_WORD_NO_STORE } from '@entities/guess-word';
import { todayHints } from '@entities/guess-word/index.server';
import { connection } from 'next/server';

export async function GET() {
  await connection();
  return Response.json(await todayHints(new Date()), { headers: GUESS_WORD_NO_STORE });
}
