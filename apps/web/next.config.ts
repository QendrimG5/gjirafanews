import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@gjirafanews/api-client",
    "@gjirafanews/auth",
    "@gjirafanews/types",
    "@gjirafanews/utils",
    "@gjirafanews/ui",
  ],
  allowedDevOrigins: ["http://localhost:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  redirects: async () => [
    {
      source: "/category/bote",
      destination: "/category/world",
      permanent: true,
    },
  ],
  rewrites: async () => ({
    beforeFiles: [
      // Proxy prebid.js through our domain to bypass ad blockers.
      // Browser requests /scripts/prebid.js → Next.js fetches from the CDN
      // and returns it as if it were a first-party asset.
      {
        source: "/scripts/prebid.js",
        destination: "https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/prebid.js",
      },
    ],
    afterFiles: [],
    fallback: [],
  }),
};

export default nextConfig;
