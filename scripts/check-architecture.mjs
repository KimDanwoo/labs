import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROTECTED_OPTIONS = ['strict', 'noUncheckedIndexedAccess', 'verbatimModuleSyntax'];
const LAYERS = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];
const PALETTE_CLASS =
  /\b(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|divide|shadow|decoration|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
const ARBITRARY_COLOR = /\b[a-z-]+-\[(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab|color-mix)\()/g;
const TOKEN_EXCEPTION = /token-exception:\s*\S/;
const UNSUPPORTED_WEIGHT = /\bfont-(?:thin|extralight|light|medium|extrabold|black)\b/;

export function validateManifest(manifest, workspaceNames, catalogNames) {
  const problems = [];
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (workspaceNames.has(name)) {
        if (version !== 'workspace:*') problems.push(`${name}: 워크스페이스 의존성은 workspace:*를 사용한다.`);
      } else if (!version.startsWith('catalog:')) {
        problems.push(`${name}: 버전은 pnpm-workspace.yaml의 catalog에서 관리한다.`);
      } else if (version === 'catalog:' && !catalogNames.has(name)) {
        problems.push(`${name}: 기본 catalog에 정의되지 않았다.`);
      }
    }
  }
  if (manifest.pnpm?.overrides && manifest.name !== 'labs')
    problems.push('pnpm.overrides는 루트 package.json에만 정의한다.');
  return problems;
}

export function validateTypeScript(config) {
  return PROTECTED_OPTIONS.filter((option) => config.compilerOptions?.[option] === false).map(
    (option) => `${option}: 공유 TypeScript 엄격 옵션을 해제할 수 없다.`,
  );
}

export function validateSourceTypes(text, filename) {
  const ast = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  const problems = [];
  function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) problems.push('any 대신 unknown과 타입 좁히기를 사용한다.');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return problems;
}

export function validateDesignTokens(text) {
  const problems = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (TOKEN_EXCEPTION.test(line) || TOKEN_EXCEPTION.test(lines[index - 1] ?? '')) return;
    const at = `${index + 1}행`;
    for (const [match] of line.matchAll(PALETTE_CLASS))
      problems.push(`${at}: 기본 팔레트 ${match} 대신 시맨틱 색 토큰을 쓴다.`);
    for (const [match] of line.matchAll(ARBITRARY_COLOR))
      problems.push(`${at}: 임의 색 값 ${match}… 대신 색 토큰을 쓴다.`);
    const weight = line.match(UNSUPPORTED_WEIGHT)?.[0];
    if (weight && !/\bfont-mono\b/.test(line))
      problems.push(`${at}: 마루부리에 없는 굵기 ${weight} 대신 font-normal·font-semibold·font-bold를 쓴다.`);
  });
  return problems;
}

export function findImportCycles(graph) {
  const active = new Set();
  const complete = new Set();
  const cycles = [];
  function visit(file, chain) {
    if (active.has(file)) {
      cycles.push([...chain.slice(chain.indexOf(file)), file]);
      return;
    }
    if (complete.has(file)) return;
    active.add(file);
    for (const target of graph.get(file) ?? []) visit(target, [...chain, file]);
    active.delete(file);
    complete.add(file);
  }
  for (const file of graph.keys()) visit(file, []);
  return cycles;
}

