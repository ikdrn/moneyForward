"use client";

import { useState }    from "react";
import { useAssets, useDeleteAsset }   from "@/hooks/use-assets";
import { useBalances, useDeleteBalance } from "@/hooks/use-balances";
import { AssetForm }   from "@/components/asset-form";
import { BalanceForm } from "@/components/balance-form";
import type { Asset }  from "@/types/bindings";

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  const { mutate: deleteAsset }     = useDeleteAsset();
  const [selected, setSelected]     = useState<Asset | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">手動入力</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          自動連携できない口座・資産を手動で管理します
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">資産を追加</h2>
          <AssetForm />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">残高を記録</h2>
          {(assets ?? []).length === 0 ? (
            <p className="text-slate-400 text-sm">先に資産を追加してください</p>
          ) : (
            <BalanceForm assets={assets ?? []} defaultAssetId={selected?.objid} />
          )}
        </div>
      </div>

      {/* 資産一覧 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">
          {isLoading ? "読み込み中..." : `登録済み資産 ${(assets ?? []).length} 件`}
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (assets ?? []).length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-sm">資産が登録されていません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(assets ?? []).map((asset) => (
              <AssetRow
                key={asset.objid}
                asset={asset}
                isSelected={selected?.objid === asset.objid}
                onSelect={() => setSelected(asset)}
                onDelete={() => deleteAsset(asset.objid)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AssetRow({ asset, isSelected, onSelect, onDelete }: {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { data: balances }        = useBalances(asset.objid);
  const { mutate: deleteBalance } = useDeleteBalance();

  const [expanded, setExpanded] = useState(false);
  const latest = balances?.[0];

  const typeColor = asset.atype === "bank"
    ? "bg-blue-50 text-blue-700 border border-blue-200"
    : "bg-violet-50 text-violet-700 border border-violet-200";
  const typeLabel = asset.atype === "bank" ? "銀行" : "投信/証券";

  return (
    <div className={`bg-white border rounded-xl transition-all ${isSelected ? "border-indigo-300" : "border-slate-200"}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${typeColor}`}>
            {typeLabel}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{asset.aname}</p>
            {latest && (
              <p className="text-xs text-slate-400 font-mono">
                ¥{Number(latest.amnts).toLocaleString("ja-JP")} ({latest.dates})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={onSelect}   className="text-xs text-indigo-600 hover:text-indigo-800">残高追加</button>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-slate-600">
            {expanded ? "閉じる" : "履歴"}
          </button>
          <button onClick={onDelete}   className="text-xs text-slate-400 hover:text-red-500">削除</button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-3">
          {(balances ?? []).length === 0 ? (
            <p className="text-slate-400 text-xs py-2">履歴なし</p>
          ) : (
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left py-1">記録日</th>
                  <th className="text-right py-1">残高</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {(balances ?? []).slice(0, 8).map((b) => (
                  <tr key={b.objid} className="border-t border-slate-50">
                    <td className="py-1 text-slate-600">{b.dates}</td>
                    <td className="py-1 text-right font-mono">¥{Number(b.amnts).toLocaleString("ja-JP")}</td>
                    <td className="py-1 text-right">
                      <button onClick={() => deleteBalance(b.objid)} className="text-slate-300 hover:text-red-500">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
