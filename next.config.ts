import type { NextConfig } from "next";

// Backend API (dev: localhost:3001). Prod-da nginx /api-ni birbaşa proxy edir —
// rewrite yalnız Next-in öz serverindən keçən sorğular üçün fallback-dır.
const API = process.env.API_ORIGIN;

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
  async rewrites() {
    if (API) {
      return [
        { source: "/api/:path*", destination: `${API}/api/:path*` },
        { source: "/uploads/:path*", destination: `${API}/uploads/:path*` },
      ];
    }
    return [];
  },
};

export default nextConfig;
