#!/usr/bin/env node
/**
 * Run Prisma CLI with root .env loaded. Usage from apps/api scripts:
 *   node ../../scripts/env/run-prisma.cjs db push
 */
require('./load-root-env.cjs');
const { spawnSync } = require('child_process');
const { resolve } = require('path');

const apiDir = resolve(__dirname, '../../apps/api');
const args = process.argv.slice(2);

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: apiDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
