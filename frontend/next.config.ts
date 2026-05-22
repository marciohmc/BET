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
    // Determine backend URL from environment safely (default to local port 5000 in dev or betdabetbe in production)
    let backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!backendUrl) {
      if (process.env.NODE_ENV === 'production') {
        backendUrl = 'https://betdabetbe.onrender.com';
      } else {
        backendUrl = 'http://localhost:5000';
      }
    }
    
    // Clean up destination URL (remove trailing slashes or /api suffix to safely append /api/:path*)
    backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    
    // Safety check: if backendUrl points to the current Render external URL (frontend itself), 
    // we MUST NOT rewrite to it, because doing so creates an infinite 508 loop!
    const externalUrl = process.env.RENDER_EXTERNAL_URL || '';
    const cleanExternal = externalUrl.replace(/\/+$/, '');
    
    if (cleanExternal && backendUrl.toLowerCase() === cleanExternal.toLowerCase()) {
      console.warn("WARNING: backendUrl is set to the same URL as RENDER_EXTERNAL_URL. Disabling rewrite to avoid 508 loop.");
      return [];
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
