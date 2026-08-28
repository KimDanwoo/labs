import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseStudyDoc, type StudyDoc } from './parseHandbook';

/** 학습 문서 원본. 여기에 .md 파일을 넣으면 학습 화면이 자동으로 생긴다. */
const CONTENT_DIR = path.join(process.cwd(), 'content', 'study');
const MD_EXTENSION = '.md';
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-_]*$/i;

export async function getStudyDocSlugs(): Promise<string[]> {
  try {
    const files = await readdir(CONTENT_DIR);
    return files
      .filter((file) => file.endsWith(MD_EXTENSION))
      .map((file) => file.slice(0, -MD_EXTENSION.length))
      .filter((slug) => SLUG_PATTERN.test(slug))
      .sort();
  } catch {
    return [];
  }
}

export async function getStudyDoc(slug: string): Promise<StudyDoc | null> {
  if (!SLUG_PATTERN.test(slug)) return null;

  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${slug}${MD_EXTENSION}`), 'utf8');
    return parseStudyDoc(slug, raw);
  } catch {
    return null;
  }
}

/** 학습 문서들의 최신 수정 시각. dev에서 md 저장을 감지해 화면을 갱신하는 데 쓴다. */
export async function getStudyContentStamp(): Promise<number> {
  try {
    const files = await readdir(CONTENT_DIR);
    const stats = await Promise.all(
      files.filter((file) => file.endsWith(MD_EXTENSION)).map((file) => stat(path.join(CONTENT_DIR, file))),
    );
    return Math.max(0, ...stats.map((fileStat) => fileStat.mtimeMs));
  } catch {
    return 0;
  }
}

export async function getStudyDocs(): Promise<StudyDoc[]> {
  const slugs = await getStudyDocSlugs();
  const docs = await Promise.all(slugs.map(getStudyDoc));
  return docs.filter((doc): doc is StudyDoc => doc !== null);
}
