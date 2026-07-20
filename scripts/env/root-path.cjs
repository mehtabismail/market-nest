/**
 * Resolves the monorepo root and root .env paths (used by api, web, Prisma scripts).
 */
const { existsSync } = require('fs');
const { resolve } = require('path');

function findMonorepoRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (
      existsSync(resolve(dir, 'package.json')) &&
      existsSync(resolve(dir, 'turbo.json'))
    ) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(__dirname, '../..');
}

const rootDir = findMonorepoRoot();

module.exports = {
  rootDir,
  envPath: resolve(rootDir, '.env'),
  envExamplePath: resolve(rootDir, '.env.example'),
};
