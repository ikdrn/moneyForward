"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAsset } from "@/hooks/use-assets";

const schema = z.object({
  aname: z.string().min(1, "名称は必須です").max(100),
  atype: z.enum(["bank", "fund"], { required_error: "種別を選択してください" }),
});
type FormValues = z.infer<typeof schema>;

export function AssetForm() {
  const { mutate, isPending } = useCreateAsset();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* 資産名 */}
      <div>
        <label className="block text-sm font-medium mb-1">資産名</label>
        <input
          {...register("aname")}
          placeholder="例: 楽天銀行・eMAXIS Slim 全世界株式"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.aname && <p className="text-red-500 text-xs mt-1">{errors.aname.message}</p>}
      </div>

      {/* 資産種別 */}
      <div>
        <label className="block text-sm font-medium mb-1">種別</label>
        <select
          {...register("atype")}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          <option value="bank">銀行口座</option>
          <option value="fund">投資信託</option>
        </select>
        {errors.atype && <p className="text-red-500 text-xs mt-1">{errors.atype.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "登録中..." : "資産を追加"}
      </button>
    </form>
  );
}
