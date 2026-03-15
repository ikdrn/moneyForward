import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

const CreateBalanSchema = z.object({
  astid: z.string().uuid(),
  amnts: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  try {
    const user  = await verifyAuth();
    const astid = req.nextUrl.searchParams.get("astid");

    const rows = await withAudit(user.id, user.role, AuditAction.listBalan(astid), async (client) => {
      if (astid) {
        const { rows } = await client.query(
          `SELECT objid, ownid, astid, amnts::text AS amnts, dates, ctime
           FROM TBL_BALAN WHERE ownid=$1 AND astid=$2 ORDER BY dates DESC`,
          [user.id, astid],
        );
        return rows;
      }
      const { rows } = await client.query(
        `SELECT objid, ownid, astid, amnts::text AS amnts, dates, ctime
         FROM TBL_BALAN WHERE ownid=$1 ORDER BY dates DESC, ctime DESC`,
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
    const body  = CreateBalanSchema.parse(await req.json());
    const newId = crypto.randomUUID();

    const row = await withAudit(user.id, user.role, AuditAction.createBalan(newId), async (client) => {
      const { rows: asset } = await client.query(
        `SELECT objid FROM TBL_ASSET WHERE objid=$1 AND ownid=$2`, [body.astid, user.id],
      );
      if (!asset[0]) throw Object.assign(new Error("asset not found"), { status: 404 });

      const { rows } = await client.query(
        `INSERT INTO TBL_BALAN (objid, ownid, astid, amnts, dates)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (astid, dates) DO UPDATE SET amnts=EXCLUDED.amnts, ctime=NOW()
         RETURNING objid, ownid, astid, amnts::text AS amnts, dates, ctime`,
        [newId, user.id, body.astid, body.amnts, body.dates],
      );
      return rows[0];
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
