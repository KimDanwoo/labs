import { pickKoreanVoice } from '@features/read-aloud/lib/koreanVoice';
import assert from 'node:assert/strict';
import test from 'node:test';

const voice = (name: string, lang: string, localService = true) => ({ name, lang, localService });

test('picks a Korean male voice over neural and local ones', () => {
  const voices = [
    voice('Yuna', 'ko-KR'),
    voice('Google 한국의', 'ko-KR', false),
    voice('Eddy (한국어)', 'ko_KR'),
    voice('Alex', 'en-US'),
  ];
  assert.equal(pickKoreanVoice(voices)?.name, 'Eddy (한국어)');
});

test('without a male voice, prefers neural then remote voices', () => {
  const voices = [voice('Yuna', 'ko-KR'), voice('Google 한국의', 'ko-KR', false)];
  assert.equal(pickKoreanVoice(voices)?.name, 'Google 한국의');
});

test('returns undefined when no Korean voice exists', () => {
  assert.equal(pickKoreanVoice([voice('Alex', 'en-US')]), undefined);
});
