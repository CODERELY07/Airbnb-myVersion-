import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images : {
    qualities: [50,100],
    remotePatterns: [
    {
      hostname: "a0.muscache.com",
      protocol: "https",
      port: "",
    },
    {
      hostname: "lh3.googleusercontent.com",
      protocol: "https",
      port: "",
    },
    {
      hostname: "*.supabase.co",
      protocol: "https",
      port: "",
    }
    ]
  }
};

export default nextConfig;
