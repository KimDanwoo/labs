export const getSynth = () => (typeof window === 'undefined' ? undefined : window.speechSynthesis);
