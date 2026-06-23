import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@ui/react',
    '@tokens/css',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'postprocessing',
  ],
};

export default nextConfig;
