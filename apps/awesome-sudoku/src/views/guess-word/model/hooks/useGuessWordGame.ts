'use client';

import { normalizeGuess, type RankHint } from '@entities/guess-word';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GUESS_QUERY_KEY, GUESS_STATUS } from '@views/guess-word/config/game';
import { noticeKindOf, requestAnswer, requestGuess, requestHints } from '@views/guess-word/lib/guessApi';
import {
  addGuess,
  blockedGuessNotice,
  latestDay,
  latestGuess,
  parseRecord,
  revealAnswer,
  sortBySimilarity,
  storedDay,
} from '@views/guess-word/lib/guessRecord';
import { guessRecordAtom } from '@views/guess-word/model/store/guessRecordAtom';
import type { GuessEntry, GuessRecord, Notice } from '@views/guess-word/model/types/guessWord';
import { useAtom } from 'jotai';
import { useMemo, useState, type ChangeEvent, type SubmitEvent } from 'react';

export interface GuessWordGame {
  day: number | null;
  record: GuessRecord;
  sortedGuesses: GuessEntry[];
  latest: GuessEntry | null;
  hints: RankHint[] | undefined;
  input: string;
  notice: Notice | null;
  isGuessing: boolean;
  isGivingUp: boolean;
  isPlaying: boolean;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  handleGiveUp: () => void;
}

export function useGuessWordGame(): GuessWordGame {
  const [stored, setStored] = useAtom(guessRecordAtom);
  const [reportedDay, setReportedDay] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const hintsQuery = useQuery({
    queryKey: GUESS_QUERY_KEY.hints(reportedDay),
    queryFn: requestHints,
    staleTime: Infinity,
  });
  const day = latestDay([reportedDay, hintsQuery.data?.day]);
  const record = useMemo(() => parseRecord(stored, day ?? storedDay(stored) ?? 0), [stored, day]);
  const sortedGuesses = useMemo(() => sortBySimilarity(record.guesses), [record.guesses]);

  const reportDay = (responseDay: number) => {
    if (responseDay !== day) setReportedDay(responseDay);
  };

  const guessMutation = useMutation({
    mutationFn: requestGuess,
    onSuccess: (result) => {
      reportDay(result.day);
      setStored((previous: unknown) => addGuess(parseRecord(previous, result.day), result));
      setInput('');
      setNotice(null);
    },
    onError: (error, word) => setNotice({ kind: noticeKindOf(error), word }),
  });

  const giveUpMutation = useMutation({
    mutationFn: requestAnswer,
    onSuccess: (result) => {
      reportDay(result.day);
      setStored((previous: unknown) => revealAnswer(parseRecord(previous, result.day), result));
    },
    onError: (error) => setNotice({ kind: noticeKindOf(error), word: '' }),
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => setInput(event.target.value);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const word = normalizeGuess(input);
    const blockedNotice = blockedGuessNotice(record, word);
    setNotice(blockedNotice);
    if (!blockedNotice) guessMutation.mutate(word);
  };

  const handleGiveUp = () => giveUpMutation.mutate();

  return {
    day,
    record,
    sortedGuesses,
    latest: latestGuess(record.guesses),
    hints: hintsQuery.data?.hints,
    input,
    notice,
    isGuessing: guessMutation.isPending,
    isGivingUp: giveUpMutation.isPending,
    isPlaying: record.status === GUESS_STATUS.PLAYING,
    handleInputChange,
    handleSubmit,
    handleGiveUp,
  };
}
