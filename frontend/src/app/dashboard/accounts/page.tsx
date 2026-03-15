"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccounts, useCreateAccount } from "@/hooks/use-accounts";
import { AccountCard } from "@/components/account-card";
import type { AccountInstType } from "@/types/bindings";

const schema = z.object({
  iname: z.string().min(1, "金融機関名を入力してください").max(100),
  itype: z.enum(["bank", "brok", "card"]),
  aname: z.string().min(1, "口座名を入力してください").max(100),
});
type FormValues = z.infer<typeof schema>;

const ITYPE_OPTIONS: { value: AccountInstType; label: string; desc: string }[] = [
  { value: "bank", label: "銀行口座",     desc: "普通・定期預金など" },
  { value: "brok", label: "証券口座",     desc: "株・投資信託・ETFなど" },
  { value: "card", label: "クレジットカード", desc: "月次支出の把握に" },
];

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const { mutate, isPending }         = useCreateAccount();
  const [open, setOpen]               = useState(false);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { itype: "bank" },
  });

  const selectedType = watch("itype");

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: () => { reset(); setOpen(false); },
    });
  };

  return (
    <div className="space-y-8">
      {/* ヘッダ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">口座連携</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            銀行・証券口座を登録し、残高を一元管理します
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {open ? "キャンセル" : "+ 口座を追加"}
        </button>
      </div>

      {/* 口座登録フォーム */}
      {open && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">新規口座を連携</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* 口座種別 */}
            <div>
              <label className="block text-sm text-slate-700 mb-2">口座の種類</label>
              <div className="grid grid-cols-3 gap-2">
                {ITYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col gap-0.5 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedType === opt.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("itype")}
                      className="sr-only"
                    />
                    <span className={`text-sm font-medium ${selectedType === opt.value ? "text-indigo-700" : "text-slate-800"}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400">{opt.desc}</span>
                  </label>
                ))}
              </div>
              {errors.itype && <p className="text-red-500 text-xs mt-1">{errors.itype.message}</p>}
            </div>

            {/* 金融機関名 */}
            <div>
              <label className="block text-sm text-slate-700 mb-1.5">金融機関名</label>
              <input
                {...register("iname")}
                placeholder="例: 楽天銀行、SBI証券"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.iname && <p className="text-red-500 text-xs mt-1">{errors.iname.message}</p>}
            </div>

            {/* 口座名 */}
            <div>
              <label className="block text-sm text-slate-700 mb-1.5">口座の識別名 (任意で設定)</label>
              <input
                {...register("aname")}
                placeholder="例: 生活費口座、つみたてNISA"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.aname && <p className="text-red-500 text-xs mt-1">{errors.aname.message}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "登録中..." : "口座を追加"}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setOpen(false); }}
                className="border border-slate-300 text-slate-700 text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>

          {/* 注意事項 */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 leading-relaxed">
              口座を登録後、「同期」ボタンを押すと残高データが取得されます。
              初回同期はシステム側で処理されるため、数秒かかる場合があります。
            </p>
          </div>
        </div>
      )}

      {/* 口座一覧 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">
          {isLoading ? "読み込み中..." : `登録済み口座 ${(accounts ?? []).length} 件`}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : (accounts ?? []).length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-sm">口座がまだ登録されていません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(accounts ?? []).map((ac) => <AccountCard key={ac.objid} account={ac} />)}
          </div>
        )}
      </section>
    </div>
  );
}
