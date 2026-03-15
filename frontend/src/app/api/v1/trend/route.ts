// GET /api/v1/trend  — 資産推移データ取得
//
// 集計ロジック:
//   各 dates ごとに、全資産の残高を SUM する
//   種別 (bank / fund) 別にも集計 → フロントのグラフ描画に利用
//
// レスポンス: TrendPoint[]
//   { dates, total, bktot, fdtot }
//   ※ 全てのフィールドを 5 文字固定で統一
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);

    const rows = await withAudit(user.id, user.role, AuditAction.getTrend(), async (client) => {
      // ── 時系列集計クエリ ───────────────────────────────────
      // dates ごとに bank 合計・fund 合計・全体合計を集計
      const { rows } = await client.query(
        `SELECT
           b.dates,
           SUM(CASE WHEN a.atype = 'bank' THEN b.amnts ELSE 0 END)::text AS bktot,
           SUM(CASE WHEN a.atype = 'fund' THEN b.amnts ELSE 0 END)::text AS fdtot,
           SUM(b.amnts)::text AS total
         FROM   TBL_BALAN b
         JOIN   TBL_ASSET  a ON a.objid = b.astid
         WHERE  b.ownid = $1
         GROUP  BY b.dates
         ORDER  BY b.dates ASC`,
        [user.id],
      );
      return rows;
    });

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}
