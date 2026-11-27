'use client';

import { useState, type SubmitEvent } from 'react';

import { Button } from '@shared/ui/button';
import { PuzzleVictory } from '@shared/ui/puzzle-victory';
import { INITIAL_WORD_ROUND, WORD_PATTERN, WORD_PUZZLES } from '@views/game-library/config/quickWords';
import { quickWordFeedback } from '@views/game-library/lib/quickWordFeedback';
import styles from '@views/game-library/ui/GameLibrary.module.css';
import { QuickWordForm } from '@views/game-library/ui/QuickWordForm';

export function QuickWord() {
  const [round, setRound] = useState(INITIAL_WORD_ROUND);
  const puzzle = WORD_PUZZLES[round.position] ?? WORD_PUZZLES[0];
  const isSolved = round.result === 'solved';
  const isRevealed = round.result === 'revealed';
  const isFinished = isSolved || isRevealed;
  const hasMoreHints = round.hintCount < puzzle.hints.length;
  const hasHintButton = !isFinished && hasMoreHints;
  const hasAnswerButton = !isFinished && !hasMoreHints;
  const message = quickWordFeedback({ result: round.result, answer: puzzle.answer, hasMoreHints });

  function handleChange(input: string): void {
    setRound({ ...round, input, result: 'playing' });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const word = round.input.replace(/\s+/gu, '').normalize('NFC');
    if (!WORD_PATTERN.test(word)) {
      setRound({ ...round, result: 'invalid' });
      return;
    }

    const isCorrect = puzzle.answer === word || puzzle.aliases?.includes(word);
    setRound({ ...round, input: word, result: isCorrect ? 'solved' : 'retry' });
  }

  function handleReveal(): void {
    setRound({ ...round, hintCount: round.hintCount + 1 });
  }

  function handleShowAnswer(): void {
    setRound({ ...round, result: 'revealed' });
  }

  function handleReset(): void {
    setRound({ ...INITIAL_WORD_ROUND, position: (round.position + 1) % WORD_PUZZLES.length });
  }

  return (
    <div className={styles.wordGame}>
      <p className={styles.wordContext}>
        {puzzle.category} · {puzzle.answer.length}글자
      </p>
      <ol className={styles.wordHints} aria-label="공개된 힌트" aria-live="polite">
        {puzzle.hints.slice(0, round.hintCount).map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ol>
      <QuickWordForm value={round.input} isFinished={isFinished} onChange={handleChange} onSubmit={handleSubmit} />
      <p className={styles.wordStatus} role="status">
        {isSolved ? <PuzzleVictory /> : message}
      </p>
      <div className={styles.feedback}>
        {hasHintButton ? (
          <Button variant="surface" size="s" onClick={handleReveal}>
            {round.hintCount === puzzle.hints.length - 1 ? '초성 보기' : '힌트 더 보기'}
          </Button>
        ) : null}
        {hasAnswerButton ? (
          <Button variant="surface" size="s" onClick={handleShowAnswer}>
            정답 보기
          </Button>
        ) : null}
        <Button variant="surface" size="s" onClick={handleReset}>
          다른 문제
        </Button>
      </div>
    </div>
  );
}
