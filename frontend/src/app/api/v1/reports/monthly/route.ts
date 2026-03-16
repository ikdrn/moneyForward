export const dynamic = "force-dynamic";

// GET /api/v1/reports/monthly?months=12
// Standard+ プラン限定: 月次収支レポート
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { getPlanLimits, isPremium, historyFrom } from "@/lib/plan";

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await verifyAuth();
    const plan = await getPlanLimits(userId);

    if (!isPremium(plan.pname)) {
      return NextResponse.json(
        { error: "マンスリーレポートはStandard以上のプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    const since = historyFrom(plan.hislm);

    // TBL_TRANS を月次集計 (キャッシュ優先、なければオンデマンド)
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(dates, 'YYYY-MM')       AS ymont,
         SUM(CASE WHEN amnts > 0 THEN  amnts ELSE 0 END)::text AS incms,
         SUM(CASE WHEN amnts < 0 THEN -amnts ELSE 0 END)::text AS expns,
         SUM(amnts)::text                                       AS savng
       FROM TBL_TRANS
       WHERE ownid = $1
         AND ($2::date IS NULL OR dates >= $2::date)
       GROUP BY TO_CHAR(dates, 'YYYY-MM')
       ORDER BY ymont DESC`,
      [userId, since],
    );

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
