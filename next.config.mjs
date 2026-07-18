/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // /panel-api proxy → middleware.ts (Canlı / Test cookie)
}

export default nextConfig
