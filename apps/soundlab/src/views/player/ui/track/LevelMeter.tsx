'use client';

import { LEVEL_BAR_TRANSFORMS } from '../../config/display';
import { useLevelMeter } from '../../model/hooks/useLevelMeter';

/**
 * 현재 곡 행에만 붙는 3바 미터. 파형 진폭을 CSS 변수로 흘려 리렌더 없이 움직인다.
 * 높이(11px) 대비 배율로 늘린다 — height를 건드리면 매 프레임 이 행의 레이아웃이 다시 돈다.
 */
export function LevelMeter() {
  const rootRef = useLevelMeter();

  return (
    <span ref={rootRef} aria-hidden className="flex h-[11px] shrink-0 items-end gap-2xs">
      {LEVEL_BAR_TRANSFORMS.map((transform) => (
        <i key={transform} className="bg-brass w-2xs h-[11px] origin-bottom" style={{ transform }} />
      ))}
    </span>
  );
}
