import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@stellar/stellar-sdk'],
  devIndicators: false,
  turbopack: { root: path.resolve('.') },
};

export default nextConfig;
