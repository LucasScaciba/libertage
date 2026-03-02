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
  // Disable Turbopack in development for better Tailwind v4 compatibility
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;
