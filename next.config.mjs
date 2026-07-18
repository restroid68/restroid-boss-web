/** @type {import('next').NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_BOSS_API_BASE || 'https://cloud.restroid.com').replace(
  /\/+$/,
  '',
)

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/panel-api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ]
  },
}

export default nextConfig
