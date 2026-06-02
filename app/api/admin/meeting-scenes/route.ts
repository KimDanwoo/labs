import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { getAdminSupabase, requireAdmin } from '@shared/lib/server/supabase-admin';

const OUTCOMES = ['good', 'ok', 'awkward'];

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  const { data, error } = await getAdminSupabase()
    .from('meeting_scenes')
    .select('*')
    .order('character_id')
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

  const { id, character_id, category, prompt, options, is_active, sort_order } =
    (body ?? {}) as Record<string, unknown>;

  if (
    typeof character_id !== 'string' ||
    !(ALL_CHARACTER_IDS as readonly string[]).includes(character_id)
  ) {
    return NextResponse.json({ error: '잘못된 캐릭터입니다.' }, { status: 400 });
  }
  if (typeof category !== 'string' || !category.trim()) {
    return NextResponse.json({ error: '카테고리가 비어 있습니다.' }, { status: 400 });
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: '대사가 비어 있습니다.' }, { status: 400 });
  }
  if (!Array.isArray(options) || options.length === 0) {
    return NextResponse.json({ error: '선택지가 필요합니다.' }, { status: 400 });
  }
  for (const opt of options) {
    const o = (opt ?? {}) as Record<string, unknown>;
    if (
      typeof o.text !== 'string' ||
      !o.text.trim() ||
      typeof o.reaction !== 'string' ||
      typeof o.outcome !== 'string' ||
      !OUTCOMES.includes(o.outcome)
    ) {
      return NextResponse.json(
        { error: '선택지 형식이 올바르지 않습니다.' },
        { status: 400 },
      );
    }
  }

  const rowId =
    typeof id === 'string' && id
      ? id
      : `${character_id}-${randomUUID().slice(0, 8)}`;

  const { error } = await getAdminSupabase()
    .from('meeting_scenes')
    .upsert(
      {
        id: rowId,
        character_id,
        category,
        prompt,
        options,
        is_active: is_active !== false,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
      },
      { onConflict: 'id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: rowId });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 });
  }
  const { error } = await getAdminSupabase()
    .from('meeting_scenes')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
