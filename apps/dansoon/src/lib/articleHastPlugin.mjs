// 본문 폭(42rem)의 1x·1.5x·2x — 모바일이 1536px 원본을 받지 않게 한다. 원본보다 큰 폭은 Astro가 건너뛴다
const ARTICLE_IMAGE_WIDTHS = [640, 960, 1344];
const ARTICLE_IMAGE_SIZES = '(min-width: 42rem) 42rem, 100vw';
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
  // 표 영역마다 이름이 같으면 스크린 리더가 영역을 구분하지 못한다(axe landmark-unique) — 번호로 나눈다
  let tableCount = 0;
  return {
    name: 'dansoon-article',
    element: {
      filter: [...HEADINGS, 'table', 'a', 'img'],
      visit(node, ctx) {
        if (node.tagName === 'img') {
          ctx.setProperty(node, 'widths', ARTICLE_IMAGE_WIDTHS);
          ctx.setProperty(node, 'sizes', ARTICLE_IMAGE_SIZES);
          return;
        }
        if (node.tagName === 'a') {
          if (!EXTERNAL_LINK.test(String(node.properties?.href ?? ''))) return;
          ctx.setProperty(node, 'target', '_blank');
          ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
          return;
        }
        if (node.tagName === 'table') {
          ctx.wrapNode(node, {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: `표 ${(tableCount += 1)} (가로 스크롤)` },
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
