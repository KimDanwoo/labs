// 진동 지원 기기에서만 동작(미지원·차단 시 조용히 무시). iOS Safari 등 제약은 PRD 8장 참고.
export const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  navigator.vibrate(pattern);
};

// 휴식 종료 알림용 패턴(짧게-쉼-짧게).
export const REST_DONE_VIBRATION: number[] = [200, 100, 200];
