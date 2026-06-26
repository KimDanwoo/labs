import { PlanView } from '@views/plan/PlanView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '주간 플랜' };

export default function PlanPage() {
  return <PlanView />;
}
