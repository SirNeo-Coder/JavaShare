import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In a local classroom, student devices only connect to Next.js on port 3000.
    // Next.js forwards API and Socket.IO traffic to the backend on the teacher PC.
    if (!process.env.NEXT_PUBLIC_API_URL) {
      const backend = process.env.INTERNAL_API_URL || "http://127.0.0.1:4000";
      return [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
        { source: "/socket.io/:path*", destination: `${backend}/socket.io/:path*` },
      ];
    }

    return [];
  },
};

export default nextConfig;
