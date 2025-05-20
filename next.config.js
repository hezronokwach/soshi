/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable output standalone for Docker
  output: 'standalone',
  
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
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
    // Enable server actions
    serverActions: true,
  },
};

module.exports = nextConfig;
