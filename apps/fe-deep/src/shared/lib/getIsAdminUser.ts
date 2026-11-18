'use server';

import { createServerSupabaseClient } from '@shared/api/supabaseServer';
import { isAdmin } from '@shared/lib/isAdmin';

export async function getIsAdminUser(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user?.email);
}
