import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const engineDistDir = resolve(rootDir, 'packages/engine/dist/engine');

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = resolve(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (stats.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function relativizeAliases(filePath) {
  const aliasPattern = /(['"])@engine\/([^'";]+)\1/g;
  const original = readFileSync(filePath, 'utf8');
  let mutated = original;

  mutated = mutated.replace(aliasPattern, (match, quote, subpath) => {
    const target = resolve(engineDistDir, subpath);
    const relativePath = relative(dirname(filePath), target).replace(/\\/g, '/');
    const normalized = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    return `${quote}${normalized}${quote}`;
  });

  if (mutated !== original) {
    writeFileSync(filePath, mutated, 'utf8');
  }
}

for (const file of collectFiles(engineDistDir)) {
  relativizeAliases(file);
}
