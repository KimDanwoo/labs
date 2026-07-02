import type { Project } from '@entities/project/model/types';

/** 소개할 내 프로젝트(Labs) 목록. 새 프로젝트는 여기에 추가한다. */
export const PROJECTS: Project[] = [
  {
    title: '초원을 달리는 말',
    description: 'three.js로 만든 인터랙티브 3D 씬',
    href: 'https://d-prairie.vercel.app/',
    image: '/projects/prairie.png',
    imagePosition: 'center',
  },
  {
    title: '플코',
    description: '아이돌 컨셉 다마고치 게임',
    href: 'https://plco-tamagochi.vercel.app/',
    image: '/projects/plco.png',
  },
  {
    title: '청연사주',
    description: '웹툰 형식의 사주 해석',
    href: 'https://cheongyeon-saju.vercel.app/',
    image: '/projects/cheongyeon-saju.png',
  },
  {
    title: 'AI Tech News',
    description: 'AI 뉴스 큐레이션',
    href: 'https://daily-cron-log.vercel.app/',
    image: '/projects/ai-tech-news.png',
  },
  {
    title: 'Best Seller',
    description: '주간 베스트셀러 리포트',
    href: 'https://daily-cron-log.vercel.app/book/',
    image: '/projects/best-seller.png',
  },
  {
    title: '프딥',
    description: 'Frontend Deep Dive 아카이브',
    href: 'https://fe-deep.vercel.app/',
    image: '/projects/fe-deep.png',
  },
  {
    title: '스도쿠',
    description: '쉽게 즐기는 스도쿠 게임',
    href: 'https://awesome-sudoku.vercel.app/',
    image: '/projects/sudoku.png',
  },
  {
    title: 'gymlog',
    description: '헬스장에서 루틴을 따라가고 세트를 기록하는 운동 동행 PWA',
    href: 'https://d-gymlog.vercel.app/',
    image: '/projects/gymlog.png',
  },
];
