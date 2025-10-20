import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images : {
    domains: ['lh3.googleusercontent.com'],
    qualities: [50,100],
    remotePatterns: [{
      hostname: "a0.muscache.com",
      protocol: "https",
      port: "",
    }
    ]
  }
};

export default nextConfig;
