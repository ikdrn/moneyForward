/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rust バックエンドへのプロキシ (開発環境)
  async rewrites() {
    return [
      {
        source:      "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
