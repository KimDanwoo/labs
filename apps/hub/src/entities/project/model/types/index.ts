export type Project = {
  title: string;
  description: string;
  href: string;
  /** 카드 커버에 쓸 실제 스크린샷(예: /public 경로). 없으면 그라데이션+favicon 커버를 쓴다. */
  image?: string;
  /** 커버 이미지 정렬(기본 top). 사이트 풀샷이 아닌 가운데가 중요한 이미지는 'center'. */
  imagePosition?: 'top' | 'center';
};
