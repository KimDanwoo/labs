import { HUD_PILL_BUTTON } from '../../../config/hud';
import { resetCourse, useExploration } from '../../../model/exploration/store';
import { GATES } from '../../../model/exploration/world';

export function CourseStatus() {
  const { active, nextGate, elapsed } = useExploration();
  if (!active) return null;
  return (
    <div className="mt-3 rounded-xl bg-prairie-ink/65 px-4 py-3 text-sm backdrop-blur-md">
      <p>
        바람길 · {nextGate} / {GATES.length} · {elapsed.toFixed(1)}초
      </p>
      <button className={`${HUD_PILL_BUTTON} mt-2`} onClick={resetCourse}>
        코스 나가기
      </button>
    </div>
  );
}
