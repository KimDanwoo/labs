import { GUESS_WORD_ERROR, GUESS_WORD_ERROR_STATUS, GUESS_WORD_NO_STORE, readGuessWord } from '@entities/guess-word';
import { guessWord, isBotRequest } from '@entities/guess-word/index.server';

const OK_STATUS = 200;

export async function POST(request: Request) {
  if (await isBotRequest()) {
    return Response.json(
      { error: GUESS_WORD_ERROR.BOT },
      { status: GUESS_WORD_ERROR_STATUS[GUESS_WORD_ERROR.BOT], headers: GUESS_WORD_NO_STORE },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  const result = await guessWord(readGuessWord(body), new Date());
  const status = 'error' in result ? GUESS_WORD_ERROR_STATUS[result.error] : OK_STATUS;
  return Response.json(result, { status, headers: GUESS_WORD_NO_STORE });
}
