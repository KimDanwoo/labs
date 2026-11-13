export const CATCH_CELEBRATION_SECONDS = 2.4;

function hop(age: number, start: number, duration: number, height: number) {
  const t = (age - start) / duration;
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI) * height;
}

export function catchCelebration(age: number, reducedMotion = false) {
  const time = Math.max(0, age);
  if (reducedMotion) return { childLift: 0, fishX: 3.4, fishY: 12.5, fishTurn: 0, splash: 0 };
  const flight = Math.min(1, time / 1.05);
  const ease = 1 - (1 - flight) ** 3;
  return {
    childLift: hop(time, 0.18, 0.62, 2.2) + hop(time, 0.92, 0.5, 1.2),
    fishX: 11 + (3.4 - 11) * ease,
    fishY: -2.2 + 14.7 * ease + Math.sin(flight * Math.PI) * 5,
    fishTurn: Math.sin(flight * Math.PI) * -0.9,
    splash: Math.max(0, 1 - time / 0.55),
  };
}

export function catchHeart(age: number, index: number, reducedMotion = false) {
  const time = age - 0.35 - index * 0.15;
  const duration = 1.35;
  const isVisible = time >= 0 && time < duration;
  const t = Math.max(0, Math.min(1, time / duration));
  const side = (index % 2 ? 1 : -1) * (1.2 + (index % 3) * 0.7);
  return {
    isVisible,
    x: side + (reducedMotion ? 0 : Math.sin(t * Math.PI * 1.5 + index) * 0.45),
    y: reducedMotion ? 12.5 : 9.5 + t * 8,
    scale: reducedMotion ? 0.8 : 0.55 + Math.sin(t * Math.PI) * 0.4,
    opacity: isVisible ? Math.sin(t * Math.PI) : 0,
  };
}
