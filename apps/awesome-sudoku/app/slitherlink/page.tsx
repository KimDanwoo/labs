import { SlitherlinkPage } from '@views/slitherlink';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '슬리더링크',
  description: '점을 이어 숫자에 맞는 고리 하나를 완성하는 슬리더링크 퍼즐. 쉬움·중간·어려움 3단계로 즐겨 보세요.',
  alternates: { canonical: '/slitherlink' },
};

export default function Slitherlink() {
  return <SlitherlinkPage />;
}
