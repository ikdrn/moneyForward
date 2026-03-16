"use client";

import { useQuery } from "@tanstack/react-query";
import { UpgradeWall } from "@/components/upgrade-wall";

interface MonthlyRow {
  ymont: string;
  incms: string;
  expns: string;
  savng: string;
}

function fmt(v: string) {
  return Number(v).toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
}

function SavingBar({ incms, expns }: { incms: number; expns: number }) {
  if (incms === 0) return null;
  const pct = Math.min(100, Math.round((expns / incms) * 100));
  return (
    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-emerald-400"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ReportsPage() {
  const { data, isLoading, error } = useQuery<MonthlyRow[]>({
    queryKey: ["reports-monthly"],
    queryFn: async () => {
      const res = await fetch("/api/v1/reports/monthly");
      if (res.status === 403) {
        const json = await res.json();
        if (json.upgrade) throw Object.assign(new Error("upgrade"), { upgrade: true });
      }
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-slate-400 text-sm py-12 text-center">読み込み中...</div>;

  if (error && (error as { upgrade?: boolean }).upgrade) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold text-slate-900">マンスリーレポート</h1>
        <UpgradeWall requiredPlan="standard" feature="マンスリーレポート" />
      </div>
    );
  }

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">マンスリーレポート</h1>
        <a
          href="/api/v1/export/csv?type=transactions"
          className="text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          CSV出力
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">収支データがありません</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const incms = Number(r.incms);
            const expns = Number(r.expns);
            const savng = Number(r.savng);
            return (
              <div key={r.ymont} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{r.ymont}</span>
                  <span className={`text-sm font-semibold ${savng >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {savng >= 0 ? "+" : ""}{fmt(r.savng)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    収入 {fmt(r.incms)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    支出 {fmt(r.expns)}
                  </span>
                </div>
                <SavingBar incms={incms} expns={expns} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
