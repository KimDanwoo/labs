import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ui/react', '@tokens/css'],
};

export default nextConfig;
