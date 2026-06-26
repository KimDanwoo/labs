import { RoutineBuilderView } from '@views/routine-builder/RoutineBuilderView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '새 루틴' };

export default function NewRoutinePage() {
  return <RoutineBuilderView />;
}
