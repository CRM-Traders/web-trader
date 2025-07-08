import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "webtrader.salesvault.dev",
        "localhost:3000",
        "localhost:7699",
      ],
    },
  },
  productionBrowserSourceMaps: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/trading-view',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
