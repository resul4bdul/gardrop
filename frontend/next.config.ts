import type { NextConfig } from "next";

// Backend API (dev: localhost:3001). Prod-da nginx /api-ni birbaşa proxy edir —
// rewrite yalnız Next-in öz serverindən keçən sorğular üçün fallback-dır.
const API = process.env.API_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
