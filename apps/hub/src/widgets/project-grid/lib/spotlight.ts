const MAX_TILT_DEG = 6;
const MAX_COVER_SHIFT_PX = 10;

/** 카드 안 포인터 위치(0~1)로 스포트라이트 좌표·기울기·커버 패럴랙스 CSS 변수를 갱신한다. */
export function applySpotlight(card: HTMLElement, clientX: number, clientY: number): void {
  const rect = card.getBoundingClientRect();
  const ratioX = (clientX - rect.left) / rect.width;
  const ratioY = (clientY - rect.top) / rect.height;
  const fromCenterX = ratioX - 0.5;
  const fromCenterY = ratioY - 0.5;

  card.style.setProperty('--mx', `${ratioX * 100}%`);
  card.style.setProperty('--my', `${ratioY * 100}%`);
  card.style.setProperty('--tilt-x', `${-fromCenterY * 2 * MAX_TILT_DEG}deg`);
  card.style.setProperty('--tilt-y', `${fromCenterX * 2 * MAX_TILT_DEG}deg`);
  card.style.setProperty('--shift-x', `${-fromCenterX * 2 * MAX_COVER_SHIFT_PX}px`);
  card.style.setProperty('--shift-y', `${-fromCenterY * 2 * MAX_COVER_SHIFT_PX}px`);
}

export function resetSpotlight(card: HTMLElement): void {
  for (const name of ['--tilt-x', '--tilt-y', '--shift-x', '--shift-y']) card.style.removeProperty(name);
}
