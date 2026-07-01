import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { getAdminSupabase, requireAdmin } from '@shared/lib/server/supabase-admin';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  const { data, error } = await getAdminSupabase()
    .from('quiz_questions')
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

  const {
    id,
    character_id,
    question,
    options,
    correct_index,
    fact,
    is_active,
    sort_order,
  } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof character_id !== 'string' ||
    !(ALL_CHARACTER_IDS as readonly string[]).includes(character_id)
  ) {
    return NextResponse.json({ error: '잘못된 캐릭터입니다.' }, { status: 400 });
  }
  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: '문제가 비어 있습니다.' }, { status: 400 });
  }
  if (
    !Array.isArray(options) ||
    options.length < 2 ||
    options.some((o) => typeof o !== 'string' || !o.trim())
  ) {
    return NextResponse.json(
      { error: '보기는 2개 이상, 모두 채워야 합니다.' },
      { status: 400 },
    );
  }
  if (
    typeof correct_index !== 'number' ||
    correct_index < 0 ||
    correct_index >= options.length
  ) {
    return NextResponse.json(
      { error: '정답 보기를 선택하세요.' },
      { status: 400 },
    );
  }
  if (typeof fact !== 'string' || !fact.trim()) {
    return NextResponse.json({ error: '해설이 비어 있습니다.' }, { status: 400 });
  }

  const rowId =
    typeof id === 'string' && id
      ? id
      : `${character_id}-${randomUUID().slice(0, 8)}`;

  const { error } = await getAdminSupabase()
    .from('quiz_questions')
    .upsert(
      {
        id: rowId,
        character_id,
        question,
        options,
        correct_index,
        fact,
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
    .from('quiz_questions')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
