import type { Project } from '@entities/project/model/types';

/** 소개할 내 프로젝트(Labs) 목록. 새 프로젝트는 여기에 추가한다. */
export const PROJECTS: Project[] = [
  {
    title: '청연사주',
    description: '웹툰 형식의 사주 해석',
    href: 'https://saju.danwoo.dev/',
    image: '/projects/cheongyeon-saju.webp',
  },
  {
    title: 'soundlab',
    description: '내가 만든 노래를 듣는 플레이어 — WebGL 픽셀 파티클 비주얼라이저',
    href: 'https://sound.danwoo.dev/',
    image: '/projects/soundlab.webp',
    imagePosition: 'center',
  },
  {
    title: '프딥',
    description: 'Frontend Deep Dive 아카이브',
    href: 'https://fe-deep.danwoo.dev/',
    image: '/projects/fe-deep.webp',
  },
  {
    title: '스도쿠',
    description: '쉽게 즐기는 스도쿠 게임',
    href: 'https://sudoku.danwoo.dev/',
    image: '/projects/sudoku.webp',
    imagePosition: 'center',
  },
  {
    title: 'Dansoon',
    description: 'AI로 기술·베스트셀러·웹소설을 자동화한 리포트 블로그',
    href: 'https://log.danwoo.dev/',
    image: '/projects/dansoon.webp',
    imagePosition: 'center',
  },
  {
    title: 'Unicorn Rush',
    description: '유니콘과 함께하는 3D 비행 · 공중 회전과 제로백 가속',
    href: 'https://prairie.danwoo.dev/',
    image: '/projects/unicorn-rush.webp',
    imagePosition: 'center',
  },
  {
    title: '여름빛 산책',
    description: '2등신 아이와 걷는 여름 시골 — 손그림 배경화와 Three.js, 낮·노을 추억 모으기',
    href: 'https://komorebi.danwoo.dev/',
    image: '/projects/komorebi.webp',
    imagePosition: 'center',
  },
];
