const VERSION_TAG =
  /[\s_-]*[([{]?\s*(remaster(ed)?|리마스터|master(ing)?|마스터링|final|fin|vers?on\s*\d*|version\s*\d*|v\d+|\d{1,2})\s*[)\]}]?$/gi;

const isStillShrinking = (out, previous) => out !== previous && out.length > 0;

const normalizeStem = (stem) => {
  let out = stem.trim();
  let previous;
  do {
    previous = out;
    out = out.replace(VERSION_TAG, '').trim();
  } while (isStillShrinking(out, previous));
  return out || stem.trim();
};

export const titleKey = (value) =>
  normalizeStem(String(value).normalize('NFC'))
    .replace(/[([{][^)\]}]*[)\]}]/g, '')
    .toLowerCase()
    .replace(/[\s_\-–—.,!?'"·]/g, '');

export const versionRank = (stem) => {
  if (/remaster|리마스터/i.test(stem)) return 2;
  if (/v\d|verson|version|\d$/i.test(stem)) return 1;
  return 0;
};
export const DRIFT_TIE_MS = 150;
