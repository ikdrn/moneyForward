//! 監査ログ自動保存モジュール
//! withAudit() が単一 PostgreSQL トランザクション内で:
//!   1. SET LOCAL ROLE <role>
//!   2. set_config('app.current_user_id', ...)  ← RLS に注入
//!   3. ビジネスロジック実行
//!   4. TBL_AUDIT INSERT (同一 TX = 原子性保証)
//! をすべて実行する。いずれか失敗時は ROLLBACK。

import { pool, PoolClient } from "./db";

export async function withAudit<T>(
  ownerId:   string,
  role:      string,
  action:    string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [ownerId]);

    const result = await operation(client);

    await client.query(
      `INSERT INTO TBL_AUDIT (objid, ownid, actio, ctime)
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [ownerId, action],
    );

    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export const AuditAction = {
  // TBL_TRANS
  listTrans:   ()           => "LIST_TRANS:all",
  getTrans:    (id: string) => `GET_TRANS:${id}`,
  createTrans: (id: string) => `CREATE_TRANS:${id}`,
  updateTrans: (id: string) => `UPDATE_TRANS:${id}`,
  deleteTrans: (id: string) => `DELETE_TRANS:${id}`,
  // TBL_ASSET
  listAsset:   ()           => "LIST_ASSET:all",
  getAsset:    (id: string) => `GET_ASSET:${id}`,
  createAsset: (id: string) => `CREATE_ASSET:${id}`,
  updateAsset: (id: string) => `UPDATE_ASSET:${id}`,
  deleteAsset: (id: string) => `DELETE_ASSET:${id}`,
  // TBL_BALAN
  listBalan:   (astid: string | null) => `LIST_BALAN:${astid ?? "all"}`,
  getBalan:    (id: string)           => `GET_BALAN:${id}`,
  createBalan: (id: string)           => `CREATE_BALAN:${id}`,
  updateBalan: (id: string)           => `UPDATE_BALAN:${id}`,
  deleteBalan: (id: string)           => `DELETE_BALAN:${id}`,
  // TBL_ACCTS
  listAccts:   ()           => "LIST_ACCTS:all",
  getAccts:    (id: string) => `GET_ACCTS:${id}`,
  createAccts: (id: string) => `CREATE_ACCTS:${id}`,
  deleteAccts: (id: string) => `DELETE_ACCTS:${id}`,
  syncAccts:   (id: string) => `SYNC_ACCTS:${id}`,
  // 集計
  getTrend:    ()           => "GET_TREND:all",
} as const;
