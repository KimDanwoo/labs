import { RoutineBuilderView } from '@views/routine-builder/RoutineBuilderView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '루틴 수정' };

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoutineBuilderView routineId={id} />;
}
