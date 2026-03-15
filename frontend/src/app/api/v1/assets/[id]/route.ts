// GET    /api/v1/assets/:id  — 資産取得
// PATCH  /api/v1/assets/:id  — 資産更新
// DELETE /api/v1/assets/:id  — 資産削除
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

const UpdateAssetSchema = z.object({
  aname: z.string().min(1).max(100).optional(),
  atype: z.enum(["bank", "fund"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth(req);

    const row = await withAudit(user.id, user.role, AuditAction.getAsset(id), async (client) => {
      const { rows } = await client.query(
        `SELECT objid, ownid, aname, atype, ctime
         FROM   TBL_ASSET
         WHERE  objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rows[0]) throw Object.assign(new Error("asset not found"), { status: 404 });
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
    const body   = UpdateAssetSchema.parse(await req.json());

    const row = await withAudit(user.id, user.role, AuditAction.updateAsset(id), async (client) => {
      const { rows: existing } = await client.query(
        `SELECT aname, atype FROM TBL_ASSET WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!existing[0]) throw Object.assign(new Error("asset not found"), { status: 404 });

      const { rows } = await client.query(
        `UPDATE TBL_ASSET SET aname = $1, atype = $2
         WHERE  objid = $3 AND ownid = $4
         RETURNING objid, ownid, aname, atype, ctime`,
        [body.aname ?? existing[0].aname, body.atype ?? existing[0].atype, id, user.id],
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

    await withAudit(user.id, user.role, AuditAction.deleteAsset(id), async (client) => {
      const { rowCount } = await client.query(
        `DELETE FROM TBL_ASSET WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rowCount) throw Object.assign(new Error("asset not found"), { status: 404 });
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
