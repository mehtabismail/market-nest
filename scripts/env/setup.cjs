#!/usr/bin/env node
/**
 * Creates root .env from .env.example if missing.
 * Usage: npm run env:setup
 */
const { copyFileSync, existsSync } = require('fs');
const { envPath, envExamplePath } = require('./root-path.cjs');

if (existsSync(envPath)) {
  console.log(`Already exists: ${envPath}`);
  process.exit(0);
}

if (!existsSync(envExamplePath)) {
  console.error(`Missing template: ${envExamplePath}`);
  process.exit(1);
}

copyFileSync(envExamplePath, envPath);
console.log(`Created ${envPath} — fill in your Supabase, Redis, and other keys.`);

require('./link-api-env.cjs');
