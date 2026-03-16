import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";
import { getPlanLimits, historyFrom } from "@/lib/plan";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const user  = await verifyAuth();
    const plan  = await getPlanLimits(user.id);
    const since = historyFrom(plan.hislm); // null=無制限, YYYY-MM-DD=カットオフ

    const rows = await withAudit(user.id, user.role, AuditAction.getTrend(), async (client) => {
      const { rows } = await client.query(
        `SELECT
           b.dates,
           SUM(CASE WHEN a.atype = 'bank' THEN b.amnts ELSE 0 END)::text AS bktot,
           SUM(CASE WHEN a.atype = 'fund' THEN b.amnts ELSE 0 END)::text AS fdtot,
           SUM(b.amnts)::text AS total
         FROM   TBL_BALAN b
         JOIN   TBL_ASSET  a ON a.objid = b.astid
         WHERE  b.ownid = $1
           AND  ($2::date IS NULL OR b.dates >= $2::date)
         GROUP  BY b.dates
         ORDER  BY b.dates ASC`,
        [user.id, since],
      );
      return rows;
    });

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}