export function findServerLeaks(graph, clients, serverModules, actions) {
  const leaks = [];
  for (const client of clients) {
    const visited = new Set();
    function visit(file, chain) {
      if (actions.has(file) || visited.has(file)) return;
      visited.add(file);
      const next = [...chain, file];
      if (serverModules.has(file)) {
        leaks.push(next);
        return;
      }
      for (const target of graph.get(file) ?? []) visit(target, next);
    }
    visit(client, []);
  }
  return leaks;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', '.next', 'dist', 'out', '.astro', '.git', '.turbo', '.omc'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function checkRepository(root = ROOT) {
  const problems = [];
  const modules = new Map();
  const roots = [root];
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(path.join(root, group), { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(path.join(root, group, entry.name, 'package.json')))
        roots.push(path.join(root, group, entry.name));
    }
  }
  const workspaceNames = new Set(
    roots.map((dir) => JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).name),
  );
  const catalog =
    readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8')
      .split(/^catalog:\s*$/m)[1]
      ?.split(/^[a-z]/m)[0] ?? '';
  const catalogNames = new Set([...catalog.matchAll(/^  ['"]?([^'":\n]+)['"]?:/gm)].map((match) => match[1]));
  const template = path.join(root, 'templates/app');
  if (existsSync(template)) roots.push(template);
  for (const dir of roots) {
    const relative = path.relative(root, dir) || '.';
    const manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
    for (const problem of validateManifest(manifest, workspaceNames, catalogNames))
      problems.push(`${relative}/package.json: ${problem}`);
    const configPath = path.join(dir, 'tsconfig.json');
    let compilerOptions = {};
    if (existsSync(configPath)) {
      const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
      if (error)
        problems.push(`${relative}/tsconfig.json: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
      else {
        compilerOptions = ts.parseJsonConfigFileContent(config, ts.sys, dir).options;
        for (const problem of validateTypeScript(config)) problems.push(`${relative}/tsconfig.json: ${problem}`);
        if (manifest.dependencies?.next) {
          if (config.extends !== '@config/tsconfig/next.json')
            problems.push(`${relative}/tsconfig.json: 공유 Next 설정을 확장해야 한다.`);
          for (const layer of LAYERS) {
            if (
              JSON.stringify(config.compilerOptions?.paths?.[`@${layer}/*`]) !== JSON.stringify([`./src/${layer}/*`])
            ) {
              problems.push(`${relative}/tsconfig.json: @${layer}/* 별칭은 ./src/${layer}/*를 가리켜야 한다.`);
            }
          }
        }
      }
    }
    if (manifest.dependencies?.next) {
      if (!existsSync(path.join(dir, 'app/layout.tsx'))) problems.push(`${relative}: 루트 app/layout.tsx가 필요하다.`);
      const eslint = readFileSync(path.join(dir, 'eslint.config.mjs'), 'utf8');
      for (const preset of ['next.eslint.config.mjs', 'fsd.config.mjs']) {
        if (!eslint.includes(`@repo/eslint-config/${preset}`))
          problems.push(`${relative}: 공유 ${preset}을 사용해야 한다.`);
      }
    }
    const sources = [...walk(path.join(dir, 'src')), ...walk(path.join(dir, 'app'))];
    const usesTokens =
      manifest.name === '@ui/react' ||
      walk(dir).some((f) => f.endsWith('.css') && readFileSync(f, 'utf8').includes('@tokens/css/theme.css'));
    if (usesTokens) {
      for (const file of sources.filter((f) => /\.(ts|tsx|astro)$/.test(f))) {
        for (const problem of validateDesignTokens(readFileSync(file, 'utf8')))
          problems.push(`${path.relative(root, file)}:${problem}`);
      }
    }
    for (const file of sources.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const text = readFileSync(file, 'utf8');
      for (const problem of validateSourceTypes(text, file)) problems.push(`${path.relative(root, file)}: ${problem}`);
      if (/eslint-disable[^\n]*(?:fsd\/|no-restricted-imports)/.test(text))
        problems.push(`${path.relative(root, file)}: 구조 규칙을 eslint-disable로 우회할 수 없다.`);
      const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
      modules.set(file, { ast, compilerOptions });
      for (const node of ast.statements) {
        if (ts.isExpressionStatement(node)) {
          const literal = ts.isParenthesizedExpression(node.expression) ? node.expression.expression : node.expression;
          if (
            ts.isStringLiteral(literal) &&
            ['use client', 'use server'].includes(literal.text) &&
            node !== ast.statements[0]
          ) {
            problems.push(`${path.relative(root, file)}: '${literal.text}'는 모듈의 첫 지시문이어야 한다.`);
          }
        }
      }
    }
  }
  const graph = new Map();
  const clients = new Set();
  const actions = new Set();
  const serverModules = new Set();
  for (const [file, { ast, compilerOptions }] of modules) {
    const targets = [];
    const directive = ast.statements[0];
    if (directive && ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression)) {
      if (directive.expression.text === 'use client') clients.add(file);
      if (directive.expression.text === 'use server') actions.add(file);
    }
    if (file.includes('/model/server/') || /\/index\.server\.tsx?$/.test(file)) serverModules.add(file);
    for (const node of ast.statements) {
      if (
        !(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ||
        !node.moduleSpecifier ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue;
      if (node.isTypeOnly || node.importClause?.isTypeOnly) continue;
      const bindings = node.importClause?.namedBindings;
      if (
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.length &&
        bindings.elements.every((element) => element.isTypeOnly)
      )
        continue;
      if (
        /^(?:node:)?(?:fs|child_process|net|tls)(?:\/|$)|^next\/headers$|^server-only$/.test(node.moduleSpecifier.text)
      )
        serverModules.add(file);
      const target = ts.resolveModuleName(node.moduleSpecifier.text, file, compilerOptions, ts.sys).resolvedModule
        ?.resolvedFileName;
      if (target && modules.has(target)) targets.push(target);
    }
    function dynamicImports(node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      ) {
        const name = node.arguments[0].text;
        if (/^(?:node:)?(?:fs|child_process|net|tls)(?:\/|$)|^next\/headers$|^server-only$/.test(name))
          serverModules.add(file);
        const target = ts.resolveModuleName(name, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
        if (target && modules.has(target)) targets.push(target);
      }
      ts.forEachChild(node, dynamicImports);
    }
    dynamicImports(ast);
    graph.set(file, targets);
  }
  for (const cycle of findImportCycles(graph))
    problems.push(`런타임 순환 참조: ${cycle.map((file) => path.relative(root, file)).join(' → ')}`);
  for (const leak of findServerLeaks(graph, clients, serverModules, actions))
    problems.push(`클라이언트의 서버 전용 코드 참조: ${leak.map((file) => path.relative(root, file)).join(' → ')}`);
  return { problems, workspaceCount: workspaceNames.size, templateCount: roots.length - workspaceNames.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, workspaceCount, templateCount } = checkRepository();
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
  } else console.log(`Architecture: ${workspaceCount} workspaces and ${templateCount} template checked.`);
}
