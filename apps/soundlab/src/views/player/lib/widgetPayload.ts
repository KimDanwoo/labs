/** 위젯 콜백은 undefined를 줄 수 있다. 비유한값이 frameState로 새면 시간 표시가 NaN이 된다. */
export const validDuration = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

export const isValidPosition = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
