import type { NextConfig } from 'next';

const config: NextConfig = {
  agentRules: false,
  output: 'export',
  devIndicators: false,
  allowedDevOrigins: ['*.app.github.dev'],
};
export default config;
