/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/FHF' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/FHF/' : '',
}

module.exports = nextConfig
