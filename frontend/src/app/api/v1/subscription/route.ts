export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const { id: userId } = await verifyAuth();

    const { rows } = await pool.query(
      `SELECT p.pname, p.price, p.acclm, p.hislm, s.state, s.stime, s.etime
       FROM TBL_SUBSC s
       JOIN TBL_PLANS p ON p.objid = s.plnid
       WHERE s.ownid = $1`,
      [userId],
    );

    if (rows.length === 0) {
      // サブスクなし → free 扱い
      return NextResponse.json({ pname: "free", price: 0, acclm: 4, hislm: 12, state: "activ" });
    }

    const row = rows[0];
    return NextResponse.json({
      pname: row.pname,
      price: row.price,
      acclm: row.acclm,
      hislm: row.hislm,
      state: row.state,
      stime: row.stime,
      etime: row.etime,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
