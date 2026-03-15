"use client";

import { NetWorthHero }  from "@/components/net-worth-hero";
import { AccountCard }   from "@/components/account-card";
import { TrendChart }    from "@/components/trend-chart";
import { useAccounts }   from "@/hooks/use-accounts";
import { useTrend }      from "@/hooks/use-trend";
import Link from "next/link";

export default function DashboardPage() {
  const { data: accounts, isLoading: aLoading } = useAccounts();
  const { data: trend,    isLoading: tLoading } = useTrend();

  const hasAccounts = (accounts ?? []).length > 0;

  return (
    <div className="space-y-8">
      {/* ── 1. 主役: 純資産 ───────────────────────────────────── */}
      <NetWorthHero />

      {/* ── 2. 口座サマリ ─────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">連携口座</h2>
          <Link
            href="/dashboard/accounts"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            口座を追加 →
          </Link>
        </div>

        {aLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : !hasAccounts ? (
          <EmptyAccounts />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts!.map((ac) => <AccountCard key={ac.objid} account={ac} />)}
          </div>
        )}
      </section>

      {/* ── 3. 資産推移 (ミニグラフ) ──────────────────────────── */}
      {hasAccounts && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">資産推移</h2>
            <Link
              href="/dashboard/trend"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              詳細を見る →
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            {tLoading ? (
              <div className="h-64 animate-pulse bg-slate-50 rounded" />
            ) : (
              <TrendChart data={trend ?? []} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ── 口座未連携の空状態 ───────────────────────────────────────
function EmptyAccounts() {
  return (
    <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <p className="text-slate-400 text-sm mb-4">
        口座を連携すると残高が自動的に取得されます
      </p>
      <Link
        href="/dashboard/accounts"
        className="inline-block bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        最初の口座を連携する
      </Link>
    </div>
  );
}
