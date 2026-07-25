/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
  // /panel-api proxy → middleware.ts (Canlı / Test cookie)
}

export default nextConfig
