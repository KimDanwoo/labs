import { generateAiFeedback, parseFeedbackInput } from '@views/study/index.server';
import { NextResponse } from 'next/server';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: '로컬 개발 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }

  const input = parseFeedbackInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    return NextResponse.json({ feedback: await generateAiFeedback(input) });
  } catch {
    return NextResponse.json(
      { error: 'Claude 실행에 실패했습니다. 로컬에 Claude Code가 설치·로그인되어 있는지 확인하세요.' },
      { status: 503 },
    );
  }
}
