import type { ReviewRating, SM2Result } from './model';

/**
 * ReviewRating을 SM-2 quality 점수(0~5)로 변환한다.
 * hard는 quality 3으로 매핑하여 성공 경로(질 3 이상)에 진입시킨다.
 * hard 전용 간격 보정은 calculateSM2 내부에서 별도 적용된다.
 */
function ratingToQuality(rating: ReviewRating): number {
  switch (rating) {
    case 'again': return 0;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
  }
}

/** 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환한다. */
export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

/** 기준일로부터 days일 후의 날짜를 "YYYY-MM-DD"로 반환한다. 잘못된 날짜는 오늘 기준으로 계산한다. */
export function addDays(baseDate: string, days: number): string {
  let d = new Date(baseDate);
  if (isNaN(d.getTime())) {
    d = new Date();
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * SM-2 알고리즘 핵심 계산.
 * 현재 상태와 평가 등급을 받아 다음 복습 스케줄을 반환한다.
 *
 * - again(Q=0): repetition 리셋, 간격 1일부터 재시작
 * - hard(Q=3): 간격 소폭 증가(×1.2), EF 소폭 하락
 * - good(Q=4): 표준 SM-2 간격 적용, EF 유지
 * - easy(Q=5): 간격 대폭 증가(×1.3 보너스), EF 상승
 */
export function calculateSM2(
  prevEF: number,
  prevInterval: number,
  prevRepetition: number,
  rating: ReviewRating,
): SM2Result {
  const quality = ratingToQuality(rating);
  const today = todayString();

  // 실패 (again): 처음부터 다시
  if (quality < 3) {
    return {
      easiness_factor: Math.max(1.3, prevEF - 0.2),
      interval: 1,
      repetition: 0,
      next_review: addDays(today, 1),
    };
  }

  // 성공: EF 업데이트
  const newEF = Math.max(
    1.3,
    prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  let newInterval: number;
  const newRepetition = prevRepetition + 1;

  if (newRepetition === 1) {
    newInterval = 1;
  } else if (newRepetition === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(prevInterval * newEF);
  }

  // hard/easy 보정은 표준 간격(rep 1~2)이 지난 이후에만 적용
  if (newRepetition > 2) {
    if (rating === 'hard') {
      // hard: 간격을 이전 간격의 1.2배로 제한 (Anki 방식)
      newInterval = Math.max(1, Math.round(prevInterval * 1.2));
    }
    if (rating === 'easy') {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  // 간격에 ±5% 지터 추가 (카드 클러스터링 방지)
  const jitter = Math.round(newInterval * (Math.random() * 0.1 - 0.05));
  newInterval = Math.max(1, newInterval + jitter);

  return {
    easiness_factor: newEF,
    interval: newInterval,
    repetition: newRepetition,
    next_review: addDays(today, newInterval),
  };
}
