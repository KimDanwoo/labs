import { location, segmentOf, SLICED_LAYERS } from './paths.mjs';

const JOTAI_MODULE = /^jotai(?:\/|$)|^jotai-family$/;

const ATOM_FACTORY = /^atom(?:With\w+|Family)?$/;

export const entityState = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    const own = location(context.filename);
    const isAllowed = own && SLICED_LAYERS.has(own.layer) && segmentOf(own) === 'model';
    if (!own || isAllowed) return {};
    const factories = new Set();
    const namespaces = new Set();
    function isAtomFactory(callee) {
      if (callee.type === 'Identifier') return factories.has(callee.name);
      return (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        namespaces.has(callee.object.name) &&
        callee.property.type === 'Identifier' &&
        ATOM_FACTORY.test(callee.property.name)
      );
    }
    return {
      ImportDeclaration(node) {
        if (!JOTAI_MODULE.test(node.source.value)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') namespaces.add(specifier.local.name);
          else if (specifier.type === 'ImportSpecifier' && ATOM_FACTORY.test(specifier.imported.name))
            factories.add(specifier.local.name);
        }
      },
      CallExpression(node) {
        if (isAtomFactory(node.callee))
          context.report({ node, message: '전역 atom은 쓰는 슬라이스의 model/에서 정의한다.' });
      },
    };
  },
};
