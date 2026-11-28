import { completedDans, jokboProgress } from '@views/gostop/lib/jokbo';
import { describe, expect, it } from 'vitest';

const stepOf = (captured: readonly number[], key: string) => jokboProgress(captured).find((step) => step.key === key);

describe('족보 진행', () => {
  it('고도리와 단은 3장 중 몇 장인지 센다', () => {
    expect(stepOf([4, 12], 'godori')).toMatchObject({ have: 2, need: 3, isDone: false });
    expect(stepOf([1], 'hong')).toMatchObject({ have: 1, need: 3, isDone: false });
    expect(stepOf([4, 12, 29], 'godori')?.isDone).toBe(true);
  });

  it('피는 쌍피를 2장으로 세고 10장이면 완성이다', () => {
    expect(stepOf([2, 3, 47], 'pi')).toMatchObject({ have: 4, need: 10 });
  });

  it('완성한 단만 고른다', () => {
    expect(completedDans([1, 5, 9, 21])).toEqual(['hong']);
    expect(completedDans([])).toEqual([]);
  });

  it('여덟 갈래를 늘 같은 순서로 낸다', () => {
    expect(jokboProgress([]).map((step) => step.key)).toEqual([
      'gwang',
      'godori',
      'hong',
      'cheong',
      'cho',
      'yeol',
      'tti',
      'pi',
    ]);
  });
});
