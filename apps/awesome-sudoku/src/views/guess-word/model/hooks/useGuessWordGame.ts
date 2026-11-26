'use client';

import { normalizeGuess, type RankHint } from '@entities/guess-word';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GUESS_QUERY_KEY } from '@views/guess-word/config/game';
import { noticeKindOf, requestGuess, requestHints } from '@views/guess-word/lib/guessApi';
import {
  addGuess,
  hasGuessed,
  invalidGuessNotice,
  latestDay,
  parseRecord,
  sortBySimilarity,
  spotlightGuess,
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
  isResultOpen: boolean;
  handleResultClose: () => void;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export function useGuessWordGame(): GuessWordGame {
  const [stored, setStored] = useAtom(guessRecordAtom);
  const [reportedDay, setReportedDay] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [spotlightWord, setSpotlightWord] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
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

  const showGuess = (word: string) => {
    setSpotlightWord(word);
    setInput('');
    setNotice(null);
  };

  const guessMutation = useMutation({
    mutationFn: requestGuess,
    onSuccess: (result) => {
      reportDay(result.day);
      setStored((previous: unknown) => addGuess(parseRecord(previous, result.day), result));
      showGuess(result.word);
      if (result.isAnswer) setIsResultOpen(true);
    },
    onError: (error, word) => setNotice({ kind: noticeKindOf(error), word }),
  });

  const handleResultClose = () => setIsResultOpen(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => setInput(event.target.value);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const word = normalizeGuess(input);
    const invalidNotice = invalidGuessNotice(word);
    setNotice(invalidNotice);
    if (invalidNotice) return;
    if (hasGuessed(record, word)) {
      showGuess(word);
      return;
    }
    guessMutation.mutate(word);
  };

  return {
    day,
    record,
    sortedGuesses,
    latest: spotlightGuess(record.guesses, spotlightWord),
    hints: hintsQuery.data?.hints,
    input,
    notice,
    isGuessing: guessMutation.isPending,
    isResultOpen,
    handleResultClose,
    handleInputChange,
    handleSubmit,
  };
}
