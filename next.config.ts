import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['net-snmp', 'postgres'],
};

export default nextConfig;
