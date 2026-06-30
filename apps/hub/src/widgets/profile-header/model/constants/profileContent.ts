import type { ProfileParagraph } from '../types/profile';

const RESUME_URL = 'https://docs.google.com/document/d/1_oia6H3WisAHsGNJWZAYqru9pHUXovRNAaRJcZn5UBU/edit';
const SOUNDCLOUD_URL = 'https://soundcloud.com/danwooking';
const BLOG_URL = 'https://dansoon-dev.tistory.com/category';

export const PROFILE_PARAGRAPHS: readonly ProfileParagraph[] = [
  [
    '제품을 키우는 데 관심이 많은 프론트엔드 엔지니어예요. 화면을 다듬는 일도 좋아하지만, 더 끌리는 건 그 뒤에 있는 구조와 데이터, 그리고 일하는 방식을 조금씩 더 낫게 바꾸는 쪽이에요. 지금까지 해온 일은 ',
    { label: '이력서', href: RESUME_URL },
    '에 정리해 뒀어요.',
  ],
  [
    '하루를 마치면 그날 만들고 싶은 게 하나씩 떠올라요. 분야는 가리지 않고, 꽂히면 주말을 넘기지 않고 배포까지 끝내는 편이에요. 요즘은 AI와 함께 작업하면서 머릿속 아이디어를 훨씬 빠르게 현실로 옮기고 있어요. 그 과정에서 배운 건 가끔 ',
    { label: '블로그', href: BLOG_URL },
    '에 적어 둬요.',
  ],
  [
    '취미는 운동이랑 음악이에요. 운동은 머리 비우기에 좋아서 오래 하고 있고, 음악은 요즘 AI로 작곡한 곡을 ',
    { label: 'SoundCloud', href: SOUNDCLOUD_URL },
    '에 올려 둬요.',
  ],
];
