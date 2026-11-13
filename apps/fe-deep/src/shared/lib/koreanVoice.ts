type VoiceLike = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService'>;

/**
 * Web Speech API는 성별 정보를 주지 않아 이름으로 추정한다. 앞쪽일수록 우선.
 * macOS 시스템 음성(Eddy·Reed·Rocko·Grandpa) → Edge/Azure 신경망 음성(InJoon 등).
 */
const MALE_VOICES = ['eddy', 'reed', 'rocko', 'grandpa', 'injoon', 'hyunsu', 'bongjin', 'gookmin'];
const MALE_BONUS = 100;

const NEURAL_NAME = /natural|neural|premium|enhanced|siri|google/i;

const isKorean = (voice: VoiceLike) => voice.lang.replace('_', '-').toLowerCase().startsWith('ko');

function score(voice: VoiceLike): number {
  const maleRank = MALE_VOICES.findIndex((male) => voice.name.toLowerCase().includes(male));
  if (maleRank >= 0) return MALE_BONUS - maleRank;
  return (NEURAL_NAME.test(voice.name) ? 2 : 0) + (voice.localService ? 0 : 1);
}

export function listKoreanVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  return voices.filter(isKorean);
}

export function pickKoreanVoice<T extends VoiceLike>(voices: readonly T[], preferredName?: string): T | undefined {
  const korean = voices.filter(isKorean);
  const preferred = preferredName ? korean.find((voice) => voice.name === preferredName) : undefined;
  return preferred ?? [...korean].sort((a, b) => score(b) - score(a))[0];
}
