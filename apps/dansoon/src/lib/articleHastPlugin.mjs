/**
 * 글 본문 HTML 후처리(Sätteri hast 플러그인).
 * - 제목(h2~h4)에 id와 앵커 링크를 단다. 앵커 글자는 CSS로 그려 목차 텍스트에 섞이지 않게 한다.
 * - 표를 키보드로도 가로 스크롤할 수 있는 영역으로 감싼다.
 * - 외부 링크는 새 탭으로 연다(블로그 안 링크는 같은 탭에서 페이지 전환으로 이동한다).
 * Astro의 heading-ids 플러그인은 이미 있는 id를 그대로 쓰므로 목차와 앵커가 같은 id를 공유한다.
 */
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ANCHOR_HEADINGS = new Set(['h2', 'h3', 'h4']);
const FALLBACK_SLUG = 'section';
const EXTERNAL_LINK = /^https?:\/\//i;

const slugify = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\s-]/gu, '')
    .replace(/\s+/g, '-') || FALLBACK_SLUG;

/** 이미 쓴 최종 id를 모두 기억해 'x, x, x-1' 같은 제목에서도 id가 겹치지 않게 한다. */
function createUniqueIds() {
  const used = new Set();
  return (preferred) => {
    let id = preferred;
    for (let suffix = 1; used.has(id); suffix += 1) id = `${preferred}-${suffix}`;
    used.add(id);
    return id;
  };
}

/** 문서마다 새로 만들어 slug 중복 카운트가 글 사이에 섞이지 않게 한다. */
export function articleHastPlugin() {
  const uniqueId = createUniqueIds();
  return {
    name: 'dansoon-article',
    element: {
      filter: [...HEADINGS, 'table', 'a'],
      visit(node, ctx) {
        if (node.tagName === 'a') {
          if (!EXTERNAL_LINK.test(String(node.properties?.href ?? ''))) return;
          ctx.setProperty(node, 'target', '_blank');
          // 새 탭이 window.opener로 이 페이지를 조작하지 못하게 한다
          ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
          return;
        }
        if (node.tagName === 'table') {
          ctx.wrapNode(node, {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: '표 (가로 스크롤)' },
            children: [],
          });
          return;
        }
        const text = ctx.textContent(node);
        const existingId = typeof node.properties?.id === 'string' ? node.properties.id : undefined;
        const id = uniqueId(existingId ?? slugify(text));
        ctx.setProperty(node, 'id', id);
        if (!ANCHOR_HEADINGS.has(node.tagName)) return;
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: { className: ['heading-anchor'], href: `#${id}`, ariaLabel: `'${text}' 섹션 링크` },
          children: [],
        });
      },
    },
  };
}
