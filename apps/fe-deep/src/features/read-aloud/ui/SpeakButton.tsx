'use client';

import { Square, Volume2 } from 'lucide-react';

import { useSpeech } from '@features/read-aloud/model/hooks/useSpeech';
import { Button } from '@shared/ui/Button';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

export function SpeakButton({ text, className }: SpeakButtonProps) {
  const { isSupported, isSpeaking, toggleSpeech } = useSpeech(text);

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSpeech}
      aria-label={isSpeaking ? '읽기 멈추기' : '답변 읽어주기'}
      aria-pressed={isSpeaking}
      className={className}
    >
      {isSpeaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}
    </Button>
  );
}
