export type Project = {
  title: string;
  description: string;
  href: string;
  /** 카드 커버에 쓸 실제 스크린샷(예: /public 경로). 없으면 그라데이션+favicon 커버를 쓴다. */
  image?: string;
};
