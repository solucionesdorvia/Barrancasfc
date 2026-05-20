/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "utfs.io" }, // uploadthing
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
