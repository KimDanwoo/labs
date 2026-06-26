import { PrivacyView } from '@views/legal/PrivacyView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침' };

export default function PrivacyPage() {
  return <PrivacyView />;
}
