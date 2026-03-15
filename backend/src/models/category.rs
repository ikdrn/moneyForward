use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;
use validator::Validate;

/// TBL_CATEG の行表現
#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[ts(export)]
pub struct Category {
    pub objid: Uuid,
    pub ownid: Uuid,
    pub cname: String,
    pub ctype: String,
    pub ctime: DateTime<Utc>,
}

/// 科目作成リクエスト
#[derive(Debug, Deserialize, Validate, TS)]
#[ts(export)]
pub struct CreateCategoryRequest {
    #[validate(length(min = 1, max = 100))]
    pub cname: String,

    #[validate(custom(function = "validate_ctype"))]
    pub ctype: String,
}

fn validate_ctype(ctype: &str) -> Result<(), validator::ValidationError> {
    if ctype == "income" || ctype == "expense" {
        Ok(())
    } else {
        Err(validator::ValidationError::new("ctype must be 'income' or 'expense'"))
    }
}
