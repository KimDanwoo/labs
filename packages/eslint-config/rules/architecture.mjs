import path from 'node:path';

const LAYERS = ['app', 'views', 'features', 'entities', 'shared'];
const SLICED_LAYERS = new Set(['views', 'features', 'entities']);
const SLICE_SEGMENTS = new Set(['ui', 'model', 'api', 'lib', 'config']);
const SHARED_SEGMENTS = new Set(['ui', 'lib', 'api', 'config']);
const ITEM_ENTRY_SEGMENTS = new Set(['ui', 'lib']);
const LAYER_PATH = /^(.*)\/src\/(app|views|features|entities|shared)\/(.*)$/;
const LAYER_ALIAS = /^@(app|views|features|entities|shared)\//;
const PUBLIC_ENTRY = /^index(?:\.server)?(?:\.tsx?)?$/;
const INDEX_FILE = /^index(?:\.server)?\.tsx?$/;
const TEST_FILE = /\/__tests__\/|\.(?:test|spec)\.[cm]?[jt]sx?$/;
const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|sitemap|robots|manifest)$/;

function location(filename) {
  const match = filename.replaceAll('\\', '/').match(LAYER_PATH);
  return match ? { root: match[1], layer: match[2], rest: match[3], slice: match[3].split('/')[0] } : null;
}

function moduleLocation(filename, source, cwd) {
  if (source.startsWith('.')) return location(path.posix.resolve(path.posix.dirname(filename), source));
  if (!LAYER_ALIAS.test(source)) return null;
  const root = location(filename)?.root ?? cwd;
  return location(path.posix.normalize(`${root}/src/${source.slice(1)}`));
}

function staticSource(node) {
  if (node?.type === 'Literal') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}

function importVisitors(check) {
  return {
    ImportDeclaration: (node) => check(node.source, node.source.value),
    ExportNamedDeclaration: (node) => {
      if (node.source) check(node.source, node.source.value);
    },
    ExportAllDeclaration: (node) => check(node.source, node.source.value),
    ImportExpression: (node) => check(node.source, staticSource(node.source)),
    TSImportType: (node) => check(node, staticSource(node.source ?? node.argument?.literal ?? node.argument)),
  };
}

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

const structure = {
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

function publicApiProblem(from, to, source) {
  const inner = to.rest.split('/').slice(1);
  if (to.layer === 'shared') {
    if (from?.layer === 'shared') return null;
    const parts = to.rest.split('/').filter((part) => !PUBLIC_ENTRY.test(part));
    if (parts.length > 2) return 'shared는 세그먼트 또는 항목 진입점까지만 import한다(@shared/lib/<항목>).';
    if (parts.length === 1 && ITEM_ENTRY_SEGMENTS.has(parts[0]))
      return `@shared/${parts[0]}/<항목>처럼 항목 진입점으로 import한다.`;
    return null;
  }
  if (!SLICED_LAYERS.has(to.layer)) return null;
  const isEntry = inner.length === 0 || (inner.length === 1 && PUBLIC_ENTRY.test(inner[0]));
  const isOwnSlice = from?.layer === to.layer && from.slice === to.slice;
  if (!isOwnSlice) return isEntry ? null : `${to.layer}/${to.slice}는 공개 API(index.ts)로만 import한다.`;
  if (isEntry) return '슬라이스 안에서 자기 공개 API를 import하지 않는다(순환 참조).';
  if (!source.startsWith('.')) return '슬라이스 안에서는 상대경로로 import한다.';
  return null;
}

const publicApi = {
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

const dependencies = {
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

const componentFile = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    if (!context.filename.endsWith('.tsx')) return {};
    const own = location(context.filename);
    if (!own || !SLICED_LAYERS.has(own.layer)) return {};
    const basename = path.basename(context.filename, '.tsx');
    function check(node, name) {
      if (!name || !/^[A-Z]/.test(name)) return;
      if (!own.rest.includes('/ui/')) {
        context.report({ node, message: '컴포넌트는 ui/에 둔다. 훅 파일에 Provider를 함께 선언하지 않는다.' });
      } else if (name !== basename) {
        context.report({ node, message: `컴포넌트 ${name}은 ${name}.tsx로 분리한다.` });
      }
    }
    return {
      FunctionDeclaration: (node) => check(node, node.id?.name),
      ClassDeclaration: (node) => {
        if (node.superClass) check(node, node.id?.name);
      },
      VariableDeclarator: (node) => {
        if (node.init && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init.type))
          check(node, node.id.name);
      },
    };
  },
};

const routingLocation = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const own = location(context.filename);
        if (own?.layer === 'app' && ROUTE_FILE.test(path.basename(context.filename).split('.')[0])) {
          context.report({
            node,
            message: 'Next 라우팅 파일은 앱 루트 app/에 둔다. src/app/은 전역 설정과 providers만 담당한다.',
          });
        }
      },
    };
  },
};

const interactiveComposition = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      JSXElement(node) {
        if (!['Link', 'a'].includes(node.openingElement.name.name)) return;
        for (const child of node.children) {
          if (child.type !== 'JSXElement' || !['Button', 'button'].includes(child.openingElement.name.name)) continue;
          if (child.openingElement.attributes.some((attribute) => attribute.name?.name === 'asChild')) continue;
          context.report({
            node: child,
            message: '링크 안에 버튼을 중첩하지 않는다. Button asChild 안에 Link를 넣어 하나의 링크로 렌더링한다.',
          });
        }
      },
    };
  },
};

const entityState = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      CallExpression(node) {
        const own = location(context.filename);
        if (
          own &&
          node.callee.type === 'Identifier' &&
          /^atom(?:With\w+|Family)?$/.test(node.callee.name) &&
          (!SLICED_LAYERS.has(own.layer) || !own.rest.includes('/model/'))
        ) {
          context.report({ node, message: '전역 atom은 쓰는 슬라이스의 model/에서 정의한다.' });
        }
      },
    };
  },
};

export default {
  rules: {
    'slice-structure': structure,
    'public-api': publicApi,
    'independent-slices': dependencies,
    'component-file': componentFile,
    'routing-location': routingLocation,
    'entity-state': entityState,
    'interactive-composition': interactiveComposition,
  },
};
