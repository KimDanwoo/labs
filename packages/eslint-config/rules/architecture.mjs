import path from 'node:path';

const LAYERS = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = new Set(['views', 'widgets', 'features', 'entities']);
const MODEL_SEGMENTS = new Set(['hooks', 'types', 'constants', 'store', 'services', 'server', 'actions', '__tests__']);
const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|sitemap|robots|manifest)$/;

function location(filename) {
  const match = filename.replaceAll('\\', '/').match(/^(.*)\/src\/(app|views|widgets|features|entities|shared)\/(.*)$/);
  return match ? { root: match[1], layer: match[2], rest: match[3], slice: match[3].split('/')[0] } : null;
}

function moduleLocation(filename, source) {
  const own = location(filename);
  if (!own) return null;
  if (source.startsWith('.')) return location(path.posix.resolve(path.posix.dirname(filename), source));
  if (/^@(app|views|widgets|features|entities|shared)\//.test(source))
    return location(path.posix.normalize(`${own.root}/src/${source.slice(1)}`));
  return null;
}

const structure = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const own = location(context.filename);
        if (!own || !SLICED_LAYERS.has(own.layer)) return;
        const parts = own.rest.split('/').slice(1);
        if (parts.length === 1 && own.layer === 'views' && /^[A-Z]\w*View\.tsx$/.test(parts[0])) return;
        if (!['ui', 'model', 'lib'].includes(parts[0])) {
          context.report({
            node,
            message: '슬라이스는 ui/, model/, lib/로 나눈다. 메인 *View.tsx만 views 슬라이스 루트에 둔다.',
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
    return {
      ImportDeclaration: (node) => check(node.source, node.source.value),
      ExportNamedDeclaration: (node) => {
        if (node.source) check(node.source, node.source.value);
      },
      ExportAllDeclaration: (node) => check(node.source, node.source.value),
      ImportExpression: (node) => check(node.source, node.source.value),
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
      if (!own.rest.includes('/ui/') && !(own.layer === 'views' && basename.endsWith('View'))) {
        context.report({
          node,
          message: '컴포넌트는 ui/ 또는 메인 *View.tsx에 둔다. 훅 파일에 Provider를 함께 선언하지 않는다.',
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
          (own.layer !== 'entities' || !own.rest.includes('/model/store/'))
        ) {
          context.report({ node, message: '전역 atom은 entities/<domain>/model/store/에서 정의한다.' });
        }
      },
    };
  },
};

export default {
  rules: {
    'slice-structure': structure,
    'independent-slices': dependencies,
    'component-file': componentFile,
    'routing-location': routingLocation,
    'entity-state': entityState,
    'interactive-composition': interactiveComposition,
  },
};
