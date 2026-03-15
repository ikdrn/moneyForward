// GET    /api/v1/balances/:id  — 残高履歴1件取得
// PATCH  /api/v1/balances/:id  — 残高更新
// DELETE /api/v1/balances/:id  — 残高削除
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

const UpdateBalanSchema = z.object({
  amnts: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
    message: "0以上の数値文字列を指定してください",
  }).optional(),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);

    const row = await withAudit(user.id, user.role, AuditAction.getBalan(id), async (client) => {
      const { rows } = await client.query(
        `SELECT objid, ownid, astid, amnts::text AS amnts, dates, ctime
         FROM   TBL_BALAN
         WHERE  objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rows[0]) throw Object.assign(new Error("balance not found"), { status: 404 });
      return rows[0];
    });

    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);
    const body   = UpdateBalanSchema.parse(await req.json());

    const row = await withAudit(user.id, user.role, AuditAction.updateBalan(id), async (client) => {
      const { rows: existing } = await client.query(
        `SELECT amnts::text AS amnts, dates FROM TBL_BALAN WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!existing[0]) throw Object.assign(new Error("balance not found"), { status: 404 });

      const { rows } = await client.query(
        `UPDATE TBL_BALAN SET amnts = $1, dates = $2
         WHERE  objid = $3 AND ownid = $4
         RETURNING objid, ownid, astid, amnts::text AS amnts, dates, ctime`,
        [body.amnts ?? existing[0].amnts, body.dates ?? existing[0].dates, id, user.id],
      );
      return rows[0];
    });

    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);

    await withAudit(user.id, user.role, AuditAction.deleteBalan(id), async (client) => {
      const { rowCount } = await client.query(
        `DELETE FROM TBL_BALAN WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rowCount) throw Object.assign(new Error("balance not found"), { status: 404 });
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
