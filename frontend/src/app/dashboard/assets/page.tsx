"use client";

import { useState } from "react";
import { useAssets, useDeleteAsset } from "@/hooks/use-assets";
import { useBalances, useDeleteBalance } from "@/hooks/use-balances";
import { AssetForm } from "@/components/asset-form";
import { BalanceForm } from "@/components/balance-form";
import type { Asset } from "@/types/bindings";

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  const { mutate: deleteAsset }     = useDeleteAsset();
  const [selected, setSelected]     = useState<Asset | null>(null);

  if (isLoading) return <p className="text-center py-12 text-gray-400">読み込み中...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">資産管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 資産登録フォーム */}
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="text-base font-semibold mb-4">資産を追加</h2>
          <AssetForm />
        </section>

        {/* 残高記録フォーム */}
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="text-base font-semibold mb-4">残高を記録</h2>
          {(assets ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">先に資産を追加してください</p>
          ) : (
            <BalanceForm assets={assets ?? []} defaultAssetId={selected?.objid} />
          )}
        </section>
      </div>

      {/* 資産一覧 */}
      <section>
        <h2 className="text-base font-semibold mb-3">登録済み資産</h2>
        {(assets ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">資産が登録されていません</p>
        ) : (
          <div className="space-y-4">
            {(assets ?? []).map((asset) => (
              <AssetCard
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

// ── 資産カード (残高履歴を展開表示) ─────────────────────────
function AssetCard({
  asset, isSelected, onSelect, onDelete,
}: {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { data: balances } = useBalances(asset.objid);
  const { mutate: deleteBalance } = useDeleteBalance();

  const typeLabel = asset.atype === "bank" ? "銀行口座" : "投資信託";
  const typeColor = asset.atype === "bank" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";

  const latest = balances?.[0];

  return (
    <div className={`border rounded-lg bg-white ${isSelected ? "ring-2 ring-blue-400" : ""}`}>
      {/* ヘッダ */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="font-medium">{asset.aname}</span>
          {latest && (
            <span className="text-sm text-gray-500 font-mono">
              最新: {Number(latest.amnts).toLocaleString("ja-JP")} 円
              <span className="ml-1 text-xs text-gray-400">({latest.dates})</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="text-xs text-blue-500 hover:underline"
          >
            残高追加
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:underline"
          >
            削除
          </button>
        </div>
      </div>

      {/* 残高履歴 */}
      {(balances ?? []).length > 0 && (
        <div className="border-t px-4 pb-3">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left py-1">記録日</th>
                <th className="text-right py-1">残高</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {(balances ?? []).slice(0, 6).map((b) => (
                <tr key={b.objid} className="border-t border-gray-50">
                  <td className="py-1 text-gray-600">{b.dates}</td>
                  <td className="py-1 text-right font-mono">
                    {Number(b.amnts).toLocaleString("ja-JP")} 円
                  </td>
                  <td className="py-1 text-right">
                    <button
                      onClick={() => deleteBalance(b.objid)}
                      className="text-red-400 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
