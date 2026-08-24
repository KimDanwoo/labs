import type { Project } from '@entities/project/model/types';

/** 소개할 내 프로젝트(Labs) 목록. 새 프로젝트는 여기에 추가한다. */
export const PROJECTS: Project[] = [
  {
    title: '청연사주',
    description: '웹툰 형식의 사주 해석',
    href: 'https://cheongyeon-saju.vercel.app/',
    image: '/projects/cheongyeon-saju.webp',
  },
  {
    title: 'soundlab',
    description: '내가 만든 노래를 듣는 플레이어 — WebGL 픽셀 파티클 비주얼라이저',
    href: 'https://labs-sound.vercel.app/',
    image: '/projects/soundlab.webp',
    imagePosition: 'center',
  },
  {
    title: '프딥',
    description: 'Frontend Deep Dive 아카이브',
    href: 'https://fe-deep.vercel.app/',
    image: '/projects/fe-deep.webp',
  },
  {
    title: '스도쿠',
    description: '쉽게 즐기는 스도쿠 게임',
    href: 'https://awesome-sudoku.vercel.app/',
    image: '/projects/sudoku.webp',
    imagePosition: 'center',
  },
  {
    title: 'Dansoon',
    description: 'AI로 기술·베스트셀러·웹소설을 자동화한 리포트 블로그',
    href: 'https://daily-cron-log.vercel.app/',
    image: '/projects/dansoon.webp',
    imagePosition: 'center',
  },
  {
    title: '초원을 달리는 말',
    href: 'https://d-prairie.vercel.app/',
    image: '/projects/prairie.webp',
    imagePosition: 'center',
  },
];
