"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBalance } from "@/hooks/use-balances";
import type { Asset } from "@/types/bindings";

const schema = z.object({
  astid: z.string().uuid("資産を選択してください"),
  amnts: z.string()
    .min(1, "残高は必須です")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "0以上の数値を入力してください"),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください"),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  assets:         Asset[];
  defaultAssetId?: string;  // 特定資産の画面から開いた場合に初期値設定
}

export function BalanceForm({ assets, defaultAssetId }: Props) {
  const { mutate, isPending } = useCreateBalance();
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      astid: defaultAssetId ?? "",
      dates: today,
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess: () => reset({ astid: values.astid, dates: today }) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* 資産選択 */}
      <div>
        <label className="block text-sm font-medium mb-1">資産</label>
        <select
          {...register("astid")}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {assets.map((a) => (
            <option key={a.objid} value={a.objid}>
              {a.aname} ({a.atype === "bank" ? "銀行口座" : "投資信託"})
            </option>
          ))}
        </select>
        {errors.astid && <p className="text-red-500 text-xs mt-1">{errors.astid.message}</p>}
      </div>

      {/* 残高 */}
      <div>
        <label className="block text-sm font-medium mb-1">残高 (円)</label>
        <input
          {...register("amnts")}
          type="number"
          min="0"
          step="1"
          placeholder="1000000"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.amnts && <p className="text-red-500 text-xs mt-1">{errors.amnts.message}</p>}
      </div>

      {/* 記録日 */}
      <div>
        <label className="block text-sm font-medium mb-1">記録日</label>
        <input
          {...register("dates")}
          type="date"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.dates && <p className="text-red-500 text-xs mt-1">{errors.dates.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "記録中..." : "残高を記録"}
      </button>
    </form>
  );
}
