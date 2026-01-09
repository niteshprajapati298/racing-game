/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double-mounting issues with game loop
  images: {
    domains: [],
  },
}

module.exports = nextConfig
