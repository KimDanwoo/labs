'use client';

import {
  getPreferredVoiceName,
  getSynth,
  listKoreanVoices,
  setPreferredVoiceName,
  subscribePreferredVoice,
} from '@shared/lib';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/react';
import { useSyncExternalStore } from 'react';
import { SpeakButton } from './SpeakButton';

/** Radix Select는 빈 문자열 value를 허용하지 않아 자동 선택에 별도 값을 쓴다. */
const AUTO_VALUE = 'auto';
const PREVIEW_TEXT = '이벤트 루프는 콜 스택이 비었을 때 마이크로태스크 큐를 먼저 비웁니다. 렌더링은 그 다음입니다.';

const subscribeVoices = (onChange: () => void) => {
  const synth = getSynth();
  synth?.addEventListener('voiceschanged', onChange);
  return () => synth?.removeEventListener('voiceschanged', onChange);
};

/** 음성 목록은 비동기로 채워진다. 줄바꿈으로 이어 붙여 스냅샷을 안정된 문자열로 만든다. */
const getVoiceNames = () =>
  listKoreanVoices(getSynth()?.getVoices() ?? [])
    .map((voice) => voice.name)
    .join('\n');

export function VoiceSetting() {
  const voiceNames = useSyncExternalStore(subscribeVoices, getVoiceNames, () => '');
  const preferred = useSyncExternalStore(subscribePreferredVoice, getPreferredVoiceName, () => '');
  const names = voiceNames ? voiceNames.split('\n') : [];

  if (names.length === 0) {
    return <p className="text-sm text-muted-foreground">이 브라우저에서는 사용할 수 있는 한국어 음성이 없습니다.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preferred || AUTO_VALUE}
        onValueChange={(value) => setPreferredVoiceName(value === AUTO_VALUE ? '' : value)}
      >
        <SelectTrigger className="h-9 max-w-xs text-sm" aria-label="읽어주기 음성 선택">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO_VALUE}>자동 선택</SelectItem>
          {names.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SpeakButton text={PREVIEW_TEXT} />
    </div>
  );
}
