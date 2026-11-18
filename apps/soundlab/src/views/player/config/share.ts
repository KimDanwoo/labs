export const SHARE_KIND = { song: 'song', moment: 'moment', native: 'native' } as const;

export type ShareKind = (typeof SHARE_KIND)[keyof typeof SHARE_KIND];

export const SHARE_NOTICE_MS = 5000;

export const SHARE_TITLE_SUFFIX = ' — DANWOO';

export const ABORT_ERROR_NAME = 'AbortError';

export const SHARE_NOTICE: Record<ShareKind, string> = {
  [SHARE_KIND.song]: '링크를 복사했습니다.',
  [SHARE_KIND.moment]: '현재 위치 링크를 복사했습니다.',
  [SHARE_KIND.native]: '현재 위치 링크를 복사했습니다.',
};
