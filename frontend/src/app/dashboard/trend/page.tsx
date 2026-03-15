"use client";

import { useTrend }    from "@/hooks/use-trend";
import { useNetWorth } from "@/hooks/use-networth";
import { TrendChart }  from "@/components/trend-chart";
import type { TrendPoint } from "@/types/bindings";

function yen(v: string) {
  return Number(v).toLocaleString("ja-JP");
}

export default function TrendPage() {
  const { data: trend,  isLoading: tL } = useTrend();
  const { data: nw,     isLoading: nL } = useNetWorth();

  const trendData = trend ?? [];
  const loading   = tL || nL;

  // 変化量: 最古 vs 最新
  const oldest = trendData[0];
  const latest = trendData[trendData.length - 1];
  const totalDelta = oldest && latest
    ? Number(latest.total) - Number(oldest.total)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">資産推移</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {trendData.length > 0
            ? `${trendData[0].dates} 〜 ${trendData[trendData.length - 1].dates}（${trendData.length}日分）`
            : "記録済みデータなし"}
        </p>
      </div>

      {/* グラフ */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        {loading ? (
          <div className="h-72 animate-pulse bg-slate-50 rounded-lg" />
        ) : (
          <TrendChart data={trendData} />
        )}
      </section>

      {/* 期間サマリ */}
      {!loading && trendData.length > 0 && nw && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="現在の純資産"  value={`¥${yen(nw.total)}`}  sub="円" main />
          <SummaryCard label="銀行口座"      value={`¥${yen(nw.bkttl)}`}  sub="円" color="text-blue-700" />
          <SummaryCard label="投資・証券"    value={`¥${yen(nw.fdttl)}`}  sub="円" color="text-violet-700" />
          {totalDelta !== null && (
            <SummaryCard
              label="期間増減"
              value={`${totalDelta >= 0 ? "+" : ""}¥${Math.abs(totalDelta).toLocaleString("ja-JP")}`}
              sub="円"
              color={totalDelta >= 0 ? "text-emerald-700" : "text-red-600"}
            />
          )}
        </section>
      )}

      {/* 推移テーブル */}
      {!loading && trendData.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">残高推移テーブル</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
                  <th className="text-left px-5 py-3">日付</th>
                  <th className="text-right px-5 py-3">銀行口座</th>
                  <th className="text-right px-5 py-3">投資・証券</th>
                  <th className="text-right px-5 py-3 font-bold text-slate-700">純資産</th>
                </tr>
              </thead>
              <tbody>
                {[...trendData].reverse().map((row: TrendPoint, i) => (
                  <tr key={row.dates} className={`border-b border-slate-50 ${i === 0 ? "font-medium" : ""}`}>
                    <td className="px-5 py-3 text-slate-600">{row.dates}</td>
                    <td className="px-5 py-3 text-right font-mono text-blue-700">
                      ¥{yen(row.bktot)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-violet-700">
                      ¥{yen(row.fdtot)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                      ¥{yen(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 空状態 */}
      {!loading && trendData.length === 0 && (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">
            口座を連携して残高を記録すると、ここにグラフが表示されます
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, main, color }: {
  label: string; value: string; sub: string;
  main?: boolean; color?: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${main ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>
      <p className={`text-xs mb-1 ${main ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`text-lg font-bold font-mono ${color ?? (main ? "text-white" : "text-slate-900")}`}>
        {value}
      </p>
      <p className={`text-xs ${main ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>
    </div>
  );
}
