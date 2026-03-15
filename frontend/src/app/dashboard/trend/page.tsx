"use client";

import { useTrend }  from "@/hooks/use-trend";
import { useAssets } from "@/hooks/use-assets";
import { TrendChart } from "@/components/trend-chart";

export default function TrendPage() {
  const { data: trend,  isLoading: tLoading } = useTrend();
  const { data: assets, isLoading: aLoading } = useAssets();

  const isLoading = tLoading || aLoading;

  if (isLoading) {
    return <p className="text-center py-12 text-gray-400">読み込み中...</p>;
  }

  const assetCount = (assets ?? []).length;
  const trendData  = trend ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">資産推移</h1>
        <span className="text-sm text-gray-400">
          {assetCount} 件の資産 / {trendData.length} 日分のデータ
        </span>
      </div>

      {/* グラフエリア */}
      <section className="border rounded-lg bg-white p-5">
        <TrendChart data={trendData} />
      </section>

      {/* 詳細テーブル */}
      {trendData.length > 0 && (
        <section className="border rounded-lg bg-white p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-600">残高推移テーブル</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left p-2">日付</th>
                  <th className="text-right p-2">銀行口座</th>
                  <th className="text-right p-2">投資信託</th>
                  <th className="text-right p-2 font-bold">総資産</th>
                </tr>
              </thead>
              <tbody>
                {[...trendData].reverse().map((row) => (
                  <tr key={row.dates} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-600">{row.dates}</td>
                    <td className="p-2 text-right font-mono text-blue-700">
                      {Number(row.bktot).toLocaleString("ja-JP")} 円
                    </td>
                    <td className="p-2 text-right font-mono text-green-700">
                      {Number(row.fdtot).toLocaleString("ja-JP")} 円
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      {Number(row.total).toLocaleString("ja-JP")} 円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 資産なし案内 */}
      {assetCount === 0 && (
        <div className="border rounded-lg bg-blue-50 p-6 text-center text-sm text-blue-700">
          「資産管理」タブで銀行口座・投資信託を登録し、残高を記録するとグラフが表示されます。
        </div>
      )}
    </div>
  );
}
