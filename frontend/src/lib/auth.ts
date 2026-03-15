// サーバー用認証ヘルパー
// API Routes と Server Components から呼ぶ
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface AuthUser {
  id:   string;
  role: "app_user" | "app_admin";
}

// Next.js API Routes / Server Components で呼ぶ
// Supabase のセッションクッキーを検証してユーザ情報を返す
export async function verifyAuth(): Promise<AuthUser> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* API Routes は読み取り専用 */ },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw Object.assign(new Error("認証が必要です"), { status: 401 });
  }

  // role は Supabase の user_metadata に保存 (デフォルト: app_user)
  const raw = user.user_metadata?.role as string | undefined;
  const role: AuthUser["role"] =
    raw === "app_admin" ? "app_admin" : "app_user";

  return { id: user.id, role };
}
