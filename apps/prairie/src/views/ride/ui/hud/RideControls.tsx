import { KeyCap } from './KeyCap';

export function RideControls() {
  return (
    <details className="ride-help pointer-events-auto relative text-prairie-paper">
      <summary className="cursor-pointer list-none rounded-full border border-prairie-paper/25 bg-prairie-ink/60 px-lg py-md text-xs backdrop-blur-md focus-visible:outline-2 focus-visible:outline-prairie-accent">
        조작법 <span aria-hidden>↗</span>
      </summary>
      <div className="ride-help-panel absolute bottom-full right-0 mb-md flex flex-col gap-lg rounded-2xl border border-prairie-paper/20 bg-prairie-ink/90 p-lg shadow-lg backdrop-blur-xl">
        <p className="font-display text-lg">바람을 따라, 자유롭게.</p>
        <div className="hidden flex-wrap items-center gap-x-lg gap-y-md text-xs pointer-fine:flex">
          <span className="flex items-center gap-sm">
            <span>
              <KeyCap>W</KeyCap> <KeyCap>A</KeyCap> <KeyCap>S</KeyCap> <KeyCap>D</KeyCap>
            </span>
            이동
          </span>
          <span className="flex items-center gap-sm">
            <KeyCap>Shift</KeyCap>질주
          </span>
          <span className="flex items-center gap-sm">
            <KeyCap>Space</KeyCap>달린 뒤 눌러 이륙 · 길게 상승 · 놓으면 활공
          </span>
          <span className="flex items-center gap-sm">
            <KeyCap>E</KeyCap>공중 회전
          </span>
          <span className="flex items-center gap-sm">
            <KeyCap>Q</KeyCap>제로백
          </span>
          <span className="flex items-center gap-sm">
            <KeyCap>C</KeyCap>하강
          </span>
          <span className="text-prairie-paper/65">드래그로 좌우·위아래 둘러보기 · ↺ 시점 복원</span>
        </div>
        <p className="hidden text-xs text-prairie-paper/80 pointer-coarse:block">
          화면을 끌어 달린 뒤 ↑ 이륙 · 길게 상승 · 놓으면 활공 · ↓ 하강
        </p>
      </div>
    </details>
  );
}
