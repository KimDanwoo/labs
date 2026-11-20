/**
 * 파일명 꼬리의 버전 표기. 같은 곡의 마스터가 여러 개 있을 수 있어(리마스터를 올린 곡이 있다)
 * 표기를 떼고 같은 곡으로 묶은 뒤, 어느 파일을 쓸지는 길이로 고른다.
 */
const VERSION_TAG =
  /[\s_-]*[([{]?\s*(remaster(ed)?|리마스터|master(ing)?|마스터링|final|fin|vers?on\s*\d*|version\s*\d*|v\d+|\d{1,2})\s*[)\]}]?$/gi;

const normalizeStem = (stem) => {
  let out = stem.trim();
  let previous;
  do {
    previous = out;
    out = out.replace(VERSION_TAG, '').trim();
  } while (out !== previous && out.length > 0);
  return out || stem.trim();
};

/**
 * 곡을 묶는 열쇠. 파일명과 사클 제목의 표기가 자주 다르다 —
 * 파일은 `걸어.mp3`인데 사클 제목은 `걸어 (Walk Through Neon Rain)`이고, `low tide`와 `Low tide`처럼
 * 대소문자만 다르기도 하다. 괄호 부제·버전 표기·공백·문장부호를 다 지우고 비교한다.
 * 열쇠가 겹치는 곡이 있으면 길이로 가른다.
 */
export const titleKey = (value) =>
  normalizeStem(String(value).normalize('NFC'))
    .replace(/[([{][^)\]}]*[)\]}]/g, '')
    .toLowerCase()
    .replace(/[\s_\-–—.,!?'"·]/g, '');

/** 같은 곡의 파일이 여럿이고 길이도 같을 때의 우선순위. 리마스터를 올렸다는 게 사용자의 규칙이다. */
export const versionRank = (stem) => {
  if (/remaster|리마스터/i.test(stem)) return 2;
  if (/v\d|verson|version|\d$/i.test(stem)) return 1;
  return 0;
};
export const DRIFT_TIE_MS = 150;
