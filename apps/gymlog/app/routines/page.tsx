import { RoutineLibraryView } from '@views/routine-library/RoutineLibraryView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '루틴 관리' };

export default function RoutinesPage() {
  return <RoutineLibraryView />;
}
