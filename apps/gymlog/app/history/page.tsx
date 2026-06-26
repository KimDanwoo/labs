import { HistoryView } from '@views/history/HistoryView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '기록' };

export default function HistoryPage() {
  return <HistoryView />;
}
