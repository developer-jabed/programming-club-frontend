import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "25mb", // 🔥 FIX HERE
    },
  },
};

export default nextConfig;