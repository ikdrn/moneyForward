export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pool } from "@/lib/db";

// Supabase Admin Client (service_role — サーバー側のみ)
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase admin env vars not set");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "email と password は必須です" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }

    const admin = adminClient();

    // メール確認なしでユーザを作成 (email_confirm: true = 即時確認済み扱い)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // ← メール送信なしで即時アクティブ化
    });

    if (error) {
      // 重複メールは 422 で返ってくる
      const status = error.status === 422 ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    const userId = data.user.id;

    // TBL_USERS にも同期登録 (RLS の ownid 参照用)
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO TBL_USERS (objid, email, roles)
         VALUES ($1, $2, 'app_user')
         ON CONFLICT (objid) DO NOTHING`,
        [userId, email],
      );
      await client.query(
        `INSERT INTO TBL_SUBSC (ownid, plnid, state)
         SELECT $1, objid, 'activ'
         FROM TBL_PLANS WHERE pname = 'free'
         ON CONFLICT DO NOTHING`,
        [userId],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ id: userId }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
