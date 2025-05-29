// next.config.mjs
let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // unoptimized: true, // IMPORTANT: Removed or commented out to allow remotePatterns
    remotePatterns: [
      // Pattern for your local backend images
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**', // Allows images under /uploads/ path
      },
      // Pattern for Unsplash images (added)
      {
        protocol: 'https', // Unsplash uses HTTPS
        hostname: 'images.unsplash.com',
        // No port needed for standard HTTPS
        // No pathname needed if you want to allow any image from this host
      },
      // Add any other hostnames you might need (e.g., for placeholders)
      // {
      //   protocol: 'https',
      //   hostname: 'via.placeholder.com',
      // }
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

// --- This part merges your custom config if it exists ---
if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    // Special handling for 'images' to merge remotePatterns if both exist
    if (key === 'images' && typeof nextConfig.images === 'object' && typeof config.images === 'object') {
       nextConfig.images = {
         ...nextConfig.images,
         ...config.images,
         // Ensure remotePatterns arrays are merged, not overwritten (if userConfig also defines them)
         remotePatterns: [
            ...(nextConfig.images.remotePatterns || []),
            ...(config.images.remotePatterns || [])
         ]
       };
    } else if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key]) &&
      nextConfig[key] !== null // Ensure it's an object, not null
    ) {
      // Merge other objects
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      // Overwrite non-object keys or arrays
      nextConfig[key] = config[key]
    }
  }
  // Ensure the final images config doesn't have both unoptimized and remotePatterns if merged
  if (nextConfig.images?.unoptimized && nextConfig.images?.remotePatterns?.length > 0) {
     console.warn("Warning: 'images.unoptimized' is true, but 'remotePatterns' is also defined in next.config.js. 'unoptimized' takes precedence.");
     // Optionally delete remotePatterns if unoptimized should always win
     // delete nextConfig.images.remotePatterns;
  } else if (!nextConfig.images?.unoptimized && (!nextConfig.images?.remotePatterns || nextConfig.images?.remotePatterns?.length === 0)) {
     // If optimization is enabled but no patterns defined, add a default empty array if needed
     if (!nextConfig.images) nextConfig.images = {};
     if (!nextConfig.images.remotePatterns) nextConfig.images.remotePatterns = [];
  }

}
// --- End of merge logic ---

export default nextConfig;