// 초 → "M:SS" (휴식 타이머 등 짧은 구간).
export const formatClock = (totalSec: number): string => {
  const safe = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 숫자에 천단위 콤마 (예: 5040 → "5,040").
export const formatNumber = (value: number): string => Math.round(value).toLocaleString('ko-KR');

// kg → "850kg" / "1.5t" (누적 볼륨처럼 큰 무게를 짧게).
export const formatVolume = (kg: number): string => {
  const rounded = Math.round(Math.max(0, kg));
  if (rounded < 1000) {
    return `${rounded}kg`;
  }
  return `${(rounded / 1000).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}t`;
};

// 초 → "1시간 5분" / "42분" / "30초" (세션 총 소요 등 사람이 읽는 길이).
export const formatDuration = (totalSec: number): string => {
  const safe = Math.max(0, Math.round(totalSec));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (minutes > 0) {
    return `${minutes}분`;
  }
  return `${seconds}초`;
};
