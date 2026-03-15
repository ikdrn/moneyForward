/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel デプロイ時は NEXT_PUBLIC_API_URL を環境変数で設定する
  // 開発時のみ rewrites でプロキシ
  async rewrites() {
    // 本番 (Vercel) では API_URL が外部ホストを指すため rewrite 不要
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source:      "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/:path*`,
      },
    ];
  },

  // セキュリティヘッダ
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
