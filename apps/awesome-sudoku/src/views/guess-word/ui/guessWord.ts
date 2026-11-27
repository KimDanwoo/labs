import { GuessWordActions } from '@views/guess-word/ui/GuessWordActions';
import { GuessWordBoard } from '@views/guess-word/ui/GuessWordBoard';
import { GuessWordForm } from '@views/guess-word/ui/GuessWordForm';
import { GuessWordHints } from '@views/guess-word/ui/GuessWordHints';
import { GuessWordLatest } from '@views/guess-word/ui/GuessWordLatest';
import { GuessWordList } from '@views/guess-word/ui/GuessWordList';
import { GuessWordResultSheet } from '@views/guess-word/ui/GuessWordResultSheet';
import { GuessWordRoot } from '@views/guess-word/ui/GuessWordRoot';
import { GuessWordRule } from '@views/guess-word/ui/GuessWordRule';
import { GuessWordStatus } from '@views/guess-word/ui/GuessWordStatus';

export const GuessWord = {
  Root: GuessWordRoot,
  Status: GuessWordStatus,
  Board: GuessWordBoard,
  Form: GuessWordForm,
  Latest: GuessWordLatest,
  List: GuessWordList,
  Hints: GuessWordHints,
  Actions: GuessWordActions,
  Rule: GuessWordRule,
  ResultSheet: GuessWordResultSheet,
};
