import { SessionView } from '@views/session/SessionView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '운동' };

export default function SessionPage() {
  return <SessionView />;
}
