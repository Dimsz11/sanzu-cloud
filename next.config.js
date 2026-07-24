/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Baileys needs these for server-side usage
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino'],
  },
};

module.exports = nextConfig;
