import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      // 다른 필요한 도메인들...
    ],
    // 또는 Next.js 12.3.0 이상에서는 remotePatterns 사용 (권장)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
