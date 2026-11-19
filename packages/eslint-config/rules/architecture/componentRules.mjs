import path from 'node:path';
import { location, ROUTE_FILE, segmentOf, SLICED_LAYERS } from './paths.mjs';

export const componentFile = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    if (!context.filename.endsWith('.tsx')) return {};
    const own = location(context.filename);
    if (!own || !SLICED_LAYERS.has(own.layer)) return {};
    const basename = path.basename(context.filename, '.tsx');
    function check(node, name) {
      if (!name || !/^[A-Z]/.test(name)) return;
      if (segmentOf(own) !== 'ui') {
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

export const routingLocation = {
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

export const interactiveComposition = {
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
