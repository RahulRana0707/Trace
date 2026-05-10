/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@trace/ui"],
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/projects", destination: "/dashboard/projects", permanent: false },
      { source: "/memory", destination: "/dashboard/memory", permanent: false },
      { source: "/analytics", destination: "/dashboard/analytics", permanent: false },
      { source: "/settings", destination: "/dashboard/settings", permanent: false },
      { source: "/connect/:path*", destination: "/dashboard/connect/:path*", permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
