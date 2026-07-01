import { NextResponse } from 'next/server';
import {
  getAdminSupabase,
  requireAdmin,
} from '@shared/lib/server/supabase-admin';

export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 });
  }
  const { error } = await getAdminSupabase()
    .from('chat_messages')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
