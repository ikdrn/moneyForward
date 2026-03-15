import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

const UpdateSchema = z.object({
  catid: z.string().uuid().optional(),
  amnts: z.string().refine((v) => !isNaN(Number(v)) && Number(v) !== 0, {
    message: "0 以外の数値文字列を指定してください",
  }).optional(),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type Params = { params: Promise<{ id: string }> };

// ── GET /api/v1/transactions/:id ──────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);

    const row = await withAudit(user.id, user.role, AuditAction.getTrans(id), async (client) => {
      const { rows } = await client.query(
        `SELECT objid, ownid, catid, amnts::text AS amnts, dates, ctime
         FROM   TBL_TRANS
         WHERE  objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rows[0]) throw Object.assign(new Error("transaction not found"), { status: 404 });
      return rows[0];
    });

    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

// ── PATCH /api/v1/transactions/:id ───────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);
    const body   = UpdateSchema.parse(await req.json());

    const row = await withAudit(user.id, user.role, AuditAction.updateTrans(id), async (client) => {
      // 既存レコード取得 (所有確認 + デフォルト値)
      const { rows: existing } = await client.query(
        `SELECT catid, amnts::text AS amnts, dates FROM TBL_TRANS WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!existing[0]) throw Object.assign(new Error("transaction not found"), { status: 404 });

      const catid = body.catid ?? existing[0].catid;
      const amnts = body.amnts ?? existing[0].amnts;
      const dates = body.dates ?? existing[0].dates;

      const { rows } = await client.query(
        `UPDATE TBL_TRANS SET catid=$1, amnts=$2, dates=$3
         WHERE  objid=$4 AND ownid=$5
         RETURNING objid, ownid, catid, amnts::text AS amnts, dates, ctime`,
        [catid, amnts, dates, id, user.id],
      );
      return rows[0];
    });

    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

// ── DELETE /api/v1/transactions/:id ──────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);

    await withAudit(user.id, user.role, AuditAction.deleteTrans(id), async (client) => {
      const { rowCount } = await client.query(
        `DELETE FROM TBL_TRANS WHERE objid=$1 AND ownid=$2`,
        [id, user.id],
      );
      if (!rowCount) throw Object.assign(new Error("transaction not found"), { status: 404 });
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
