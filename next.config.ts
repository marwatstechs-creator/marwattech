import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required by @opennextjs/cloudflare for the standalone build output.
  output: "standalone",
  // TypeScript already runs separately via `npm run typecheck`.
  // ignoreBuildErrors avoids a Next.js route-group type bug when OpenNext
  // re-runs `next build` against an existing `.next` directory.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "marwattech.com" },
      { protocol: "https", hostname: "**.marwattech.com" },
    ],
  },
  // Experimental: keep Turbopack for dev/build
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  // Redirect legacy/alias service slugs to their canonical URLs so old links
  // (social, bookmarks, campaigns) never land on a 404.
  async redirects() {
    return [
      {
        source: "/services/mobile-apps",
        destination: "/services/mobile-app-development",
        permanent: true,
      },
      {
        source: "/services/ecommerce",
        destination: "/services/ecommerce-website-design",
        permanent: true,
      },
      {
        source: "/services/seo",
        destination: "/services/seo-services",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
