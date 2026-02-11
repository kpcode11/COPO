/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
