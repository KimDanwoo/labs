/**
 * One-time migration: @/layer/* → @layer/* with barrel consolidation
 * Usage: node scripts/migrate-imports.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');

// Paths that collapse to their barrel
const BARREL_MAP = {
  '@shared/ui/': '@shared/ui',
  '@shared/constants/errorCodes': '@shared/constants',
  '@shared/constants/storageKeys': '@shared/constants',
  '@shared/lib/hooks/useDebounce': '@shared/lib/hooks',
  '@widgets/layout/Header': '@widgets/layout',
  '@widgets/layout/Footer': '@widgets/layout',
  '@entities/question/ui/DifficultyBadge': '@entities/question/ui',
};

function findFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
      result.push(...findFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

// Parse a single import statement that may span multiple lines
function parseImports(content) {
  // Matches: import { ... } from 'path' or import type { ... } from 'path'
  const re = /^(import\s+(?:type\s+)?\{[^}]*\})\s+from\s+'([^']+)';?$/gm;
  const results = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    results.push({ full: m[0], names: m[1], from: m[2], index: m.index });
  }
  return results;
}

function extractNamedImports(namesStr) {
  // "import { A, B, C }" or "import type { A, B }"
  const inner = namesStr.replace(/import\s+(?:type\s+)?\{/, '').replace(/\}$/, '');
  return inner.split(',').map(s => s.trim()).filter(Boolean);
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Step 1: Replace @/ prefixes → FSD aliases
  content = content
    .replace(/from '@\/entities\//g, "from '@entities/")
    .replace(/from '@\/features\//g, "from '@features/")
    .replace(/from '@\/views\//g, "from '@views/")
    .replace(/from '@\/widgets\//g, "from '@widgets/")
    .replace(/from '@\/shared\//g, "from '@shared/");

  // Step 2: Collect all imports grouped by their target barrel
  // Group: any import from '@shared/ui/Xxx' → '@shared/ui'
  // Group: exact matches from BARREL_MAP
  const lines = content.split('\n');

  // Map from barrel path → { names: Set, lineIndices: number[] }
  const barrelGroups = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check single-line imports
    const m = line.match(/^import\s+(type\s+)?\{\s*([^}]+)\}\s+from\s+'([^']+)';?$/);
    if (!m) continue;

    const isType = !!m[1];
    const names = m[2].split(',').map(s => s.trim()).filter(Boolean);
    const from = m[3];

    let barrel = null;

    // Check @shared/ui/Xxx
    if (from.startsWith('@shared/ui/')) {
      barrel = '@shared/ui';
    } else {
      // Check exact BARREL_MAP entries
      for (const [key, val] of Object.entries(BARREL_MAP)) {
        if (key.endsWith('/')) continue; // already handled above
        if (from === key) { barrel = val; break; }
      }
    }

    if (barrel) {
      if (!barrelGroups.has(barrel)) {
        barrelGroups.set(barrel, { names: [], lineIndices: [], isType });
      }
      const group = barrelGroups.get(barrel);
      for (const name of names) {
        if (!group.names.includes(name)) group.names.push(name);
      }
      group.lineIndices.push(i);
    }
  }

  if (barrelGroups.size === 0) {
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated:', path.relative(SRC, filePath));
    }
    return;
  }

  // Step 3: Build the set of line indices to remove
  const removeIndices = new Set();
  const insertions = new Map(); // lineIndex → merged import line

  for (const [barrel, group] of barrelGroups) {
    const sortedIdx = [...group.lineIndices].sort((a, b) => a - b);
    const firstIdx = sortedIdx[0];
    const mergedLine = `import { ${group.names.join(', ')} } from '${barrel}';`;
    insertions.set(firstIdx, mergedLine);
    for (const idx of sortedIdx) removeIndices.add(idx);
  }

  // Step 4: Rebuild lines
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (insertions.has(i)) {
      newLines.push(insertions.get(i));
    } else if (!removeIndices.has(i)) {
      newLines.push(lines[i]);
    }
  }

  content = newLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', path.relative(SRC, filePath));
  }
}

const files = findFiles(SRC);
let count = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf-8');
  transformFile(file);
  const after = fs.readFileSync(file, 'utf-8');
  if (before !== after) count++;
}
console.log(`\nDone. ${count} files updated.`);
