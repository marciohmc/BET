import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    // Determine backend URL from environment safely (default to local port 5000)
    let backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Clean up destination URL (remove trailing slashes or /api suffix to safely append /api/:path*)
    backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
