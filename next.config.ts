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
};

export default nextConfig;
