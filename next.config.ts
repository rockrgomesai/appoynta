import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'face-api.js': '@vladmandic/face-api',
    };

    // Add condition for client-side only modules
    config.module.rules.push({
      test: /node_modules\/@vladmandic\/face-api/,
      sideEffects: false,
      resolve: {
        fallback: {
          util: false,
          fs: false,
          crypto: false,
        },
      },
      layer: 'client',
    });

    return config;
  },
  transpilePackages: ['@vladmandic/face-api'],
  experimental: {
    // Remove esmExternals as it's not recommended
    serverActions: {
      // Configure server actions properly
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb'
    }
  },
};

export default nextConfig;