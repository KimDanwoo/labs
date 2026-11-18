import { useEffect, useState, useSyncExternalStore } from 'react';

import { SPEECH_LANG, SPEECH_RATE } from '@shared/config/speech';

import { pickKoreanVoice } from '@shared/lib/koreanVoice';
import { getPreferredVoiceName, getSynth } from '@shared/lib/speechVoice';
import { toSpeechChunks } from '@shared/lib/toSpeechChunks';

const subscribeNever = () => () => {};
const readIsSupported = () => Boolean(getSynth());
const readServerIsSupported = () => false;

export function useSpeech(text: string) {
  const isSupported = useSyncExternalStore(subscribeNever, readIsSupported, readServerIsSupported);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const isSpeaking = speakingText === text;

  // 음성 목록은 비동기로 채워진다. 클릭 시점에 비어 있지 않도록 미리 깨워둔다.
  useEffect(() => {
    getSynth()?.getVoices();
  }, []);

  useEffect(() => () => getSynth()?.cancel(), [text]);

  const toggleSpeech = () => {
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
    const stopSpeaking = () => setSpeakingText(null);

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = voice?.lang ?? SPEECH_LANG;
      if (voice) utterance.voice = voice;
      utterance.rate = SPEECH_RATE;
      utterance.onerror = stopSpeaking;
      if (index === chunks.length - 1) utterance.onend = stopSpeaking;
      synth.speak(utterance);
    });
    setSpeakingText(text);
  };

  return { isSupported, isSpeaking, toggleSpeech };
}
