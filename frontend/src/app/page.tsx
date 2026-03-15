import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">家計簿アプリ</h1>
      <p className="text-gray-500">マルチテナント型 · Next.js + Rust (Axum) + Supabase</p>
      <Link
        href="/dashboard"
        className="mt-4 bg-blue-600 text-white rounded px-6 py-3 font-medium hover:bg-blue-700"
      >
        ダッシュボードへ
      </Link>
    </main>
  );
}
