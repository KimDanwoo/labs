import { GUESS_WORD_API, GUESS_WORD_ERROR_STATUS, GUESS_WORD_NO_STORE } from '@entities/guess-word';
import { guessWord } from '@entities/guess-word/index.server';
import type { NextRequest } from 'next/server';

const OK_STATUS = 200;

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get(GUESS_WORD_API.wordParam) ?? '';
  const result = await guessWord(word, new Date());
  const status = 'error' in result ? GUESS_WORD_ERROR_STATUS[result.error] : OK_STATUS;
  return Response.json(result, { status, headers: GUESS_WORD_NO_STORE });
}
