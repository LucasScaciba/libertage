import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Increase body size limit for video uploads (80MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '80mb',
    },
  },
  // Increase max body size for API routes
  serverRuntimeConfig: {
    maxBodySize: '80mb',
  },
};

export default nextConfig;
