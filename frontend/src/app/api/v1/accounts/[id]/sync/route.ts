// POST /api/v1/accounts/:id/sync — 手動同期トリガー
// DB の state を 'sync' にセット → Rust ジョブが検知して処理する
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withAudit, AuditAction } from "@/lib/audit";
import { errorResponse } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user   = await verifyAuth();

    const result = await withAudit(user.id, user.role, AuditAction.syncAccts(id), async (client) => {
      // 所有確認
      const { rows } = await client.query(
        `SELECT objid, state FROM TBL_ACCTS WHERE objid = $1 AND ownid = $2`,
        [id, user.id],
      );
      if (!rows[0]) throw Object.assign(new Error("account not found"), { status: 404 });
      if (rows[0].state === "sync") {
        throw Object.assign(new Error("すでに同期中です"), { status: 409 });
      }

      // state を sync にセット (Rust ジョブが検知)
      await client.query(
        `UPDATE TBL_ACCTS SET state = 'sync' WHERE objid = $1`,
        [id],
      );

      // 同期ログ開始レコード
      const logId = crypto.randomUUID();
      await client.query(
        `INSERT INTO TBL_SYNCL (objid, ownid, accid, state, ctime)
         VALUES ($1, $2, $3, 'runn', NOW())`,
        [logId, user.id, id],
      );

      return { queued: true, logId };
    });

    return NextResponse.json(result, { status: 202 });
  } catch (e) {
    return errorResponse(e);
  }
}
