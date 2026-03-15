//! 監査ログ自動保存モジュール (TypeScript 版)
//!
//! Rust の with_audit() と同じ設計:
//!   単一トランザクション内で
//!     1. SET LOCAL ROLE <role>
//!     2. set_config('app.current_user_id', ...)
//!     3. ビジネスロジック (operation)
//!     4. TBL_AUDIT INSERT
//!   をすべて実行し、いずれか失敗時は ROLLBACK する。

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

    // ── RBAC: ロール切り替え ─────────────────────────────
    await client.query(`SET LOCAL ROLE ${role}`);

    // ── RLS: ユーザ ID 注入 ──────────────────────────────
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true)`,
      [ownerId],
    );

    // ── ビジネスロジック ─────────────────────────────────
    const result = await operation(client);

    // ── 監査ログ (同一トランザクション = 原子性保証) ─────
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
  listTrans:   ()           => "LIST_TRANS:all",
  getTrans:    (id: string) => `GET_TRANS:${id}`,
  createTrans: (id: string) => `CREATE_TRANS:${id}`,
  updateTrans: (id: string) => `UPDATE_TRANS:${id}`,
  deleteTrans: (id: string) => `DELETE_TRANS:${id}`,
} as const;
