import path from 'node:path';

export const LAYERS = ['app', 'views', 'features', 'entities', 'shared'];

export const SLICED_LAYERS = new Set(['views', 'features', 'entities']);

export const SLICE_SEGMENTS = new Set(['ui', 'model', 'api', 'lib', 'config']);

export const SHARED_SEGMENTS = new Set(['ui', 'lib', 'api', 'config']);

export const ITEM_ENTRY_SEGMENTS = new Set(['ui', 'lib']);

const LAYER_PATH = /^(.*)\/src\/(app|views|features|entities|shared)\/(.*)$/;

const LAYER_ALIAS = /^@(app|views|features|entities|shared)\//;

export const PUBLIC_ENTRY = /^index(?:\.server)?(?:\.tsx?)?$/;

export const INDEX_FILE = /^index(?:\.server)?\.tsx?$/;

export const TEST_FILE = /\/__tests__\/|\.(?:test|spec)\.[cm]?[jt]sx?$/;

export const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|sitemap|robots|manifest)$/;

export function location(filename) {
  const match = filename.replaceAll('\\', '/').match(LAYER_PATH);
  return match ? { root: match[1], layer: match[2], rest: match[3], slice: match[3].split('/')[0] } : null;
}

export function moduleLocation(filename, source, cwd) {
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

export function importVisitors(check) {
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

export function sharedItem(rest) {
  const [segment, item = ''] = rest.split('/');
  return `${segment}/${item.replace(/\.[cm]?[jt]sx?$/, '')}`;
}

export function segmentOf(own) {
  return own.rest.split('/')[1];
}
