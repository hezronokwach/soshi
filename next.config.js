/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable output standalone for Docker
  output: 'standalone',

  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },

  // API rewrites to proxy to Go backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },

  // Configure WebSocket if needed
  webpack: (config, { isServer }) => {
    // Add WebSocket support
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    return config;
  },

  // Configure experimental features
  experimental: {
    // Enable server actions with the new format
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
