import path from 'node:path';

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = new Set(['pages', 'widgets', 'features', 'entities']);
// Next.js의 app·pages 폴더와 겹치지 않게 두 레이어 폴더에만 _를 붙인다(공식 Next.js 가이드).
const layerDir = (layer) => (layer === 'app' || layer === 'pages' ? `_${layer}` : layer);
const MODEL_SEGMENTS = new Set(['hooks', 'types', 'constants', 'store', 'services', 'server', 'actions', '__tests__']);
const SLICE_SEGMENTS = ['ui', 'model', 'lib', 'api', 'config'];
const PUBLIC_ENTRY = /^index(?:\.server)?(?:\.tsx?)?$/;
const TEST_FILE = /__tests__|\.(?:test|spec)\.[cm]?[jt]sx?$/;
const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|sitemap|robots|manifest)$/;

function location(filename) {
  const match = filename
    .replaceAll('\\', '/')
    .match(/^(.*)\/src\/(_app|_pages|widgets|features|entities|shared)\/(.*)$/);
  return match
    ? { root: match[1], layer: match[2].replace(/^_/, ''), rest: match[3], slice: match[3].split('/')[0] }
    : null;
}

function moduleLocation(filename, source, appRoot = location(filename)?.root) {
  if (!appRoot) return null;
  if (source.startsWith('.')) return location(path.posix.resolve(path.posix.dirname(filename), source));
  const alias = source.match(/^@(app|pages|widgets|features|entities|shared)\/(.*)$/);
  if (alias) return location(path.posix.normalize(`${appRoot}/src/${layerDir(alias[1])}/${alias[2]}`));
  return null;
}

// 문자열이나 보간 없는 템플릿 리터럴만 정적으로 판정할 수 있다.
function staticSource(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}

function onModuleSources(check) {
  return {
    ImportDeclaration: (node) => check(node.source, node.source.value),
    ExportNamedDeclaration: (node) => {
      if (node.source) check(node.source, node.source.value);
    },
    ExportAllDeclaration: (node) => check(node.source, node.source.value),
    ImportExpression: (node) => check(node.source, staticSource(node.source)),
    TSImportType: (node) => check(node, staticSource(node.argument?.literal ?? node.argument)),
  };
}

const structure = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const own = location(context.filename);
        if (!own || !SLICED_LAYERS.has(own.layer)) return;
        const parts = own.rest.split('/').slice(1);
        if (parts.length === 1 && PUBLIC_ENTRY.test(parts[0])) return;
        if (/^index\.tsx?$/.test(parts.at(-1))) {
          context.report({
            node,
            message: '세그먼트 안에는 index.ts(배럴)를 두지 않는다. 공개 API는 슬라이스 루트 index.ts다.',
          });
        } else if (!SLICE_SEGMENTS.includes(parts[0])) {
          context.report({
            node,
            message:
              '슬라이스 루트에는 공개 API(index.ts, index.server.ts)만 두고, 코드는 ui/, model/, lib/, api/, config/에 둔다.',
          });
        } else if (parts[0] === 'model' && (parts.length < 3 || !MODEL_SEGMENTS.has(parts[1]))) {
          context.report({
            node,
            message: 'model은 hooks/, types/, constants/, store/, services/, server/, actions/ 세그먼트로 나눈다.',
          });
        }
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
      const to = moduleLocation(context.filename, source);
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
    return onModuleSources(check);
  },
};

const publicApi = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    if (TEST_FILE.test(filename)) return {};
    const from = location(filename);
    const appRoot = from?.root ?? context.cwd.replaceAll('\\', '/');
    const isEntryFile =
      from && SLICED_LAYERS.has(from.layer) && PUBLIC_ENTRY.test(from.rest.split('/').slice(1).join('/'));
    function check(node, source) {
      if (typeof source !== 'string') return;
      const to = moduleLocation(filename, source, appRoot);
      if (!to || !SLICED_LAYERS.has(to.layer)) return;
      const inner = to.rest.split('/').slice(1);
      const isEntry = inner.length === 0 || (inner.length === 1 && PUBLIC_ENTRY.test(inner[0]));
      const sameSlice = from?.layer === to.layer && from.slice === to.slice;
      if (sameSlice && isEntry) {
        context.report({
          node,
          message: '자기 슬라이스의 공개 API를 import하지 않는다. 구현 파일을 상대경로로 가져온다.',
        });
      } else if (sameSlice && source.startsWith('@')) {
        context.report({ node, message: '슬라이스 안에서는 alias 대신 상대경로로 구현 파일을 가져온다.' });
      } else if (!sameSlice && !isEntry) {
        context.report({
          node,
          message: `${to.layer}/${to.slice}의 내부 파일 대신 공개 API(@${to.layer}/${to.slice})를 import한다.`,
        });
      }
    }
    const visitors = onModuleSources(check);
    if (!isEntryFile) return visitors;
    return {
      ...visitors,
      ExportAllDeclaration(node) {
        context.report({ node, message: '공개 API는 export * 대신 밖에서 쓰는 이름만 명시적으로 재수출한다.' });
        visitors.ExportAllDeclaration(node);
      },
    };
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
        context.report({
          node,
          message: '컴포넌트는 ui/에 둔다. 훅 파일에 Provider를 함께 선언하지 않는다.',
        });
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
            message: 'Next 라우팅 파일은 앱 루트 app/에 둔다. src/_app/은 전역 설정과 providers만 담당한다.',
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
          (!SLICED_LAYERS.has(own.layer) || !own.rest.includes('/model/store/'))
        ) {
          context.report({
            node,
            message: '전역 atom은 쓰는 슬라이스의 model/store/에서 정의한다. 여러 슬라이스가 쓰면 entities로 내린다.',
          });
        }
      },
    };
  },
};

export default {
  rules: {
    'slice-structure': structure,
    'independent-slices': dependencies,
    'public-api': publicApi,
    'component-file': componentFile,
    'routing-location': routingLocation,
    'entity-state': entityState,
    'interactive-composition': interactiveComposition,
  },
};
