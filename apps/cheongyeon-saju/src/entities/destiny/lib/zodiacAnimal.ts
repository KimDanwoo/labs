import type { EarthlyBranch } from '@entities/destiny/data/branches';
import type { HeavenlyStem } from '@entities/destiny/data/stems';

type ZodiacAnimal = {
  animal: string;
  color: string;
  fullName: string;
};

const BRANCH_ANIMAL: Record<EarthlyBranch, string> = {
  子: '쥐',
  丑: '소',
  寅: '호랑이',
  卯: '토끼',
  辰: '용',
  巳: '뱀',
  午: '말',
  未: '양',
  申: '원숭이',
  酉: '닭',
  戌: '개',
  亥: '돼지',
};

const STEM_COLOR: Record<HeavenlyStem, string> = {
  甲: '푸른',
  乙: '푸른',
  丙: '붉은',
  丁: '붉은',
  戊: '황금',
  己: '황금',
  庚: '흰',
  辛: '흰',
  壬: '검은',
  癸: '검은',
};

function getZodiacAnimal(
  yearStem: HeavenlyStem,
  yearBranch: EarthlyBranch,
): ZodiacAnimal {
  const animal = BRANCH_ANIMAL[yearBranch];
  const color = STEM_COLOR[yearStem];
  return {
    animal,
    color,
    fullName: `${color} ${animal}`,
  };
}

export { getZodiacAnimal };
export type { ZodiacAnimal };
