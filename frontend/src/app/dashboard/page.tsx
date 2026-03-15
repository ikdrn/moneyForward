"use client";

import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useQuery } from "@tanstack/react-query";
import { categoryApi } from "@/lib/api-client";
import { TransactionForm } from "@/components/transaction-form";

export default function DashboardPage() {
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn:  categoryApi.list,
  });
  const { mutate: deleteTransaction } = useDeleteTransaction();

  if (txLoading || catLoading) return <p className="p-8">読み込み中...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">収支一覧</h1>

      {/* 新規登録フォーム */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">新規明細登録</h2>
        <TransactionForm categories={categories ?? []} />
      </section>

      {/* 一覧テーブル */}
      <section>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">日付</th>
              <th className="text-left p-2">科目</th>
              <th className="text-right p-2">金額</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(transactions ?? []).map((t) => {
              const cat = (categories ?? []).find((c) => c.id___ === t.catid);
              const amount = Number(t.amnts);
              return (
                <tr key={t.id___} className="border-b hover:bg-gray-50">
                  <td className="p-2">{t.dates}</td>
                  <td className="p-2">{cat?.cname ?? t.catid}</td>
                  <td className={`p-2 text-right font-mono ${amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {amount >= 0 ? "+" : ""}{amount.toLocaleString("ja-JP")} 円
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => deleteTransaction(t.id___)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
