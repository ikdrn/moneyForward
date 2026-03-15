// GET /api/v1/networth — 純資産リアルタイム算出
// 各資産の最新残高を集計して返す
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const user = await verifyAuth();

    const data = await withAudit(user.id, user.role, AuditAction.getTrend(), async (client) => {
      // ── 純資産: 各資産の最新残高を集計 ───────────────────────
      const { rows: [summary] } = await client.query(
        `WITH latest AS (
           SELECT DISTINCT ON (b.astid)
             b.astid, b.amnts, b.dates
           FROM TBL_BALAN b
           WHERE b.ownid = $1
           ORDER BY b.astid, b.dates DESC, b.ctime DESC
         )
         SELECT
           COALESCE(SUM(CASE WHEN a.atype = 'bank' THEN l.amnts ELSE 0 END), 0)::text AS bkttl,
           COALESCE(SUM(CASE WHEN a.atype = 'fund' THEN l.amnts ELSE 0 END), 0)::text AS fdttl,
           COALESCE(SUM(l.amnts), 0)::text AS total,
           MAX(l.dates) AS lasdt
         FROM latest l
         JOIN TBL_ASSET a ON a.objid = l.astid`,
        [user.id],
      );

      // ── 前月同日の資産合計 (変化率計算用) ────────────────────
      const { rows: [prev] } = await client.query(
        `WITH monthly AS (
           SELECT DISTINCT ON (b.astid)
             b.astid, b.amnts
           FROM TBL_BALAN b
           WHERE b.ownid = $1
             AND b.dates <= (CURRENT_DATE - INTERVAL '1 month')
           ORDER BY b.astid, b.dates DESC, b.ctime DESC
         )
         SELECT COALESCE(SUM(m.amnts), 0)::text AS total
         FROM monthly m`,
        [user.id],
      );

      return { ...summary, prevt: prev?.total ?? "0" };
    });

    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
