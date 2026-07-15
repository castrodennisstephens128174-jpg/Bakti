import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@stellar/stellar-sdk'],
  devIndicators: false,
};

export default nextConfig;
