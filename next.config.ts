import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jfsmethod.com" }],
        destination: "https://www.jfsmethod.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
