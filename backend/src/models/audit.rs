use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

/// TBL_AUDIT の行表現
#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[ts(export)]
pub struct AuditLog {
    pub id___: Uuid,
    pub ownid: Option<Uuid>,
    pub actio: String,
    pub ctime: DateTime<Utc>,
}

/// 監査ログの操作種別プレフィックス
/// 形式: `{ACTION}:{target_uuid}` or `{ACTION}:{detail}`
pub struct AuditAction;

impl AuditAction {
    pub fn create_trans(id: Uuid) -> String { format!("CREATE_TRANS:{id}") }
    pub fn update_trans(id: Uuid) -> String { format!("UPDATE_TRANS:{id}") }
    pub fn delete_trans(id: Uuid) -> String { format!("DELETE_TRANS:{id}") }
    pub fn list_trans()           -> String { "LIST_TRANS:all".into() }

    pub fn create_categ(id: Uuid) -> String { format!("CREATE_CATEG:{id}") }
    pub fn update_categ(id: Uuid) -> String { format!("UPDATE_CATEG:{id}") }
    pub fn delete_categ(id: Uuid) -> String { format!("DELETE_CATEG:{id}") }
}
