import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { COMPONENT_MARKUP_DEBT } from './component-markup-debt.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROTECTED_OPTIONS = ['strict', 'noUncheckedIndexedAccess', 'verbatimModuleSyntax'];
const LAYERS = ['app', 'views', 'features', 'entities', 'shared'];
const SERVER_MODULE = /\/model\/server\/|\/index\.server\.tsx?$/;
const SERVER_PACKAGE = /^(?:node:)?(?:fs|child_process|net|tls)(?:\/|$)|^next\/headers$|^server-only$/;
const PALETTE_CLASS =
  /\b(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|divide|shadow|decoration|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
const ARBITRARY_COLOR = /\b[a-z-]+-\[(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab|color-mix)\()/g;
const TOKEN_EXCEPTION = /token-exception:\s*\S/;
const UNSUPPORTED_WEIGHT = /\bfont-(?:thin|extralight|light|medium|extrabold|black)\b/;
const DEPLOYMENT_ENABLED = { '**': false, main: true };
const BUILD_FILTER = /--filter=(\S+)/;
const COMPONENT_WRAPPER = /^(?:memo|forwardRef|dynamic|lazy|Object\.assign)$/;
const MAX_COMPONENT_PROPS = 5;
const MAX_JSX_DEPTH = 5;
const MAX_HOST_ELEMENTS = 15;
const STYLE_HOME =
  /^src\/app\/(?:globals\.css|styles\/[^/]+\.css)$|^src\/(?:views|features|entities)\/[^/]+\/styles\/[^/]+\.css$|^src\/(?:.*\/)?ui\/(?:.*\/)?[A-Z][A-Za-z0-9]*\.module\.css$/;

function dependencyProblem(name, version, workspaceNames, catalogNames) {
  if (workspaceNames.has(name))
    return version === 'workspace:*' ? null : `${name}: 워크스페이스 의존성은 workspace:*를 사용한다.`;
  if (!version.startsWith('catalog:')) return `${name}: 버전은 pnpm-workspace.yaml의 catalog에서 관리한다.`;
  if (version === 'catalog:' && !catalogNames.has(name)) return `${name}: 기본 catalog에 정의되지 않았다.`;
  return null;
}

export function validateManifest(manifest, workspaceNames, catalogNames) {
  const problems = [];
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      const problem = dependencyProblem(name, version, workspaceNames, catalogNames);
      if (problem) problems.push(problem);
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

function isMainOnlyDeployment(config) {
  const deploymentEnabled = config.git?.deploymentEnabled ?? {};
  return (
    Object.keys(deploymentEnabled).length === Object.keys(DEPLOYMENT_ENABLED).length &&
    Object.entries(DEPLOYMENT_ENABLED).every(([branch, enabled]) => deploymentEnabled[branch] === enabled)
  );
}

function ignoreCommandProblem(ignoreCommand, appName) {
  if (typeof ignoreCommand !== 'string' || !ignoreCommand.trim())
    return `ignoreCommand로 변경 없는 배포를 건너뛴다(npx turbo-ignore ${appName}).`;
  if (ignoreCommand.includes('turbo-ignore') && ignoreCommand !== `npx turbo-ignore ${appName}`)
    return `ignoreCommand는 이 앱을 가리킨다: npx turbo-ignore ${appName}`;
  return null;
}

export function validateVercelConfig(config, appName) {
  const problems = [];
  if (!isMainOnlyDeployment(config))
    problems.push('git.deploymentEnabled는 {"**": false, "main": true}로 main만 배포한다.');
  const ignoreProblem = ignoreCommandProblem(config.ignoreCommand, appName);
  if (ignoreProblem) problems.push(ignoreProblem);
  const { buildCommand } = config;
  const buildFilter = typeof buildCommand === 'string' ? buildCommand.match(BUILD_FILTER)?.[1] : undefined;
  if (buildFilter && buildFilter !== appName) problems.push(`buildCommand의 --filter는 이 앱(${appName})을 가리킨다.`);
  return problems;
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

function opacityPercent(fraction) {
  const percent = Number(`0.${fraction}`) * 100;
  return Number.isInteger(Math.round(percent * 1e6) / 1e6) ? `/${Math.round(percent)}` : null;
}

const LEGACY_TAILWIND = [
  [/\bbg-gradient-to-(tr|tl|br|bl|t|r|b|l)\b/g, (side) => `bg-linear-to-${side}`],
  [/\bflex-shrink(-0)?\b/g, (zero = '') => `shrink${zero}`],
  [/\bflex-grow(-0)?\b/g, (zero = '') => `grow${zero}`],
  [/aria-\[current=true\]:/g, () => 'aria-current:'],
  [/\/\[0?\.(\d+)\]/g, opacityPercent],
];

export function validateTailwindNames(text) {
  const problems = [];
  text.split('\n').forEach((line, index) => {
    for (const [pattern, canonical] of LEGACY_TAILWIND) {
      for (const [match, group] of line.matchAll(pattern)) {
        const replacement = canonical(group);
        if (replacement)
          problems.push(
            `${index + 1}행: Tailwind v3 표기 ${match} 대신 ${replacement}를 쓴다(px 임의값은 그대로 둔다).`,
          );
      }
    }
  });
  return problems;
}

function isComponentOrHook(name, initializer, source) {
  if (!initializer) return false;
  if (ts.isCallExpression(initializer) && initializer.expression.getText(source) === 'cva') return true;
  const isFunction = ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
  const isWrapped = ts.isCallExpression(initializer) && COMPONENT_WRAPPER.test(initializer.expression.getText(source));
  if (/^use[A-Z]/.test(name)) return isFunction;
  return /^[A-Z]/.test(name) && (isFunction || isWrapped);
}

export function validateComponentModule(text, filename) {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const problems = [];
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && !/^(?:[A-Z]|use[A-Z])/.test(statement.name.text))
      problems.push(`${statement.name.text}: tsx에는 컴포넌트만 둔다. 보조 함수는 lib/로 옮긴다.`);
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const name = declaration.name.getText(source);
      if (!isComponentOrHook(name, declaration.initializer, source))
        problems.push(`${name}: tsx 최상위에는 컴포넌트만 둔다. 상수는 config/, 상태 로직은 model/hooks로 옮긴다.`);
    }
  }
  return problems;
}

function propsMemberCounts(source) {
  const counts = new Map();
  for (const statement of source.statements) {
    if (ts.isInterfaceDeclaration(statement)) counts.set(statement.name.text, statement.members.length);
    if (ts.isTypeAliasDeclaration(statement) && ts.isTypeLiteralNode(statement.type))
      counts.set(statement.name.text, statement.type.members.length);
  }
  return counts;
}

function isFunctionNode(node) {
  return ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function componentPropsType(statement) {
  const component = componentFunction(statement);
  if (!component || !isFunctionNode(component.node)) return null;
  return { name: component.name, type: component.node.parameters[0]?.type };
}

export function validateComponentProps(text, filename) {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const counts = propsMemberCounts(source);
  const problems = [];
  for (const statement of source.statements) {
    const component = componentPropsType(statement);
    if (!component?.type) continue;
    const count = ts.isTypeLiteralNode(component.type)
      ? component.type.members.length
      : counts.get(component.type.getText(source));
    if (count !== undefined && count > MAX_COMPONENT_PROPS)
      problems.push(
        `${component.name}: props ${count}개(최대 ${MAX_COMPONENT_PROPS}). 합성 컴포넌트로 나눈다 — Root가 모델을 받아 context로 내려주고 파트가 구독하거나, 내용은 children으로 조립한다.`,
      );
  }
  return problems;
}

function componentFunction(statement) {
  if (ts.isFunctionDeclaration(statement) && statement.name && /^[A-Z]/.test(statement.name.text))
    return { name: statement.name.text, node: statement };
  if (!ts.isVariableStatement(statement)) return null;
  const [declaration] = statement.declarationList.declarations;
  const name = declaration?.name.getText();
  if (!name || !/^[A-Z]/.test(name) || !declaration.initializer) return null;
  return { name, node: declaration.initializer };
}

function isJsxElement(node) {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
}

function isHostElement(node) {
  const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;
  return /^[a-z]/.test(tag.getText());
}

function measureMarkup(root) {
  const markup = { hostElements: 0, depth: 0 };
  const visit = (node, depth) => {
    const nextDepth = isJsxElement(node) ? depth + 1 : depth;
    if (isJsxElement(node)) {
      markup.depth = Math.max(markup.depth, nextDepth);
      if (isHostElement(node)) markup.hostElements += 1;
    }
    ts.forEachChild(node, (child) => visit(child, nextDepth));
  };
  visit(root, 0);
  return markup;
}

export function validateComponentMarkup(text, filename) {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const problems = [];
  for (const statement of source.statements) {
    const component = componentFunction(statement);
    if (!component) continue;
    const { hostElements, depth } = measureMarkup(component.node);
    if (depth <= MAX_JSX_DEPTH && hostElements <= MAX_HOST_ELEMENTS) continue;
    problems.push({
      component: component.name,
      message: `JSX 깊이 ${depth}(최대 ${MAX_JSX_DEPTH})·HTML 요소 ${hostElements}개(최대 ${MAX_HOST_ELEMENTS}). 구획을 이름 붙은 하위 컴포넌트로 나누고, 반복 모양은 설정 배열 + map이나 공용 컴포넌트로 바꾼다.`,
    });
  }
  return problems;
}

export function applyMarkupDebt(found, debt) {
  const problems = found.filter(({ key }) => !debt.has(key)).map(({ key, message }) => `${key}: ${message}`);
  const foundKeys = new Set(found.map(({ key }) => key));
  for (const key of debt) {
    if (!foundKeys.has(key))
      problems.push(
        `${key}: 마크업 부채 목록에 있지만 이제 기준을 지킨다. scripts/component-markup-debt.mjs에서 지운다.`,
      );
  }
  return problems;
}

export function findMisplacedStyles(appRelativePaths) {
  return appRelativePaths
    .filter((file) => file.endsWith('.css') && !STYLE_HOME.test(file))
    .map((file) => `${file}: CSS 파일은 src/app/styles/, 슬라이스의 styles/, 컴포넌트 옆 <이름>.module.css에만 둔다.`);
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
    if (['node_modules', '.next', 'dist', 'out', '.astro', '.git', '.turbo'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function listWorkspaceRoots(root) {
  const roots = [root];
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(path.join(root, group), { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(path.join(root, group, entry.name, 'package.json')))
        roots.push(path.join(root, group, entry.name));
    }
  }
  return roots;
}

function readCatalogNames(root) {
  const catalog =
    readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8')
      .split(/^catalog:\s*$/m)[1]
      ?.split(/^[a-z]/m)[0] ?? '';
  return new Set([...catalog.matchAll(/^  ['"]?([^'":\n]+)['"]?:/gm)].map((match) => match[1]));
}

function vercelProblems({ root, dir, relative, manifest }) {
  if (path.dirname(dir) !== path.join(root, 'apps')) return [];
  const vercelPath = path.join(dir, 'vercel.json');
  if (!existsSync(vercelPath)) return [`${relative}: main 배포 제한과 ignoreCommand를 담은 vercel.json이 필요하다.`];
  return validateVercelConfig(JSON.parse(readFileSync(vercelPath, 'utf8')), manifest.name).map(
    (problem) => `${relative}/vercel.json: ${problem}`,
  );
}

function nextTsconfigProblems(relative, config, dir) {
  const problems = [];
  if (config.extends !== '@config/tsconfig/next.json')
    problems.push(`${relative}/tsconfig.json: 공유 Next 설정을 확장해야 한다.`);
  for (const layer of LAYERS) {
    if (JSON.stringify(config.compilerOptions?.paths?.[`@${layer}/*`]) !== JSON.stringify([`./src/${layer}/*`])) {
      problems.push(`${relative}/tsconfig.json: @${layer}/* 별칭은 ./src/${layer}/*를 가리켜야 한다.`);
    }
  }
  if (config.compilerOptions?.paths?.['@widgets/*'] || existsSync(path.join(dir, 'src/widgets')))
    problems.push(`${relative}: widgets 레이어는 쓰지 않는다. 화면 전용 블록은 views, 공용 동작은 features로 옮긴다.`);
  return problems;
}

function tsconfigProblems({ dir, relative, manifest }) {
  const configPath = path.join(dir, 'tsconfig.json');
  if (!existsSync(configPath)) return { problems: [], compilerOptions: {} };
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) {
    const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
    return { problems: [`${relative}/tsconfig.json: ${message}`], compilerOptions: {} };
  }
  const compilerOptions = ts.parseJsonConfigFileContent(config, ts.sys, dir).options;
  const problems = validateTypeScript(config).map((problem) => `${relative}/tsconfig.json: ${problem}`);
  if (manifest.dependencies?.next) problems.push(...nextTsconfigProblems(relative, config, dir));
  return { problems, compilerOptions };
}

function nextAppProblems({ dir, relative, manifest }) {
  if (!manifest.dependencies?.next) return [];
  const problems = [];
  if (!existsSync(path.join(dir, 'app/layout.tsx'))) problems.push(`${relative}: 루트 app/layout.tsx가 필요하다.`);
  const eslint = readFileSync(path.join(dir, 'eslint.config.mjs'), 'utf8');
  for (const preset of ['next.eslint.config.mjs', 'fsd.config.mjs']) {
    if (!eslint.includes(`@repo/eslint-config/${preset}`))
      problems.push(`${relative}: 공유 ${preset}을 사용해야 한다.`);
  }
  return problems;
}

function misplacedDirectiveProblems(ast, label) {
  const problems = [];
  for (const node of ast.statements) {
    if (!ts.isExpressionStatement(node)) continue;
    const literal = ts.isParenthesizedExpression(node.expression) ? node.expression.expression : node.expression;
    const isDirective = ts.isStringLiteral(literal) && ['use client', 'use server'].includes(literal.text);
    if (isDirective && node !== ast.statements[0])
      problems.push(`${label}: '${literal.text}'는 모듈의 첫 지시문이어야 한다.`);
  }
  return problems;
}

function checkSourceFile(root, file, compilerOptions, modules) {
  const label = path.relative(root, file);
  const text = readFileSync(file, 'utf8');
  const problems = validateSourceTypes(text, file).map((problem) => `${label}: ${problem}`);
  if (/eslint-disable[^\n]*(?:fsd\/|no-restricted-imports)/.test(text))
    problems.push(`${label}: 구조 규칙을 eslint-disable로 우회할 수 없다.`);
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  modules.set(file, { ast, compilerOptions });
  problems.push(...misplacedDirectiveProblems(ast, label));
  return problems;
}

function componentProblems(root, dir, appSources, markupFindings) {
  const problems = [];
  const componentFiles = appSources.filter((f) => f.endsWith('.tsx') && f.startsWith(path.join(dir, 'src')));
  for (const file of componentFiles) {
    const text = readFileSync(file, 'utf8');
    for (const problem of [...validateComponentModule(text, file), ...validateComponentProps(text, file)])
      problems.push(`${path.relative(root, file)}: ${problem}`);
    for (const { component, message } of validateComponentMarkup(text, file))
      markupFindings.push({ key: `${path.relative(root, file)}#${component}`, message });
  }
  return problems;
}

function tailwindProblems(root, manifest, sources) {
  if (!(manifest.dependencies?.tailwindcss ?? manifest.devDependencies?.tailwindcss)) return [];
  const problems = [];
  for (const file of sources.filter((f) => /\.tsx?$/.test(f))) {
    for (const problem of validateTailwindNames(readFileSync(file, 'utf8')))
      problems.push(`${path.relative(root, file)}:${problem}`);
  }
  return problems;
}

function tokenProblems(root, dir, sources) {
  if (!existsSync(path.join(dir, 'src/app/styles/theme.css'))) return [];
  const problems = [];
  for (const file of sources.filter((f) => /\.(ts|tsx|astro)$/.test(f))) {
    for (const problem of validateDesignTokens(readFileSync(file, 'utf8')))
      problems.push(`${path.relative(root, file)}:${problem}`);
  }
  return problems;
}

function sourceProblems({ root, dir, relative, manifest }, compilerOptions, collected) {
  const sources = [...walk(path.join(dir, 'src')), ...walk(path.join(dir, 'app'))];
  const appSources = sources.filter((f) => !f.includes(`${path.sep}__tests__${path.sep}`));
  const problems = componentProblems(root, dir, appSources, collected.markupFindings);
  for (const problem of findMisplacedStyles(appSources.map((f) => path.relative(dir, f))))
    problems.push(`${relative}/${problem}`);
  problems.push(...tailwindProblems(root, manifest, sources), ...tokenProblems(root, dir, sources));
  for (const file of sources.filter((f) => /\.(ts|tsx)$/.test(f)))
    problems.push(...checkSourceFile(root, file, compilerOptions, collected.modules));
  return problems;
}

function workspaceProblems(root, dir, shared, collected) {
  const relative = path.relative(root, dir) || '.';
  const manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const workspace = { root, dir, relative, manifest };
  const problems = validateManifest(manifest, shared.workspaceNames, shared.catalogNames).map(
    (problem) => `${relative}/package.json: ${problem}`,
  );
  problems.push(...vercelProblems(workspace));
  const tsconfig = tsconfigProblems(workspace);
  problems.push(...tsconfig.problems, ...nextAppProblems(workspace));
  problems.push(...sourceProblems(workspace, tsconfig.compilerOptions, collected));
  return problems;
}

function isRuntimeModuleImport(node) {
  const isModuleDeclaration = ts.isImportDeclaration(node) || ts.isExportDeclaration(node);
  if (!isModuleDeclaration || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return false;
  return !(node.isTypeOnly || node.importClause?.isTypeOnly);
}

function isAllTypeNamedImport(node) {
  const bindings = node.importClause?.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings)) return false;
  return bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
}

function resolveKnownModule(name, file, compilerOptions, modules) {
  const target = ts.resolveModuleName(name, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
  return target && modules.has(target) ? target : undefined;
}

function isDynamicImportCall(node) {
  return (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments[0] &&
    ts.isStringLiteralLike(node.arguments[0])
  );
}

function collectDynamicImports(node, scan) {
  if (isDynamicImportCall(node)) {
    const name = node.arguments[0].text;
    if (SERVER_PACKAGE.test(name)) scan.serverModules.add(scan.file);
    const target = resolveKnownModule(name, scan.file, scan.compilerOptions, scan.modules);
    if (target) scan.targets.push(target);
  }
  ts.forEachChild(node, (child) => collectDynamicImports(child, scan));
}

function collectStaticImports(ast, scan) {
  for (const node of ast.statements) {
    if (!isRuntimeModuleImport(node) || isAllTypeNamedImport(node)) continue;
    const name = node.moduleSpecifier.text;
    if (SERVER_PACKAGE.test(name)) scan.serverModules.add(scan.file);
    const target = resolveKnownModule(name, scan.file, scan.compilerOptions, scan.modules);
    if (target) scan.targets.push(target);
  }
}

function registerDirective(file, ast, graphState) {
  const directive = ast.statements[0];
  if (!directive || !ts.isExpressionStatement(directive) || !ts.isStringLiteral(directive.expression)) return;
  if (directive.expression.text === 'use client') graphState.clients.add(file);
  if (directive.expression.text === 'use server') graphState.actions.add(file);
}

function buildModuleGraph(modules) {
  const graph = new Map();
  const state = { clients: new Set(), actions: new Set(), serverModules: new Set() };
  for (const [file, { ast, compilerOptions }] of modules) {
    const scan = { file, compilerOptions, modules, targets: [], serverModules: state.serverModules };
    registerDirective(file, ast, state);
    if (SERVER_MODULE.test(file)) state.serverModules.add(file);
    collectStaticImports(ast, scan);
    collectDynamicImports(ast, scan);
    graph.set(file, scan.targets);
  }
  return { graph, ...state };
}

function graphProblems(root, modules) {
  const { graph, clients, actions, serverModules } = buildModuleGraph(modules);
  const display = (chain, separator) => chain.map((file) => path.relative(root, file)).join(separator);
  return [
    ...findImportCycles(graph).map((cycle) => `런타임 순환 참조: ${display(cycle, ' → ')}`),
    ...findServerLeaks(graph, clients, serverModules, actions).map(
      (leak) => `클라이언트의 서버 전용 코드 참조: ${display(leak, ' → ')}`,
    ),
  ];
}

export function checkRepository(root = ROOT) {
  const problems = [];
  const collected = { modules: new Map(), markupFindings: [] };
  const roots = listWorkspaceRoots(root);
  const workspaceNames = new Set(
    roots.map((dir) => JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).name),
  );
  const shared = { workspaceNames, catalogNames: readCatalogNames(root) };
  for (const dir of roots) problems.push(...workspaceProblems(root, dir, shared, collected));
  problems.push(...applyMarkupDebt(collected.markupFindings, new Set(COMPONENT_MARKUP_DEBT)));
  problems.push(...graphProblems(root, collected.modules));
  return { problems, workspaceCount: workspaceNames.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, workspaceCount } = checkRepository();
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
  } else console.log(`Architecture: ${workspaceCount} workspaces checked.`);
}
