// GET    /api/v1/accounts/:id  — 連携口座取得
// DELETE /api/v1/accounts/:id  — 連携口座削除
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth();

    const row = await withAudit(user.id, user.role, AuditAction.getAccts(id), async (client) => {
      const { rows } = await client.query(
        `SELECT ac.objid, ac.ownid, ac.astid, ac.iname, ac.itype,
                ac.state, ac.lsync, ac.ctime, a.aname
         FROM   TBL_ACCTS ac
         JOIN   TBL_ASSET a ON a.objid = ac.astid
         WHERE  ac.objid = $1 AND ac.ownid = $2`,
        [id, user.id],
      );
      if (!rows[0]) throw Object.assign(new Error("account not found"), { status: 404 });
      return rows[0];
    });

    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth();

    await withAudit(user.id, user.role, AuditAction.deleteAccts(id), async (client) => {
      // TBL_ASSET (CASCADE で TBL_BALAN も削除)
      const { rows: acct } = await client.query(
        `SELECT astid FROM TBL_ACCTS WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!acct[0]) throw Object.assign(new Error("account not found"), { status: 404 });

      await client.query(`DELETE FROM TBL_ACCTS WHERE objid = $1`, [id]);
      await client.query(`DELETE FROM TBL_ASSET WHERE objid = $1`, [acct[0].astid]);
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
