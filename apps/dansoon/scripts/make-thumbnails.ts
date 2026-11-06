/**
 * 글 폴더의 cover.jpg(제목 없는 배경)에 제목을 얹어 thumbnail.jpg(목록·링크 미리보기용)를 만든다.
 * 제목이나 카테고리를 바꾸면 다시 실행한다(앱 폴더에서): node scripts/make-thumbnails.ts [slug...]
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { OG_ACCENT, renderThumbnail } from '../src/lib/ogImage.ts';
import { CATEGORY_IDS, CATEGORY_LABEL, type CategoryId } from '../src/lib/taxonomy.ts';

const POSTS_DIR = 'contents/posts';

const frontmatterValue = (markdown: string, key: string) =>
  markdown.match(new RegExp(`^${key}:\\s*(["']?)(.+)\\1\\s*$`, 'm'))?.[2];

const isCategory = (value: string | undefined): value is CategoryId =>
  (CATEGORY_IDS as readonly (string | undefined)[]).includes(value);

async function makeThumbnail(slug: string) {
  const dir = `${POSTS_DIR}/${slug}`;
  const cover = await readFile(`${dir}/cover.jpg`).catch(() => undefined);
  if (!cover) return false;

  const markdown = await readFile(`${dir}/index.md`, 'utf8');
  const title = frontmatterValue(markdown, 'title');
  const category = frontmatterValue(markdown, 'category');
  if (!title || !isCategory(category)) throw new Error(`${slug}: frontmatter의 title·category를 읽지 못했다`);

  const card = { label: CATEGORY_LABEL[category], color: OG_ACCENT[category], title };
  await writeFile(`${dir}/thumbnail.jpg`, await renderThumbnail(card, cover));
  return true;
}

const requested = process.argv.slice(2);
const slugs = requested.length > 0 ? requested : await readdir(POSTS_DIR);
for (const slug of slugs) {
  if (await makeThumbnail(slug)) console.log(`thumbnail: ${slug}`);
}
