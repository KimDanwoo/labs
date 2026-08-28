import { getStudyContentStamp } from '@views/study/model/studyDocs';
import { NextResponse } from 'next/server';

/** dev 전용 — 학습 md의 최신 수정 시각. 클라이언트가 폴링해서 저장 즉시 화면을 갱신한다. */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '로컬 개발 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }
  return NextResponse.json({ stamp: await getStudyContentStamp() });
}
