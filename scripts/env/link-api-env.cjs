#!/usr/bin/env node
/**
 * Symlink apps/api/.env ? repo root .env so `npx prisma` works from apps/api.
 */
const { existsSync, unlinkSync, symlinkSync, lstatSync, readlinkSync } = require('fs');
const { resolve } = require('path');
const { rootDir, envPath } = require('./root-path.cjs');

const apiEnv = resolve(rootDir, 'apps/api/.env');
const relativeTarget = '../../.env';

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath} — run: npm run env:setup`);
  process.exit(1);
}

if (existsSync(apiEnv)) {
  try {
    const stat = lstatSync(apiEnv);
    if (stat.isSymbolicLink()) {
      const current = readlinkSync(apiEnv);
      if (current === relativeTarget || resolve(apiEnv, current) === envPath) {
        console.log(`Already linked: apps/api/.env ? ${relativeTarget}`);
        process.exit(0);
      }
    }
    unlinkSync(apiEnv);
  } catch (err) {
    console.error(`Could not replace ${apiEnv}:`, err.message);
    process.exit(1);
  }
}

symlinkSync(relativeTarget, apiEnv);
console.log(`Linked apps/api/.env ? ${relativeTarget}`);
