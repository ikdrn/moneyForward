import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  catid: z.string().uuid(),
  amnts: z.string().refine((v) => !isNaN(Number(v)) && Number(v) !== 0, {
    message: "0 以外の数値文字列を指定してください",
  }),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await verifyAuth();

    const rows = await withAudit(user.id, user.role, AuditAction.listTrans(), async (client) => {
      const { rows } = await client.query(
        `SELECT objid, ownid, catid, amnts::text AS amnts, dates, ctime
         FROM   TBL_TRANS
         WHERE  ownid = $1
         ORDER  BY dates DESC, ctime DESC`,
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

    const row = await withAudit(user.id, user.role, AuditAction.createTrans(newId), async (client) => {
      const { rows } = await client.query(
        `INSERT INTO TBL_TRANS (objid, ownid, catid, amnts, dates)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING objid, ownid, catid, amnts::text AS amnts, dates, ctime`,
        [newId, user.id, body.catid, body.amnts, body.dates],
      );
      return rows[0];
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
