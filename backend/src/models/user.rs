use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

/// DB ロール (TBL_USERS.roles と一致)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
#[ts(export)]
pub enum UserRole {
    #[serde(rename = "app_user")]
    AppUser,
    #[serde(rename = "app_admin")]
    AppAdmin,
}

impl UserRole {
    /// DB の SET ROLE に渡す文字列
    pub fn as_db_role(&self) -> &'static str {
        match self {
            UserRole::AppUser  => "app_user",
            UserRole::AppAdmin => "app_admin",
        }
    }
}

/// TBL_USERS の行表現
#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[ts(export)]
pub struct User {
    pub objid: Uuid,
    pub email: String,
    pub roles: String,
    pub ctime: DateTime<Utc>,
}
