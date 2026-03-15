import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(e: unknown): NextResponse {
  // ステータスコード付きエラー
  if (e instanceof Error && "status" in e) {
    const status = (e as Error & { status: number }).status;
    return NextResponse.json({ error: e.message }, { status });
  }
  // Zod バリデーションエラー
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: "バリデーションエラー", details: e.flatten().fieldErrors },
      { status: 422 },
    );
  }
  // 予期せぬエラー
  console.error(e);
  return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
}
