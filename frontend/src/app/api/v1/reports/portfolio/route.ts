export const dynamic = "force-dynamic";

// GET /api/v1/reports/portfolio — 実際配分 + 目標配分
// PUT /api/v1/reports/portfolio — 目標配分を保存 (Advance+ 限定)
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { getPlanLimits, isAdvance } from "@/lib/plan";

export async function GET(_req: NextRequest) {
  try {
    const { id: userId } = await verifyAuth();
    const plan = await getPlanLimits(userId);

    if (!isAdvance(plan.pname)) {
      return NextResponse.json(
        { error: "ポートフォリオ管理はAdvanceプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    // 実際の資産配分 (最新残高ベース)
    const { rows: actual } = await pool.query(
      `SELECT a.atype, SUM(b.amnts)::text AS amnts
       FROM (
         SELECT DISTINCT ON (astid) astid, amnts
         FROM TBL_BALAN
         WHERE ownid = $1
         ORDER BY astid, dates DESC
       ) b
       JOIN TBL_ASSET a ON a.objid = b.astid
       WHERE a.ownid = $1
       GROUP BY a.atype`,
      [userId],
    );

    // 目標配分
    const { rows: targets } = await pool.query(
      `SELECT atype, trrat::text FROM TBL_PORTF WHERE ownid = $1`,
      [userId],
    );

    return NextResponse.json({ actual, targets });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id: userId } = await verifyAuth();
    const plan = await getPlanLimits(userId);

    if (!isAdvance(plan.pname)) {
      return NextResponse.json(
        { error: "ポートフォリオ管理はAdvanceプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    // [{ atype: 'bank', trrat: 40 }, { atype: 'fund', trrat: 60 }]
    const targets: { atype: string; trrat: number }[] = await req.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const t of targets) {
        await client.query(
          `INSERT INTO TBL_PORTF (ownid, atype, trrat)
           VALUES ($1, $2, $3)
           ON CONFLICT (ownid, atype)
           DO UPDATE SET trrat = EXCLUDED.trrat`,
          [userId, t.atype, t.trrat],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
