//! 自動同期バックグラウンドジョブ
//!
//! 設計:
//!   ┌─────────────────────────────────────────────────┐
//!   │ run_sync_loop()  — 30分ごとに起動                │
//!   │   └─ sync_pending_accounts()                    │
//!   │        └─ TBL_ACCTS で state='sync' を検索       │
//!   │             └─ sync_one_account() (per account) │
//!   │                  ├─ fetch_balance() (モック/本番)│
//!   │                  ├─ TBL_BALAN INSERT (残高記録)  │
//!   │                  ├─ TBL_ACCTS UPDATE (state/lsync)│
//!   │                  └─ TBL_SYNCL UPDATE (完了記録)  │
//!   └─────────────────────────────────────────────────┘
//!
//! Next.js 側から POST /api/v1/accounts/:id/sync を叩くと
//! TBL_ACCTS.state が 'sync' になるのを本ジョブが検知して処理する。

use std::time::Duration;
use sqlx::PgPool;
use tracing::{error, info};
use anyhow::Result;

use super::fetcher::{fetch_balance, FetchConfig};

/// 同期ループを起動する (main.rs から tokio::spawn で呼ぶ)
pub async fn run_sync_loop(pool: PgPool) {
    let mut interval = tokio::time::interval(Duration::from_secs(30 * 60));
    info!("自動同期ジョブ開始 (30分周期)");

    loop {
        interval.tick().await;
        if let Err(e) = sync_pending_accounts(&pool).await {
            error!("sync_pending_accounts error: {e}");
        }
    }
}

/// state = 'sync' の口座を全件処理する
async fn sync_pending_accounts(pool: &PgPool) -> Result<()> {
    let rows = sqlx::query!(
        r#"
        SELECT ac.objid, ac.ownid, ac.astid, ac.iname, ac.itype,
               sl.objid AS log_id
        FROM   TBL_ACCTS ac
        JOIN   TBL_SYNCL sl ON sl.accid = ac.objid AND sl.state = 'runn'
        WHERE  ac.state = 'sync'
        "#
    )
    .fetch_all(pool)
    .await?;

    info!("同期対象: {} 件", rows.len());

    for row in rows {
        let pool_clone = pool.clone();
        let account_id   = row.objid;
        let owner_id     = row.ownid;
        let asset_id     = row.astid;
        let inst_name    = row.iname;
        let inst_type    = row.itype;
        let log_id       = row.log_id;

        tokio::spawn(async move {
            if let Err(e) = sync_one_account(
                &pool_clone,
                account_id,
                owner_id,
                asset_id,
                &inst_name,
                &inst_type,
                log_id,
            ).await {
                error!("sync_one_account error [{account_id}]: {e}");
            }
        });
    }

    Ok(())
}

/// 1口座の同期処理
async fn sync_one_account(
    pool:       &PgPool,
    account_id: uuid::Uuid,
    owner_id:   uuid::Uuid,
    asset_id:   uuid::Uuid,
    inst_name:  &str,
    inst_type:  &str,
    log_id:     uuid::Uuid,
) -> Result<()> {
    info!("同期開始: {inst_name} ({inst_type})");

    let config = FetchConfig {
        account_id: account_id.to_string(),
        inst_type:  inst_type.to_string(),
        inst_name:  inst_name.to_string(),
    };

    match fetch_balance(&config).await {
        Ok(result) => {
            let today = chrono::Utc::now().date_naive();

            // TBL_BALAN に残高を記録 (UPSERT)
            sqlx::query!(
                r#"
                INSERT INTO TBL_BALAN (objid, ownid, astid, amnts, dates)
                VALUES (gen_random_uuid(), $1, $2, $3, $4)
                ON CONFLICT (astid, dates) DO UPDATE
                  SET amnts = EXCLUDED.amnts, ctime = NOW()
                "#,
                owner_id,
                asset_id,
                result.balance,
                today,
            )
            .execute(pool)
            .await?;

            // TBL_ACCTS: 同期完了
            sqlx::query!(
                "UPDATE TBL_ACCTS SET state = 'done', lsync = NOW() WHERE objid = $1",
                account_id,
            )
            .execute(pool)
            .await?;

            // TBL_SYNCL: 完了記録
            sqlx::query!(
                "UPDATE TBL_SYNCL SET state = 'done', etime = NOW() WHERE objid = $1",
                log_id,
            )
            .execute(pool)
            .await?;

            info!("同期完了: {inst_name} — ¥{}", result.balance);
        }
        Err(e) => {
            // TBL_ACCTS: エラー状態に戻す
            sqlx::query!(
                "UPDATE TBL_ACCTS SET state = 'erro' WHERE objid = $1",
                account_id,
            )
            .execute(pool)
            .await?;

            // TBL_SYNCL: エラー記録
            sqlx::query!(
                "UPDATE TBL_SYNCL SET state = 'erro', etime = NOW(), errmg = $1 WHERE objid = $2",
                e.to_string(),
                log_id,
            )
            .execute(pool)
            .await?;

            error!("同期失敗: {inst_name} — {e}");
        }
    }

    Ok(())
}
