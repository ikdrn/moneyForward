// GET  /api/v1/accounts  — 連携口座一覧
// POST /api/v1/accounts  — 口座新規連携
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";
import { getPlanLimits } from "@/lib/plan";
import { pool } from "@/lib/db";

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  iname: z.string().min(1).max(100),
  itype: z.enum(["bank", "brok", "card"]),
  aname: z.string().min(1).max(100), // 対応する TBL_ASSET の名称
});

export async function GET(_req: NextRequest) {
  try {
    const user = await verifyAuth();

    const rows = await withAudit(user.id, user.role, AuditAction.listAccts(), async (client) => {
      const { rows } = await client.query(
        `SELECT
           ac.objid, ac.ownid, ac.astid, ac.iname, ac.itype,
           ac.state, ac.lsync, ac.ctime,
           a.aname,
           (SELECT b.amnts::text
            FROM TBL_BALAN b
            WHERE b.astid = ac.astid
            ORDER BY b.dates DESC, b.ctime DESC
            LIMIT 1
           ) AS amnts,
           (SELECT b.dates
            FROM TBL_BALAN b
            WHERE b.astid = ac.astid
            ORDER BY b.dates DESC, b.ctime DESC
            LIMIT 1
           ) AS dates
         FROM TBL_ACCTS ac
         JOIN TBL_ASSET a ON a.objid = ac.astid
         WHERE ac.ownid = $1
         ORDER BY ac.itype, ac.iname`,
        [user.id],
      );
      return rows;
    });

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user  = await verifyAuth();
    const body  = CreateSchema.parse(await req.json());
    const newId = crypto.randomUUID();
    const astId = crypto.randomUUID();

    // 口座数制限チェック (free = 4件まで)
    const plan = await getPlanLimits(user.id);
    if (plan.acclm !== -1) {
      const { rows: cnt } = await pool.query(
        `SELECT COUNT(*) AS c FROM TBL_ACCTS WHERE ownid = $1`,
        [user.id],
      );
      if (Number(cnt[0].c) >= plan.acclm) {
        return NextResponse.json(
          { error: `無料プランは口座${plan.acclm}件まで連携できます。プレミアムにアップグレードすると無制限に追加できます。`, upgrade: true },
          { status: 403 },
        );
      }
    }

    // itype → atype マッピング (TBL_ASSET は bank/fund のみ)
    const atype = body.itype === "brok" ? "fund" : "bank";

    const row = await withAudit(user.id, user.role, AuditAction.createAccts(newId), async (client) => {
      // 1. TBL_ASSET 作成
      await client.query(
        `INSERT INTO TBL_ASSET (objid, ownid, aname, atype)
         VALUES ($1, $2, $3, $4)`,
        [astId, user.id, body.aname, atype],
      );

      // 2. TBL_ACCTS 作成
      const { rows } = await client.query(
        `INSERT INTO TBL_ACCTS (objid, ownid, astid, iname, itype)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING objid, ownid, astid, iname, itype, state, lsync, ctime`,
        [newId, user.id, astId, body.iname, body.itype],
      );
      return { ...rows[0], aname: body.aname, amnts: null, dates: null };
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
