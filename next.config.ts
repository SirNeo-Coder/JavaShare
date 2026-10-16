import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In a local classroom, student devices load CodeShare from Next.js on port 3000.
    // Next.js forwards API traffic to the backend on the teacher PC. Live features connect
    // straight to Supabase Realtime (port 54321 offline), not through Next.js.
    if (!process.env.NEXT_PUBLIC_API_URL) {
      const backend = process.env.INTERNAL_API_URL || "http://127.0.0.1:4000";
      return [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
      ];
    }

    return [];
  },
};

export default nextConfig;
