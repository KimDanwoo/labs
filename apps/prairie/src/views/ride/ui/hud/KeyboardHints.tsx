import { ControlHint } from '@views/ride/ui/hud/ControlHint';
import { KeyCap } from '@views/ride/ui/hud/KeyCap';

export function KeyboardHints() {
  return (
    <div className="hidden flex-wrap items-center gap-x-lg gap-y-md text-xs pointer-fine:flex">
      <ControlHint>
        <span>
          <KeyCap>W</KeyCap> <KeyCap>A</KeyCap> <KeyCap>S</KeyCap> <KeyCap>D</KeyCap>
        </span>
        이동
      </ControlHint>
      <ControlHint>
        <KeyCap>Shift</KeyCap>질주
      </ControlHint>
      <ControlHint>
        <KeyCap>Space</KeyCap>달린 뒤 눌러 이륙 · 길게 상승 · 놓으면 활공
      </ControlHint>
      <ControlHint>
        <KeyCap>E</KeyCap>공중 회전
      </ControlHint>
      <ControlHint>
        <KeyCap>Q</KeyCap>제로백
      </ControlHint>
      <ControlHint>
        <KeyCap>C</KeyCap>하강
      </ControlHint>
      <span className="text-prairie-paper/65">드래그로 좌우·위아래 둘러보기 · ↺ 시점 복원</span>
    </div>
  );
}
