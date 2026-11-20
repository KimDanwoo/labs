import { HUD_PILL_BUTTON } from '@views/ride/config/hud';
import { resetCourse, useExploration } from '@views/ride/model/exploration/store';
import { GATES } from '@views/ride/model/exploration/world';

export function CourseRetry() {
  const { nextGate } = useExploration();
  if (nextGate !== GATES.length) return null;
  return (
    <button className={`${HUD_PILL_BUTTON} mt-3 block`} onClick={resetCourse}>
      다시 도전 · 첫 고리로
    </button>
  );
}
