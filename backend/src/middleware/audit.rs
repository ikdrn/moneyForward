//! 監査ログ自動保存モジュール
//!
//! # 設計方針
//!
//! すべての TBL_TRANS / TBL_CATEG 操作は `with_audit` を通じて実行する。
//! `with_audit` は単一の PostgreSQL トランザクション内で
//!   1. `SET LOCAL ROLE <role>`
//!   2. `SET LOCAL app.current_user_id = '<uuid>'`
//!   3. 呼び出し元のクロージャ (ビジネスロジック)
//!   4. TBL_AUDIT への INSERT
//! を順番に実行し、すべて成功した場合のみ COMMIT する。
//! いずれかが失敗すれば ROLLBACK され、監査ログも残らない。

use std::future::Future;
use uuid::Uuid;
use sqlx::{PgPool, Postgres, Transaction};

use crate::error::{AppError, AppResult};

/// DB トランザクションを束ねる監査付き実行コンテキスト
///
/// # 使用例
/// ```rust
/// let trans = with_audit(
///     &pool,
///     AuditContext { owner_id, role: "app_user" },
///     AuditAction::create_trans(new_id),
///     |tx| Box::pin(async move {
///         sqlx::query!("INSERT INTO TBL_TRANS ...").execute(&mut **tx).await?;
///         Ok(new_id)
///     }),
/// ).await?;
/// ```
pub struct AuditContext<'a> {
    /// リクエストを行うユーザの UUID
    pub owner_id: Uuid,
    /// "app_user" | "app_admin"
    pub role: &'a str,
}

/// 監査ログ付きトランザクション実行
///
/// - `pool`    : コネクションプール
/// - `ctx`     : 認証済みユーザ情報
/// - `action`  : TBL_AUDIT.actio に書き込む文字列
/// - `op`      : トランザクション内で実行するビジネスロジック
pub async fn with_audit<F, Fut, T>(
    pool:   &PgPool,
    ctx:    AuditContext<'_>,
    action: String,
    op:     F,
) -> AppResult<T>
where
    F:   FnOnce(&mut Transaction<'_, Postgres>) -> Fut,
    Fut: Future<Output = AppResult<T>>,
{
    let mut tx = pool.begin().await?;

    // ── セッション変数の注入 ────────────────────────────────
    // SET LOCAL はトランザクションスコープのみ有効 → 接続プール汚染なし
    sqlx::query(&format!("SET LOCAL ROLE {}", ctx.role))
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e))?;

    sqlx::query("SELECT set_config('app.current_user_id', $1, true)")
        .bind(ctx.owner_id.to_string())
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::Database(e))?;

    // ── ビジネスロジック実行 ────────────────────────────────
    let result = op(&mut tx).await?;

    // ── 監査ログ INSERT ─────────────────────────────────────
    // ビジネスロジックと同一トランザクション内 → 原子性が保証される
    sqlx::query!(
        r#"
        INSERT INTO TBL_AUDIT (id___, ownid, actio, ctime)
        VALUES (gen_random_uuid(), $1, $2, NOW())
        "#,
        ctx.owner_id,
        action,
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::Database(e))?;

    tx.commit().await?;

    Ok(result)
}
