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
    title: '초원을 달리는 말',
    description: 'three.js로 만든 인터랙티브 3D 씬',
    href: 'https://d-prairie.vercel.app/',
    image: '/projects/prairie.webp',
    imagePosition: 'center',
  },
  {
    title: '프딥',
    description: 'Frontend Deep Dive 아카이브',
    href: 'https://fe-deep.vercel.app/',
    image: '/projects/fe-deep.webp',
  },
  {
    title: '플코',
    description: '아이돌 컨셉 다마고치 게임',
    href: 'https://plco-tamagochi.vercel.app/',
    image: '/projects/plco.webp',
    imagePosition: 'center',
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
    title: 'gymlog',
    description: '루틴 따라 기록하는 운동 PWA',
    href: 'https://d-gymlog.vercel.app/',
    image: '/projects/gymlog.webp',
  },
  {
    title: 'soundlab',
    description: 'WebGL 픽셀 파티클로 듣는 자작곡 플레이어',
    href: 'https://labs-sound.vercel.app/',
    image: '/projects/soundlab.webp',
    imagePosition: 'center',
  },
];
