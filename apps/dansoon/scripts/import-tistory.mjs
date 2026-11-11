/**
 * 티스토리(dansoon-dev.tistory.com) 글을 contents/posts/<slug>/index.md로 옮긴다.
 * 재실행하면 같은 입력에서 같은 결과를 덮어쓴다. 실행: pnpm --filter dansoon import:tistory
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import TurndownService from 'turndown';
import { encodePostImage } from './lib/postImage.mjs';

const BLOG_ORIGIN = 'https://dansoon-dev.tistory.com';
const CONTENT_DIR = new URL('../contents/posts/', import.meta.url);
// 사람이 다듬은 목록용 요약(slug → 요약). 없으면 본문 앞부분에서 만든다
const CURATED_DESCRIPTIONS = JSON.parse(
  await readFile(new URL('./tistory-descriptions.json', import.meta.url), 'utf8'),
);
const USER_AGENT = 'Mozilla/5.0 (dansoon tistory importer)';
const BODY_START = '<div class="tt_article_useless_p_margin contents_style">';
const BODY_END = '<!-- System - START -->';
// 대표 이미지를 따로 지정하지 않은 글은 og:image가 티스토리 기본 이미지(tistory_admin)를 가리킨다
const DEFAULT_THUMBNAIL_MARKER = 'tistory_admin';
const DESCRIPTION_MAX_LENGTH = 140;
const MS_PER_DAY = 86_400_000;

/** 티스토리 글 번호 → 새 글 메타. slug는 한 번 정하면 바꾸지 않는다(URL). */
const POSTS = {
  3: { slug: 'vanilla-js-spa', category: 'dev', tags: ['javascript', 'spa'] },
  4: {
    slug: 'build-my-own-react',
    category: 'dev',
    tags: ['react', 'javascript'],
  },
  5: { slug: 'implement-react-hooks', category: 'dev', tags: ['react'] },
  6: {
    slug: 'react-context-hook-refactoring',
    category: 'dev',
    tags: ['react', 'state-management'],
  },
  7: {
    slug: 'fsd-state-management-refactoring',
    category: 'dev',
    tags: ['fsd', 'state-management'],
  },
  8: {
    slug: 'test-code-fsd-refactoring',
    category: 'dev',
    tags: ['testing', 'fsd'],
  },
  9: { slug: 'test-scenario-e2e', category: 'dev', tags: ['testing'] },
  10: {
    slug: 'deploy-automation-s3-github-actions',
    category: 'dev',
    tags: ['ci-cd'],
  },
  11: { slug: 'hanghae-plus-retrospective', category: 'retro', tags: [] },
  12: { slug: 'import-path-alias-barrel-fsd', category: 'dev', tags: ['fsd', 'architecture'] },
  13: { slug: 'fsd-guide', category: 'dev', tags: ['fsd', 'architecture'] },
  14: { slug: 'retrospective-2024', category: 'retro', tags: [] },
  15: { slug: 'retrospective-2025-q1', category: 'retro', tags: [] },
  16: { slug: 'js-react-design-patterns-study', category: 'reading', tags: ['react', 'design-pattern'] },
  17: { slug: 'grokking-simplicity-study', category: 'reading', tags: ['functional-programming'] },
  18: { slug: 'javascript-flow-and-structure', category: 'dev', tags: ['javascript'] },
  19: { slug: 'pragmatic-programmer', category: 'reading', tags: [] },
  20: { slug: 'seo-structural-evolution', category: 'dev', tags: ['seo'] },
  21: { slug: 'writing-for-developers', category: 'reading', tags: ['writing'] },
  22: { slug: 'vue-ref-reactive-vs-react-usestate', category: 'dev', tags: ['vue', 'react'] },
  23: { slug: 'fsd-2-1', category: 'dev', tags: ['fsd'] },
  24: { slug: 'nextjs-app-router-layout-seo', category: 'dev', tags: ['nextjs', 'seo'] },
  25: { slug: 'art-of-reading-code', category: 'reading', tags: [] },
  26: { slug: 'retrospective-2025', category: 'retro', tags: [] },
  27: { slug: 'service-with-100-domains', category: 'dev', tags: ['architecture'] },
  28: { slug: 'url-state-management', category: 'dev', tags: ['state-management'] },
  29: { slug: 'bestseller-aggregator', category: 'dev', tags: ['side-project'] },
  30: { slug: 'delegating-code-to-ai', category: 'dev', tags: ['ai'] },
  31: { slug: 'saju-service', category: 'dev', tags: ['ai', 'side-project'] },
};

