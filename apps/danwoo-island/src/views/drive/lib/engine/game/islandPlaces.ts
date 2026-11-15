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
  offset: { x: number; y: number };
}

export const ISLAND_PLACES: readonly IslandPlace[] = [
  { name: '프로젝트', respawnName: 'projects', icon: 'projects', offset: { x: 0, y: -0.02 } },
  { name: 'Danwoo Lab', respawnName: 'lab', icon: 'lab', offset: { x: -0.03, y: 0 } },
  { name: '소개·이력서', respawnName: 'career', icon: 'career', offset: { x: 0, y: -0.06 } },
  { name: '소셜', respawnName: 'social', icon: 'social', offset: { x: -0.01, y: -0.04 } },
  { name: '서킷', respawnName: 'circuit', icon: 'circuit', offset: { x: -0.08, y: -0.05 } },
  { name: '볼링장', respawnName: 'bowling', icon: 'bowling', offset: { x: -0.08, y: 0.03 } },
  { name: '코코넛 노점', respawnName: 'cookie', icon: 'cookie', offset: { x: -0.02, y: -0.01 } },
  { name: '회오리 정류장', respawnName: 'altar', icon: 'tornado', offset: { x: 0, y: -0.05 } },
  { name: '최신 글 게시판', respawnName: 'behindTheScene', icon: 'blog', offset: { x: 0.01, y: 0 } },
  { name: 'Lab 포털', respawnName: 'timeMachine', icon: 'portal', offset: { x: 0, y: 0 } },
  { name: '출발점', respawnName: 'beachStart', icon: 'start', offset: { x: 0, y: 0 } },
];
