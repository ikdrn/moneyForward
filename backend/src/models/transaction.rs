use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;
use validator::Validate;

/// TBL_TRANS の行表現 (ts-rs で TypeScript 型を自動生成)
#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[ts(export)]
pub struct Transaction {
    pub id___: Uuid,
    pub ownid: Uuid,
    pub catid: Uuid,
    #[ts(type = "string")]
    pub amnts: Decimal,
    pub dates: NaiveDate,
    pub ctime: DateTime<Utc>,
}

/// 明細作成リクエスト
#[derive(Debug, Deserialize, Validate, TS)]
#[ts(export)]
pub struct CreateTransactionRequest {
    pub catid: Uuid,

    /// 金額 (正=収入, 負=支出, 0 は禁止)
    #[validate(custom(function = "validate_amount"))]
    #[ts(type = "string")]
    pub amnts: Decimal,

    pub dates: NaiveDate,
}

/// 明細更新リクエスト (部分更新)
#[derive(Debug, Deserialize, Validate, TS)]
#[ts(export)]
pub struct UpdateTransactionRequest {
    pub catid: Option<Uuid>,

    #[validate(custom(function = "validate_amount_opt"))]
    #[ts(type = "string | undefined")]
    pub amnts: Option<Decimal>,

    pub dates: Option<NaiveDate>,
}

fn validate_amount(amount: &Decimal) -> Result<(), validator::ValidationError> {
    if amount.is_zero() {
        return Err(validator::ValidationError::new("amount must not be zero"));
    }
    Ok(())
}

fn validate_amount_opt(amount: &Option<Decimal>) -> Result<(), validator::ValidationError> {
    if let Some(a) = amount {
        return validate_amount(a);
    }
    Ok(())
}
