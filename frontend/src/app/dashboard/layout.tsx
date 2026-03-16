"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PlanBadge } from "@/components/plan-badge";

const NAV = [
  { href: "/dashboard",            label: "ホーム",         desc: "純資産・口座サマリ" },
  { href: "/dashboard/accounts",   label: "口座連携",       desc: "銀行・証券の同期" },
  { href: "/dashboard/trend",      label: "資産推移",       desc: "時系列グラフ" },
  { href: "/dashboard/reports",    label: "マンスリー",     desc: "月次収支レポート", plan: "standard" },
  { href: "/dashboard/portfolio",  label: "ポートフォリオ", desc: "資産配分・配当金",  plan: "advance" },
  { href: "/dashboard/assets",     label: "手動入力",       desc: "残高の直接記録" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: sub } = useQuery<{ pname: string }>({
    queryKey: ["subscription"],
    queryFn:  () => fetch("/api/v1/subscription").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* ブランド */}
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-base tracking-tight">資産管理</p>
          {sub && <div className="mt-1"><PlanBadge pname={sub.pname} /></div>}
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active  = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            const locked  = item.plan === "advance"
              ? sub?.pname !== "advance"
              : item.plan === "standard"
              ? sub?.pname === "free" || !sub
              : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`text-sm font-medium flex items-center gap-1.5 ${active ? "text-indigo-700" : "text-slate-800"}`}>
                  {item.label}
                  {locked && <span className="text-slate-300 text-xs">🔒</span>}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
              </Link>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
