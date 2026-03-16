export const dynamic = "force-dynamic";

// GET  /api/v1/dividends  — 配当金履歴 (Advance+)
// POST /api/v1/dividends  — 配当金追加
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { withAudit } from "@/lib/audit";
import { verifyAuth } from "@/lib/auth";
import { getPlanLimits, isAdvance } from "@/lib/plan";

export async function GET(_req: NextRequest) {
  try {
    const { id: userId } = await verifyAuth();
    const plan = await getPlanLimits(userId);

    if (!isAdvance(plan.pname)) {
      return NextResponse.json(
        { error: "配当金追跡はAdvanceプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    const { rows } = await pool.query(
      `SELECT d.objid, d.astid, d.amnts::text, d.dates, d.notes, a.aname
       FROM TBL_DIVID d
       JOIN TBL_ASSET a ON a.objid = d.astid
       WHERE d.ownid = $1
       ORDER BY d.dates DESC`,
      [userId],
    );

    // 年間合計も計算
    const { rows: summary } = await pool.query(
      `SELECT
         EXTRACT(YEAR FROM dates)::text AS year,
         SUM(amnts)::text               AS total
       FROM TBL_DIVID
       WHERE ownid = $1
       GROUP BY EXTRACT(YEAR FROM dates)
       ORDER BY year DESC`,
      [userId],
    );

    return NextResponse.json({ list: rows, yearly: summary });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId, role } = await verifyAuth();

    const plan = await getPlanLimits(userId);

    if (!isAdvance(plan.pname)) {
      return NextResponse.json(
        { error: "配当金追跡はAdvanceプランでご利用いただけます。", upgrade: true },
        { status: 403 },
      );
    }

    const { astid, amnts, dates, notes } = await req.json();
    if (!astid || !amnts || !dates) {
      return NextResponse.json({ error: "astid, amnts, dates は必須です" }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const row = await withAudit(userId, role, `createDivid:${newId}`, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO TBL_DIVID (objid, ownid, astid, amnts, dates, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING objid, astid, amnts::text, dates, notes`,
        [newId, userId, astid, amnts, dates, notes ?? null],
      );
      return rows[0];
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
