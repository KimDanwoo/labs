import { TermsView } from '@views/legal/TermsView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '이용약관' };

export default function TermsPage() {
  return <TermsView />;
}
