export const MUSCLE_GROUP = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  quads: '대퇴사두',
  hamstrings: '햄스트링',
  glutes: '둔근',
  calves: '종아리',
  biceps: '이두',
  triceps: '삼두',
  core: '코어',
} as const;

export type MuscleGroup = keyof typeof MUSCLE_GROUP;
