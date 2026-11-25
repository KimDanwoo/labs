import { GUESS_WORD_API } from '@entities/guess-word';
import { initBotId } from 'botid/client/core';

initBotId({
  protect: [{ path: GUESS_WORD_API.guess, method: GUESS_WORD_API.guessMethod }],
});
