/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist canvas dependency
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Fix for pdf-parse pdfjs-dist worker issue
    if (isServer) {
      config.resolve.alias['pdfjs-dist'] = false;
    }

    return config;
  },
}

module.exports = nextConfig
