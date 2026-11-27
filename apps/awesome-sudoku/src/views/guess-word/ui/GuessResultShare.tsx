'use client';

import { useState } from 'react';

import { GAMES, SITE_URL } from '@entities/game-catalog';
import { Button } from '@shared/ui/button';

interface GuessResultShareProps {
  tries: number;
}

export function GuessResultShare({ tries }: GuessResultShareProps) {
  const [message, setMessage] = useState('');

  async function handleCopy(): Promise<void> {
    const text = `오늘의 맞춰봐\n오늘의 단어를 ${tries}번 만에 맞혔어요!\n${SITE_URL}${GAMES.guess.href}`;

    try {
      await navigator.clipboard.writeText(text);
      setMessage('정답을 가린 결과를 복사했어요.');
    } catch {
      setMessage('결과를 복사하지 못했어요. 주소를 직접 공유할 수 있어요.');
    }
  }

  return (
    <div className="mt-5">
      <Button size="l" isFull onClick={handleCopy}>
        결과 복사하기
      </Button>
      {message && (
        <p role="status" className="mt-2 text-center text-sm text-text-secondary">
          {message}
        </p>
      )}
    </div>
  );
}
