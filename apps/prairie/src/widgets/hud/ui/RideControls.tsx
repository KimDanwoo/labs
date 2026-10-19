import { KeyCap } from './KeyCap';

export function RideControls() {
  return (
    <div className="flex flex-col gap-md">
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
          <KeyCap>Space</KeyCap>점프 · 길게 눌러 비행
        </span>
        <span className="flex items-center gap-sm">
          <KeyCap>E</KeyCap>공중 회전
        </span>
        <span className="flex items-center gap-sm">
          <KeyCap>Q</KeyCap>제로백
        </span>
        <span className="text-prairie-paper/65">드래그로 둘러보기</span>
      </div>
      <p className="hidden text-xs text-prairie-paper/80 pointer-coarse:block">
        화면을 끌어 이동 · 오른쪽 버튼으로 질주 · 비행 · 회전 · 제로백
      </p>
    </div>
  );
}
