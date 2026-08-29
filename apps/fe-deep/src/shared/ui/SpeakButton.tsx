'use client';

import { getPreferredVoiceName, getSynth, pickKoreanVoice, toSpeechChunks } from '@shared/lib';
import { Button } from '@ui/react';
import { Square, Volume2 } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

const SPEECH_LANG = 'ko-KR';
const SPEECH_RATE = 1;

const subscribeNever = () => () => {};

/** 마크다운 답변을 브라우저 내장 TTS로 읽어준다. 지원하지 않는 브라우저에선 렌더하지 않는다. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const isSupported = useSyncExternalStore(
    subscribeNever,
    () => Boolean(getSynth()),
    () => false,
  );
  /** 재생 중인 답변 본문. text가 바뀌면 자동으로 정지 상태가 된다. */
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const isSpeaking = speakingText === text;

  // 음성 목록은 비동기로 채워진다. 클릭 시점에 비어 있지 않도록 미리 깨워둔다.
  useEffect(() => {
    getSynth()?.getVoices();
  }, []);

  useEffect(() => () => getSynth()?.cancel(), [text]);

  if (!isSupported) return null;

  const handleClick = () => {
    const synth = getSynth();
    if (!synth) return;

    synth.cancel();
    if (isSpeaking) {
      setSpeakingText(null);
      return;
    }

    const chunks = toSpeechChunks(text);
    if (chunks.length === 0) return;

    const voice = pickKoreanVoice(synth.getVoices(), getPreferredVoiceName());

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = voice?.lang ?? SPEECH_LANG;
      if (voice) utterance.voice = voice;
      utterance.rate = SPEECH_RATE;
      utterance.onerror = () => setSpeakingText(null);
      if (index === chunks.length - 1) utterance.onend = () => setSpeakingText(null);
      synth.speak(utterance);
    });
    setSpeakingText(text);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={isSpeaking ? '읽기 멈추기' : '답변 읽어주기'}
      aria-pressed={isSpeaking}
      className={className}
    >
      {isSpeaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}
    </Button>
  );
}
