import { STUDY_STAMP_ENDPOINT } from '../config/devReload';

export async function fetchStudyStamp(): Promise<number> {
  const response = await fetch(STUDY_STAMP_ENDPOINT);
  if (!response.ok) throw new Error('stamp fetch failed');
  const body = (await response.json()) as { stamp: number };
  return body.stamp;
}
