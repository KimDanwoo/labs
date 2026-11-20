import path from 'node:path';
import {
  importVisitors,
  INDEX_FILE,
  ITEM_ENTRY_SEGMENTS,
  LAYERS,
  location,
  moduleLocation,
  PUBLIC_ENTRY,
  SHARED_SEGMENTS,
  sharedItem,
  SLICE_SEGMENTS,
  SLICED_LAYERS,
  TEST_FILE,
} from './paths.mjs';

function structureProblem(own) {
  const parts = own.rest.split('/');
  const basename = parts.at(-1);
  if (own.layer === 'shared') {
    if (!SHARED_SEGMENTS.has(parts[0]))
      return 'shared 바로 아래는 ui/, lib/, api/, config/ 세그먼트만 둔다. 도메인 코드는 쓰는 슬라이스로 옮긴다.';
    if (parts.length === 2 && ITEM_ENTRY_SEGMENTS.has(parts[0]) && INDEX_FILE.test(basename))
      return `shared/${parts[0]} 전체를 묶는 index.ts를 두지 않는다. 항목마다 진입점을 둔다.`;
    return null;
  }
  const inner = parts.slice(1);
  if (inner.length === 1)
    return INDEX_FILE.test(basename) ? null : '슬라이스 루트에는 공개 API(index.ts, index.server.ts)만 둔다.';
  if (!SLICE_SEGMENTS.has(inner[0])) return '슬라이스는 ui/, model/, api/, lib/, config/ 세그먼트로 나눈다.';
  if (INDEX_FILE.test(basename)) return '세그먼트 안에 index.ts를 두지 않는다. 공개 API는 슬라이스 루트 하나다.';
  return null;
}

export const structure = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const own = location(context.filename);
        if (!own || (!SLICED_LAYERS.has(own.layer) && own.layer !== 'shared')) return;
        const message = structureProblem(own);
        if (message) context.report({ node, message });
      },
    };
  },
};

function sharedImportProblem(from, to) {
  const parts = to.rest.split('/').filter((part) => !PUBLIC_ENTRY.test(part));
  if (from?.layer === 'shared' && sharedItem(from.rest) === sharedItem(to.rest)) return null;
  if (parts.length > 2) return 'shared는 세그먼트 또는 항목 진입점까지만 import한다(@shared/lib/<항목>).';
  if (parts.length === 1 && ITEM_ENTRY_SEGMENTS.has(parts[0]))
    return `@shared/${parts[0]}/<항목>처럼 항목 진입점으로 import한다.`;
  return null;
}

function slicedImportProblem(from, to, source) {
  const inner = to.rest.split('/').slice(1);
  const isEntry = inner.length === 0 || (inner.length === 1 && PUBLIC_ENTRY.test(inner[0]));
  const isOwnSlice = from?.layer === to.layer && from.slice === to.slice;
  if (!isOwnSlice) return isEntry ? null : `${to.layer}/${to.slice}는 공개 API(index.ts)로만 import한다.`;
  if (isEntry) return '슬라이스 안에서 자기 공개 API를 import하지 않는다(순환 참조).';
  if (!source.startsWith('.')) return '슬라이스 안에서는 상대경로로 import한다.';
  return null;
}

function publicApiProblem(from, to, source) {
  if (to.layer === 'shared') return sharedImportProblem(from, to);
  if (!SLICED_LAYERS.has(to.layer)) return null;
  return slicedImportProblem(from, to, source);
}

export const publicApi = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const from = location(filename);
    const isEntryFile = from && INDEX_FILE.test(path.posix.basename(filename));
    function check(node, source) {
      if (typeof source !== 'string' || TEST_FILE.test(filename)) return;
      const to = moduleLocation(filename, source, context.cwd.replaceAll('\\', '/'));
      if (!to) return;
      const message = publicApiProblem(from, to, source);
      if (message) context.report({ node, message });
    }
    return {
      ...importVisitors(check),
      ExportAllDeclaration(node) {
        if (isEntryFile) context.report({ node, message: '공개 API에서 export *를 쓰지 않는다. 이름을 명시한다.' });
        else check(node.source, node.source.value);
      },
    };
  },
};

export const dependencies = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    function check(node, source) {
      if (typeof source !== 'string') return;
      const from = location(context.filename);
      const to = moduleLocation(context.filename, source, context.cwd);
      if (!from || !to) return;
      if (LAYERS.indexOf(to.layer) < LAYERS.indexOf(from.layer)) {
        context.report({ node, message: `${from.layer}에서 상위 레이어 ${to.layer}를 참조할 수 없다.` });
      } else if (from.layer === to.layer && SLICED_LAYERS.has(from.layer) && from.slice !== to.slice) {
        context.report({
          node,
          message: `같은 레이어의 ${from.slice} → ${to.slice} 교차 참조를 금지한다. 도메인을 합치거나 공통 책임을 하위 레이어로 옮긴다.`,
        });
      }
    }
    return importVisitors(check);
  },
};
