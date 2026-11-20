type VoiceLike = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService'>;

const MALE_VOICE_NAMES_BY_PRIORITY = ['eddy', 'reed', 'rocko', 'grandpa', 'injoon', 'hyunsu', 'bongjin', 'gookmin'];
const MALE_BONUS = 100;

const NEURAL_NAME = /natural|neural|premium|enhanced|siri|google/i;

const isKorean = (voice: VoiceLike) => voice.lang.replace('_', '-').toLowerCase().startsWith('ko');

function score(voice: VoiceLike): number {
  const maleRank = MALE_VOICE_NAMES_BY_PRIORITY.findIndex((male) => voice.name.toLowerCase().includes(male));
  if (maleRank >= 0) return MALE_BONUS - maleRank;
  return (NEURAL_NAME.test(voice.name) ? 2 : 0) + (voice.localService ? 0 : 1);
}

export function pickKoreanVoice<T extends VoiceLike>(voices: readonly T[]): T | undefined {
  return voices.filter(isKorean).sort((a, b) => score(b) - score(a))[0];
}