/** 원문에 캡션이 없는 이미지의 대체 텍스트(글 번호 → 이미지 순서대로) */
const IMAGE_ALTS = {
  5: [
    'React DevTools Profiler 플레임 그래프 — ThemeProvider 업데이트, 렌더링 2ms',
    'React DevTools Profiler 플레임 그래프 — ThemeProvider 업데이트, 렌더링 6ms',
  ],
  11: ['항해 플러스 수료 단체 사진이 담긴 즉석 사진', '항해 플러스 블랙 배지 수료 카드 — 학습 505시간, 실력 상위 1%'],
  31: ['사주 서비스 제작기 표지 일러스트'],
};

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rarr: '→',
  larr: '←',
  middot: '·',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

/** 언어 표시가 없는 코드 블록의 언어를 내용으로 추정한다. 위에서부터 먼저 맞는 것을 쓴다. */
const LANGUAGE_HINTS = [
  ['text', /[├└│]──/],
  ['html', /^\s*(<!DOCTYPE|<html|<head|<body|<script|<!--|<div|<meta)/i],
  // 블록이 YAML 키로 시작하고 코드 기호(';', '//' 주석 줄)가 없을 때만 — TS 객체의 'type:' 같은 줄과 구분한다
  ['yaml', (code) => /^\s*(name|on|jobs):\s/.test(code) && !/;|^\s*\/\//m.test(code)],
  ['bash', /^\s*(\$ |pnpm |npm |npx |yarn |git |cd |mkdir |brew |curl )/m],
  ['json', /^\s*[{[]\s*"[^"]+"\s*:/],
  ['tsx', /<[A-Z][\w.]*[\s/>]|return \(\s*</],
  // 키워드·화살표 함수, 주석, 'fn(...);' 형태의 호출, 'key: value' 객체 줄
  [
    'ts',
    /\b(const|let|function|import|export|interface|type|class|async|await|module\.exports)\b|=>|^\s*\/\/|^\s*[\w.]+\(.*\);?\s*(\/\/.*)?$|^\s*\w+\s*:\s*[\w'"[{]/m,
  ],
];

const UNSAFE_MARKDOWN = /<(script|iframe|style|object|embed)\b|\son\w+\s*=|javascript:/i;
/** 펜스 코드 블록(목록 안 들여쓰기 포함)과 인라인 코드 */
const CODE_PATTERN = /^( *)(`{3,})[^\n]*\n[\s\S]*?\n\1\2[ \t]*$|`[^`\n]*`/gm;

/** 코드는 원문 그대로 두고 나머지 본문에만 변환을 적용한다. */
function mapProse(markdown, transform) {
  let result = '';
  let cursor = 0;
  for (const match of markdown.matchAll(CODE_PATTERN)) {
    result += transform(markdown.slice(cursor, match.index)) + match[0];
    cursor = match.index + match[0].length;
  }
  return result + transform(markdown.slice(cursor));
}

/** 코드는 텍스트로만 렌더링되므로, 코드 밖에 남은 HTML만 검사한다. */
function hasUnsafeHtml(markdown) {
  return UNSAFE_MARKDOWN.test(markdown.replace(CODE_PATTERN, ''));
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => NAMED_ENTITIES[name] ?? entity);
}

function readMeta(html, property) {
  const match = html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`));
  return match ? decodeEntities(match[1]) : null;
}

/** og:image는 티스토리 리사이즈 프록시 주소다 — fname 파라미터에 원본 주소가 들어 있다. */
function thumbnailUrlOf(ogImage) {
  if (!ogImage) return null;
  const original = new URL(ogImage).searchParams.get('fname');
  return original && !original.includes(DEFAULT_THUMBNAIL_MARKER) ? original : null;
}

async function fetchArticle(id) {
  const response = await fetch(`${BLOG_ORIGIN}/${id}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const html = await response.text();
  const [, afterStart] = html.split(BODY_START);
  if (!afterStart) throw new Error(`${id}: 본문 시작 표시를 찾지 못함`);
  return {
    title: readMeta(html, 'og:title'),
    thumbnailUrl: thumbnailUrlOf(readMeta(html, 'og:image')),
    publishedAt: readMeta(html, 'article:published_time'),
    modifiedAt: readMeta(html, 'article:modified_time'),
    bodyHtml: afterStart.split(BODY_END)[0].replace(/<\/div>\s*$/, ''),
  };
}

function guessLanguage(code) {
  const matches = (hint) => (typeof hint === 'function' ? hint(code) : hint.test(code));
  return LANGUAGE_HINTS.find(([, hint]) => matches(hint))?.[0] ?? 'text';
}

function fence(code, language) {
  const longestRun = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length));
  const marker = '`'.repeat(longestRun + 1);
  return `\n\n${marker}${language}\n${code.replace(/\n+$/, '')}\n${marker}\n\n`;
}

function imageExtension(fileName, url) {
  const source = fileName || new URL(url).pathname;
  const match = source.match(/\.(png|jpe?g|gif|webp|svg)$/i);
  const extension = match?.[0].toLowerCase();
  return extension === '.svg' || extension === '.gif' ? extension : '.webp';
}

function createConverter(images, alts = []) {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    hr: '---',
  });
  service.remove(['script', 'style', 'iframe', 'button', 'noscript']);

  // 본문의 '<T>' 같은 글자가 HTML 태그로 해석되지 않게 막는다
  const escapeMarkdown = service.escape.bind(service);
  service.escape = (text) => escapeMarkdown(text).replace(/</g, '\\<');

  // 티스토리가 간격용으로 넣은 빈 문단·빈 제목(&nbsp;)은 버린다
  service.addRule('blankBlock', {
    filter: (node) =>
      /^(P|H[1-6])$/.test(node.nodeName) &&
      node.textContent.trim() === '' &&
      node.getElementsByTagName('img').length === 0,
    replacement: () => '',
  });

  service.addRule('codeBlock', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (_, node) => {
      const code = node.textContent ?? '';
      const declared =
        node.getAttribute('data-ke-language') || node.querySelector('code')?.className.replace('language-', '');
      return fence(code, declared || guessLanguage(code));
    },
  });

  service.addRule('tistoryImage', {
    filter: (node) => node.nodeName === 'FIGURE' && /imageblock|imagegridblock/.test(node.className),
    replacement: (_, node) => {
      const caption = node.querySelector('figcaption')?.textContent?.trim() ?? '';
      const urls = [...node.querySelectorAll('[data-url]')].map((el) => el.getAttribute('data-url'));
      const sources = urls.length > 0 ? urls : [...node.querySelectorAll('img')].map((img) => img.getAttribute('src'));
      const lines = sources.filter(Boolean).map((url) => {
        const alt = caption || alts[images.length] || '';
        const file = `image-${images.length + 1}${imageExtension(node.getAttribute('data-filename'), url)}`;
        images.push({ url, file });
        return `![${alt}](./${file})`;
      });
      return `\n\n${lines.join('\n\n')}\n\n`;
    },
  });

  // turndown 내부 DOM(domino)의 NodeList는 iterable이 아닐 수 있어 Array.from으로 펼친다
  const elements = (node, tagName) => Array.from(node.getElementsByTagName(tagName));
  const cellsOf = (row) => Array.from(row.childNodes).filter((child) => /^T[DH]$/.test(child.nodeName));
  const cellMarkdown = (cell) => service.turndown(cell.innerHTML).trim().replace(/\n+/g, '<br>').replace(/\|/g, '\\|');

  service.addRule('table', {
    filter: 'table',
    replacement: (_, node) => {
      const cells = elements(node, 'tr').map(cellsOf);
      const hasMergedCells = cells.flat().some((cell) => cell.hasAttribute('colspan') || cell.hasAttribute('rowspan'));
      if (cells.length === 0 || hasMergedCells) return `\n\n${node.outerHTML}\n\n`;
      const rows = cells.map((row) => row.map(cellMarkdown));
      const width = Math.max(...rows.map((row) => row.length));
      const padded = rows.map((row) => [...row, ...Array(width - row.length).fill('')]);
      const [header, ...body] = padded;
      const lines = [header, header.map(() => '---'), ...body].map((row) => `| ${row.join(' | ')} |`);
      return `\n\n${lines.join('\n')}\n\n`;
    },
  });

  return service;
}

function rewriteLegacyLinks(markdown) {
  return markdown.replace(/\]\(https?:\/\/dansoon-dev\.tistory\.com\/(\d+)(#[^)\s]*)?\)/g, (link, id, hash = '') => {
    const target = POSTS[id];
    if (!target) {
      console.warn(`  ! 매핑 없는 티스토리 링크 유지: ${link}`);
      return link;
    }
    return `](/posts/${target.slug}/${hash})`;
  });
}

function normalizeBlankLines(markdown) {
  return mapProse(markdown, (prose) => prose.replace(/^[ \u00a0]+$/gm, '').replace(/\n{3,}/g, '\n\n')).trim();
}

function describe(bodyHtml) {
  const paragraphs = [...bodyHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(([, inner]) =>
      decodeEntities(inner.replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
  const text = paragraphs.join(' ');
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text;
  const clipped = text.slice(0, DESCRIPTION_MAX_LENGTH);
  const sentenceEnd = clipped.lastIndexOf('. ');
  return sentenceEnd > DESCRIPTION_MAX_LENGTH / 2 ? clipped.slice(0, sentenceEnd + 1) : `${clipped.trimEnd()}…`;
}

function isMeaningfullyUpdated(publishedAt, modifiedAt) {
  return Boolean(modifiedAt) && new Date(modifiedAt).getTime() - new Date(publishedAt).getTime() > MS_PER_DAY;
}

function toFrontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

async function downloadImage({ url, file }, directory) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.startsWith('image/'))
    throw new Error(`이미지 실패 ${response.status} ${contentType}: ${url}`);
  const target = new URL(file, directory);
  const original = Buffer.from(await response.arrayBuffer());
  if (/\.(svg|gif)$/.test(file)) return writeFile(target, original);
  // 사진 EXIF에 촬영 위치(GPS)·기기 정보가 남아 있을 수 있어, 방향만 적용하고 메타데이터 없이 다시 저장한다
  const output =
    file === 'thumbnail.jpg'
      ? await sharp(original).rotate().jpeg({ quality: 86, mozjpeg: true }).toBuffer()
      : await encodePostImage(original);
  await writeFile(target, output);
}

async function importPost(id, meta) {
  const article = await fetchArticle(id);
  const images = [];
  const markdown = normalizeBlankLines(
    rewriteLegacyLinks(createConverter(images, IMAGE_ALTS[id]).turndown(article.bodyHtml)),
  );
  if (hasUnsafeHtml(markdown)) throw new Error(`${id}: 변환 결과에 위험한 HTML이 남아 있음`);

  const directory = new URL(`${meta.slug}/`, CONTENT_DIR);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const thumbnail = article.thumbnailUrl ? { url: article.thumbnailUrl, file: 'thumbnail.jpg' } : null;
  await Promise.all([...images, ...(thumbnail ? [thumbnail] : [])].map((image) => downloadImage(image, directory)));

  const frontmatter = toFrontmatter({
    title: article.title,
    description: CURATED_DESCRIPTIONS[meta.slug] ?? describe(article.bodyHtml),
    publishedAt: article.publishedAt,
    updatedAt: isMeaningfullyUpdated(article.publishedAt, article.modifiedAt) ? article.modifiedAt : undefined,
    category: meta.category,
    tags: meta.tags,
    thumbnail: thumbnail ? `./${thumbnail.file}` : undefined,
    legacyUrl: `${BLOG_ORIGIN}/${id}`,
  });
  await writeFile(new URL('index.md', directory), `${frontmatter}\n${markdown}\n`);
  console.log(`✓ ${id} → ${meta.slug} (이미지 ${images.length}${thumbnail ? ', 썸네일' : ''})`);
}

for (const [id, meta] of Object.entries(POSTS)) {
  await importPost(id, meta);
}
