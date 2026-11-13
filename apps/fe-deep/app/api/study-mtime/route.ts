import { getStudyContentStamp } from '@views/study/index.server';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '로컬 개발 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }
  return NextResponse.json({ stamp: await getStudyContentStamp() });
}
