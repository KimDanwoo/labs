import { EDGE } from '@views/slitherlink/config/board';
import { nextEdgeState } from '@views/slitherlink/lib/edgeCycle';
import { applyBackward, applyForward, condenseChanges } from '@views/slitherlink/lib/history';
import { describe, expect, it } from 'vitest';

const { UNKNOWN, LINE, CROSS } = EDGE;

describe('변 상태 순환', () => {
  it('빈칸 → 선 → X → 빈칸', () => {
    expect([UNKNOWN, LINE, CROSS].map(nextEdgeState)).toEqual([LINE, CROSS, UNKNOWN]);
  });
});

describe('기록 압축과 적용', () => {
  it('같은 변의 여러 걸음은 처음 상태와 마지막 상태만 남기고, 결국 그대로면 버린다', () => {
    const entry = condenseChanges([
      { edge: 0, from: CROSS, to: LINE },
      { edge: 1, from: UNKNOWN, to: LINE },
      { edge: 0, from: LINE, to: CROSS },
      { edge: 1, from: LINE, to: LINE },
    ]);
    expect(entry).toEqual([{ edge: 1, from: UNKNOWN, to: LINE }]);
  });

  it('앞으로 적용한 기록을 뒤로 적용하면 원래대로 돌아온다', () => {
    const start = [UNKNOWN, CROSS, UNKNOWN];
    const entry = [
      { edge: 0, from: UNKNOWN, to: LINE },
      { edge: 1, from: CROSS, to: UNKNOWN },
    ];
    const forward = applyForward(start, entry);
    expect(forward).toEqual([LINE, UNKNOWN, UNKNOWN]);
    expect(applyBackward(forward, entry)).toEqual(start);
  });
});
