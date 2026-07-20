import { existsSync } from 'fs';
import { resolve } from 'path';

function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(dir, 'turbo.json'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(__dirname, '../../../..');
}

/** Paths checked by Nest ConfigModule (repo root .env first). */
export function rootEnvFilePaths(): string[] {
  const root = findMonorepoRoot();
  const candidates = [
    resolve(root, '.env'),
    resolve(root, '.env.example'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ];
  return [...new Set(candidates)].filter((p) => existsSync(p));
}
