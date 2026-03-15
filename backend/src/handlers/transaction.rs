//! TBL_TRANS CRUD ハンドラ
//!
//! すべての操作は `with_audit` を通じて実行される。
//! 認証ユーザは `AuthUser` Extension から取得する。

use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use validator::Validate;
use uuid::Uuid;

use crate::{
    db::DbPool,
    error::{AppError, AppResult},
    middleware::{
        audit::{with_audit, AuditContext},
        auth::AuthUser,
    },
    models::{
        audit::AuditAction,
        transaction::{CreateTransactionRequest, Transaction, UpdateTransactionRequest},
    },
};

// ────────────────────────────────────────────────────────────
// GET /transactions  ·  一覧取得
// ────────────────────────────────────────────────────────────
pub async fn list_transactions(
    State(pool): State<DbPool>,
    Extension(user): Extension<AuthUser>,
) -> AppResult<impl IntoResponse> {
    let rows = with_audit(
        &pool,
        AuditContext { owner_id: user.id, role: &user.role },
        AuditAction::list_trans(),
        |tx| Box::pin(async move {
            let rows = sqlx::query_as!(
                Transaction,
                r#"
                SELECT objid, ownid, catid, amnts, dates, ctime
                FROM   TBL_TRANS
                WHERE  ownid = $1
                ORDER  BY dates DESC, ctime DESC
                "#,
                user.id,
            )
            .fetch_all(&mut **tx)
            .await?;
            Ok(rows)
        }),
    )
    .await?;

    Ok(Json(rows))
}

// ────────────────────────────────────────────────────────────
// POST /transactions  ·  作成
// ────────────────────────────────────────────────────────────
pub async fn create_transaction(
    State(pool): State<DbPool>,
    Extension(user): Extension<AuthUser>,
    Json(body): Json<CreateTransactionRequest>,
) -> AppResult<impl IntoResponse> {
    body.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let new_id = Uuid::new_v4();

    let trans = with_audit(
        &pool,
        AuditContext { owner_id: user.id, role: &user.role },
        AuditAction::create_trans(new_id),
        |tx| Box::pin(async move {
            let row = sqlx::query_as!(
                Transaction,
                r#"
                INSERT INTO TBL_TRANS (objid, ownid, catid, amnts, dates)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING objid, ownid, catid, amnts, dates, ctime
                "#,
                new_id,
                user.id,
                body.catid,
                body.amnts,
                body.dates,
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(row)
        }),
    )
    .await?;

    Ok((StatusCode::CREATED, Json(trans)))
}

// ────────────────────────────────────────────────────────────
// GET /transactions/:id  ·  単件取得
// ────────────────────────────────────────────────────────────
pub async fn get_transaction(
    State(pool): State<DbPool>,
    Extension(user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let trans = with_audit(
        &pool,
        AuditContext { owner_id: user.id, role: &user.role },
        format!("GET_TRANS:{id}"),
        |tx| Box::pin(async move {
            let row = sqlx::query_as!(
                Transaction,
                r#"
                SELECT objid, ownid, catid, amnts, dates, ctime
                FROM   TBL_TRANS
                WHERE  objid = $1
                  AND  ownid = $2
                "#,
                id,
                user.id,
            )
            .fetch_optional(&mut **tx)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("transaction {id} not found")))?;
            Ok(row)
        }),
    )
    .await?;

    Ok(Json(trans))
}

// ────────────────────────────────────────────────────────────
// PATCH /transactions/:id  ·  更新
// ────────────────────────────────────────────────────────────
pub async fn update_transaction(
    State(pool): State<DbPool>,
    Extension(user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateTransactionRequest>,
) -> AppResult<impl IntoResponse> {
    body.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let trans = with_audit(
        &pool,
        AuditContext { owner_id: user.id, role: &user.role },
        AuditAction::update_trans(id),
        |tx| Box::pin(async move {
            let existing = sqlx::query_as!(
                Transaction,
                "SELECT objid, ownid, catid, amnts, dates, ctime FROM TBL_TRANS WHERE objid = $1 AND ownid = $2",
                id, user.id,
            )
            .fetch_optional(&mut **tx)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("transaction {id} not found")))?;

            let new_catid = body.catid.unwrap_or(existing.catid);
            let new_amnts = body.amnts.unwrap_or(existing.amnts);
            let new_dates = body.dates.unwrap_or(existing.dates);

            let row = sqlx::query_as!(
                Transaction,
                r#"
                UPDATE TBL_TRANS
                SET    catid = $1, amnts = $2, dates = $3
                WHERE  objid = $4
                  AND  ownid = $5
                RETURNING objid, ownid, catid, amnts, dates, ctime
                "#,
                new_catid,
                new_amnts,
                new_dates,
                id,
                user.id,
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(row)
        }),
    )
    .await?;

    Ok(Json(trans))
}

// ────────────────────────────────────────────────────────────
// DELETE /transactions/:id  ·  削除
// ────────────────────────────────────────────────────────────
pub async fn delete_transaction(
    State(pool): State<DbPool>,
    Extension(user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    with_audit(
        &pool,
        AuditContext { owner_id: user.id, role: &user.role },
        AuditAction::delete_trans(id),
        |tx| Box::pin(async move {
            let result = sqlx::query!(
                "DELETE FROM TBL_TRANS WHERE objid = $1 AND ownid = $2",
                id,
                user.id,
            )
            .execute(&mut **tx)
            .await?;

            if result.rows_affected() == 0 {
                return Err(AppError::NotFound(format!("transaction {id} not found")));
            }
            Ok(())
        }),
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}
