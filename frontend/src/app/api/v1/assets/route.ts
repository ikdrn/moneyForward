import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

export const dynamic = 'force-dynamic';

const CreateAssetSchema = z.object({
  aname: z.string().min(1).max(100),
  atype: z.enum(["bank", "fund"]),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await verifyAuth();
    const rows = await withAudit(user.id, user.role, AuditAction.listAsset(), async (client) => {
      const { rows } = await client.query(
        `SELECT objid, ownid, aname, atype, ctime FROM TBL_ASSET WHERE ownid=$1 ORDER BY ctime DESC`,
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
    const body  = CreateAssetSchema.parse(await req.json());
    const newId = crypto.randomUUID();
    const row = await withAudit(user.id, user.role, AuditAction.createAsset(newId), async (client) => {
      const { rows } = await client.query(
        `INSERT INTO TBL_ASSET (objid, ownid, aname, atype) VALUES ($1,$2,$3,$4)
         RETURNING objid, ownid, aname, atype, ctime`,
        [newId, user.id, body.aname, body.atype],
      );
      return rows[0];
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
