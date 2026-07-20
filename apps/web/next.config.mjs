import { existsSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { envPath, envExamplePath } = require('../../scripts/env/root-path.cjs');
loadEnv({ path: existsSync(envPath) ? envPath : envExamplePath });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@marketnest/ui', '@marketnest/shared-types', '@marketnest/utils'],
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    optimizePackageImports: ['@marketnest/ui'],
  },
};

export default nextConfig;
