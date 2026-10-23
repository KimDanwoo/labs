export const DISCOVERY_STORAGE_KEY = 'komorebi-discoveries-v1';
export const CONTROLS_SEEN_STORAGE_KEY = 'komorebi-controls-seen-v1';

export const DIALOG = { none: 'none', map: 'map', memory: 'memory' } as const;
export type Dialog = (typeof DIALOG)[keyof typeof DIALOG];

export const TOAST_DURATION_MS = 3_500;
