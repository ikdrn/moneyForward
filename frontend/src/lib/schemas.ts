import { z } from "zod";

// ── TBL_TRANS バリデーション (フロント側) ───────────────────
export const createTransactionSchema = z.object({
  catid: z.string().uuid("有効な科目を選択してください"),
  amnts: z
    .string()
    .min(1, "金額を入力してください")
    .refine((v) => !isNaN(Number(v)) && Number(v) !== 0, {
      message: "0以外の数値を入力してください",
    }),
  dates: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で入力してください"),
});

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.partial();
export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>;

// ── TBL_CATEG バリデーション ─────────────────────────────────
export const createCategorySchema = z.object({
  cname: z.string().min(1, "科目名を入力してください").max(100, "100文字以内で入力してください"),
  ctype: z.enum(["income", "expense"], { message: "収入または支出を選択してください" }),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
