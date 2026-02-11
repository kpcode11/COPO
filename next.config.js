/** @type {import('next').NextConfig} */
const nextConfig = {
  bundler: 'webpack',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
