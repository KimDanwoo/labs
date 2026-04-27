import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { createAdminSupabaseClient } from '@/shared/config/supabase/admin';

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: '계정 삭제에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
