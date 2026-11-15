export type PlaceIcon =
  | 'projects'
  | 'lab'
  | 'career'
  | 'social'
  | 'circuit'
  | 'bowling'
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
}

export const ISLAND_PLACES: readonly IslandPlace[] = [
  { name: '프로젝트', respawnName: 'projects', icon: 'projects', description: '작업한 프로젝트를 넘겨 봐요' },
  { name: 'Danwoo Lab', respawnName: 'lab', icon: 'lab', description: 'Danwoo Lab 입구' },
  { name: '소개·이력서', respawnName: 'career', icon: 'career', description: '소개와 이력서' },
  { name: '소셜', respawnName: 'social', icon: 'social', description: 'GitHub·블로그·SoundCloud' },
  { name: '서킷', respawnName: 'circuit', icon: 'circuit', description: '한 바퀴 기록 재기' },
  { name: '볼링장', respawnName: 'bowling', icon: 'bowling', description: '볼링과 쥬크박스' },
  { name: '코코넛 노점', respawnName: 'cookie', icon: 'cookie', description: '코코넛 따기' },
  { name: '회오리 정류장', respawnName: 'altar', icon: 'tornado', description: '안 가 본 곳으로 날아가요' },
  { name: '최신 글 게시판', respawnName: 'behindTheScene', icon: 'blog', description: 'danwoo.dev 최신 글' },
  { name: 'Lab 포털', respawnName: 'timeMachine', icon: 'portal', description: 'lab.danwoo.dev로 가는 포털' },
  { name: '출발점', respawnName: 'beachStart', icon: 'start', description: '처음 출발한 해변' },
];
