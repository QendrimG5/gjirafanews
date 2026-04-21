import type { NextConfig } from "next";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@gjirafanews/types",
    "@gjirafanews/utils",
    "@gjirafanews/ui",
  ],
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${API_TARGET}/api/:path*`,
    },
  ],
};

export default nextConfig;
