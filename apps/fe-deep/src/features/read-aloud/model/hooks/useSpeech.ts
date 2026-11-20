import { useEffect, useState, useSyncExternalStore } from 'react';

import { SPEECH_LANG, SPEECH_RATE } from '@features/read-aloud/config/speech';

import { pickKoreanVoice } from '@features/read-aloud/lib/koreanVoice';
import { getSynth } from '@features/read-aloud/lib/speechVoice';
import { toSpeechChunks } from '@features/read-aloud/lib/toSpeechChunks';

const subscribeNever = () => () => {};
const readIsSupported = () => Boolean(getSynth());
const readServerIsSupported = () => false;

function preloadVoices(): void {
  getSynth()?.getVoices();
}

export function useSpeech(text: string) {
  const isSupported = useSyncExternalStore(subscribeNever, readIsSupported, readServerIsSupported);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const isSpeaking = speakingText === text;

  useEffect(preloadVoices, []);

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

    const voice = pickKoreanVoice(synth.getVoices());
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
