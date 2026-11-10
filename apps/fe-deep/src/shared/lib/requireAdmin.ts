import { createServerSupabaseClient } from '@shared/api/supabaseServer';
import { assertAdminUser } from '@shared/lib/adminAuthorization';

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw new Error('로그인을 확인하지 못했습니다.', { cause: error });
  assertAdminUser(user);
  return user;
}
