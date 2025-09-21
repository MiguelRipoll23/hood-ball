import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = resolve(rootDir, 'packages/engine/dist');
for (const sub of ['core', 'game', 'src']) {
  const target = resolve(distDir, sub);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}
