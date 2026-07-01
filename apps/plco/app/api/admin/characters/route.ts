import { NextResponse } from 'next/server';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { getAdminSupabase, requireAdmin } from '@shared/lib/server/supabase-admin';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const { data, error } = await getAdminSupabase()
    .from('characters')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { id, name, color, bg_color, border_color, emoji, is_active } =
    (body ?? {}) as Record<string, unknown>;

  if (
    typeof id !== 'string' ||
    !(ALL_CHARACTER_IDS as readonly string[]).includes(id)
  ) {
    return NextResponse.json(
      { error: '알 수 없는 캐릭터입니다.' },
      { status: 400 },
    );
  }

  const fields = { name, color, bg_color, border_color, emoji };
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || !value.trim()) {
      return NextResponse.json(
        { error: `${key} 값이 비어 있습니다.` },
        { status: 400 },
      );
    }
  }

  const { error } = await getAdminSupabase()
    .from('characters')
    .upsert(
      {
        id,
        name,
        color,
        bg_color,
        border_color,
        emoji,
        is_active: is_active !== false,
      },
      { onConflict: 'id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
