"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTransactionSchema,
  type CreateTransactionFormValues,
} from "@/lib/schemas";
import { useCreateTransaction } from "@/hooks/use-transactions";
import type { Category } from "@/types/bindings";

interface Props {
  categories: Category[];
  onSuccess?: () => void;
}

export function TransactionForm({ categories, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
  });

  const { mutateAsync, isError, error } = useCreateTransaction();

  const onSubmit = async (values: CreateTransactionFormValues) => {
    await mutateAsync(values);
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 科目選択 */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="catid">
          科目
        </label>
        <select
          id="catid"
          {...register("catid")}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">選択してください</option>
          {categories.map((c) => (
            <option key={c.objid} value={c.objid}>
              [{c.ctype === "income" ? "収入" : "支出"}] {c.cname}
            </option>
          ))}
        </select>
        {errors.catid && (
          <p className="text-red-500 text-xs mt-1">{errors.catid.message}</p>
        )}
      </div>

      {/* 金額 */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="amnts">
          金額
        </label>
        <input
          id="amnts"
          type="text"
          inputMode="numeric"
          placeholder="例: -3500 または 200000"
          {...register("amnts")}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {errors.amnts && (
          <p className="text-red-500 text-xs mt-1">{errors.amnts.message}</p>
        )}
      </div>

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dates">
          日付
        </label>
        <input
          id="dates"
          type="date"
          {...register("dates")}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {errors.dates && (
          <p className="text-red-500 text-xs mt-1">{errors.dates.message}</p>
        )}
      </div>

      {/* API エラー */}
      {isError && (
        <p className="text-red-600 text-sm">
          {(error as Error).message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
