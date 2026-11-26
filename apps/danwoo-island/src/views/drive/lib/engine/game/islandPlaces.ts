export type PlaceIcon =
  | 'projects'
  | 'lab'
  | 'career'
  | 'social'
  | 'circuit'
  | 'beachGoal'
  | 'jukebox'
  | 'waterfall'
  | 'shower'
  | 'lighthouse'
  | 'bonfire'
  | 'controls'
  | 'cookie'
  | 'tornado'
  | 'blog'
  | 'portal'
  | 'start';

export interface IslandPlace {
  name: string;
  respawnName: string;
  icon: PlaceIcon;
  description: string;
  labelSide?: 'left';
}

export const ISLAND_PLACES: readonly IslandPlace[] = [
  { name: '프로젝트', respawnName: 'projects', icon: 'projects', description: '작업한 프로젝트를 넘겨 봐요' },
  { name: 'Danwoo Lab', respawnName: 'lab', icon: 'lab', description: 'Danwoo Lab 입구' },
  { name: '소개·이력서', respawnName: 'career', icon: 'career', description: '소개와 이력서' },
  { name: '소셜', respawnName: 'social', icon: 'social', description: 'GitHub·블로그·SoundCloud' },
  { name: '서킷', respawnName: 'circuit', icon: 'circuit', description: '한 바퀴 기록 재기' },
  {
    name: '비치볼 골대',
    respawnName: 'beachGoal',
    icon: 'beachGoal',
    description: '비치볼을 밀어 골 넣기',
    labelSide: 'left',
  },
  { name: '쥬크박스', respawnName: 'jukebox', icon: 'jukebox', description: '섬에 흐르는 음악 고르기' },
  { name: '코코넛 노점', respawnName: 'cookie', icon: 'cookie', description: '코코넛 따기' },
  { name: '회오리 정류장', respawnName: 'altar', icon: 'tornado', description: '안 가 본 곳으로 날아가요' },
  { name: '최신 글 게시판', respawnName: 'behindTheScene', icon: 'blog', description: 'danwoo.dev 최신 글' },
  { name: 'Lab 포털', respawnName: 'timeMachine', icon: 'portal', description: 'lab.danwoo.dev로 가는 포털' },
  { name: '폭포', respawnName: 'achievements', icon: 'waterfall', description: '폭포 아래 쉼터' },
  {
    name: '샤워장',
    respawnName: 'toilet',
    icon: 'shower',
    description: '해변 샤워장 옆에 빨간 밸브가 있어요',
  },
  { name: '눈등대', respawnName: 'lighthouse', icon: 'lighthouse', description: '눈 내리는 곶의 작은 등대' },
  { name: '모닥불', respawnName: 'bonfire', icon: 'bonfire', description: '해변 모닥불' },
  { name: '조작법', respawnName: 'controls', icon: 'controls', description: '조작법 안내판' },
  { name: '출발점', respawnName: 'beachStart', icon: 'start', description: '처음 출발한 해변' },
];

const PLACES_AT_HIGH_TIDE = ISLAND_PLACES.filter((place) => place.respawnName !== 'lighthouse');

export function availablePlaces(isLighthouseAccessible: boolean): readonly IslandPlace[] {
  return isLighthouseAccessible ? ISLAND_PLACES : PLACES_AT_HIGH_TIDE;
}
