import type { ProfileParagraph } from '../types/profile';

const RESUME_URL = 'https://docs.google.com/document/d/1_oia6H3WisAHsGNJWZAYqru9pHUXovRNAaRJcZn5UBU/edit';
const SOUNDCLOUD_URL = 'https://soundcloud.com/danwooking';
const BLOG_URL = 'https://dansoon-dev.tistory.com/category';

export const PROFILE_PARAGRAPHS: readonly ProfileParagraph[] = [
  [
    '제품을 더 잘 키우는 데 관심이 많은 프론트엔드 엔지니어예요. 화면을 예쁘게 만드는 것도 좋지만, 그 뒤에 있는 구조나 데이터, 일하는 방식을 더 낫게 바꾸는 쪽이 더 좋더라고요. 어떤 일들을 해왔는지는 ',
    { label: '이력서', href: RESUME_URL },
    '에 정리해 뒀어요.',
  ],
  [
    '일 끝나고 나면 그날그날 만들고 싶은 게 생겨요. 분야는 딱히 안 가리고, 꽂히면 주말 안에 배포까지 해버리는 편이에요. 요즘은 AI랑 같이 작업하면서 생각한 걸 훨씬 빠르게 현실로 옮기고 있어요. 만들면서 배운 것들은 가끔 ',
    { label: '블로그', href: BLOG_URL },
    '에 글로도 남겨요.',
  ],
  [
    '운동은 머리 비울 때 좋아서, 하다 보니 6년째 하고 있어요. 음악도 만드는데, 요즘은 AI로 작곡한 곡들을 ',
    { label: 'SoundCloud', href: SOUNDCLOUD_URL },
    '에 올려두고 있어요.',
  ],
];
