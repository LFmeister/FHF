/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/FHF' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/FHF/' : '',
  distDir: 'out',
}

module.exports = nextConfig
