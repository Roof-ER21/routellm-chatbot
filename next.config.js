/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist canvas dependency
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Allow pdf-parse to work in serverless
    if (isServer) {
      // Externalize problematic dependencies for serverless
      config.externals = config.externals || [];
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      config.externals.push('canvas', 'pdf-parse');
    }

    return config;
  },
}

module.exports = nextConfig
