/**
 * Preload for Prisma CLI: node -r ../../scripts/env/load-root-env.cjs prisma ...
 */
const { config } = require('dotenv');
const { existsSync } = require('fs');
const { envPath, envExamplePath } = require('./root-path.cjs');

const path = existsSync(envPath) ? envPath : envExamplePath;
config({ path });
