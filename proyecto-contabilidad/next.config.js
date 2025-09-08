/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/FHF' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/FHF/' : '',
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/dashboard': { page: '/dashboard' },
      '/auth/login': { page: '/auth/login' },
      '/auth/register': { page: '/auth/register' },
      '/project': { page: '/project' },
    }
  },
}

module.exports = nextConfig
