import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Only init OpenNext Cloudflare in production builds (not local dev)
if (process.env.NODE_ENV === "production") {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch {
    // OpenNext not installed locally — only needed for Cloudflare deploy
  }
}

export default nextConfig;
