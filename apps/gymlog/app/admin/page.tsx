import { AdminView } from '@views/admin/AdminView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '관리자' };

export default function AdminPage() {
  return <AdminView />;
}
