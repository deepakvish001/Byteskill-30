/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config, { isServer }) {
    // ⬇️  Add this block
    if (!isServer) {
      // Prevent Webpack from trying to polyfill Node-only modules in client bundles
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
      };
    }
    // ⬆️  End addition

    return config;
  },
}

export default nextConfig
