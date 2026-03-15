use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

/// アプリケーション全体のエラー型
/// すべての ? 演算子はこの型に収束させる
#[derive(Debug, Error)]
pub enum AppError {
    #[error("認証エラー: {0}")]
    Unauthorized(String),

    #[error("権限エラー: {0}")]
    Forbidden(String),

    #[error("リソースが見つかりません: {0}")]
    NotFound(String),

    #[error("バリデーションエラー: {0}")]
    Validation(String),

    #[error("データベースエラー: {0}")]
    Database(#[from] sqlx::Error),

    #[error("JWTエラー: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("内部サーバーエラー: {0}")]
    Internal(String),
}

/// HTTP レスポンス用エラーボディ
#[derive(Serialize)]
struct ErrorBody {
    error:   &'static str,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::Unauthorized(m) => (StatusCode::UNAUTHORIZED,        "UNAUTHORIZED",   m.clone()),
            AppError::Forbidden(m)    => (StatusCode::FORBIDDEN,           "FORBIDDEN",      m.clone()),
            AppError::NotFound(m)     => (StatusCode::NOT_FOUND,           "NOT_FOUND",      m.clone()),
            AppError::Validation(m)   => (StatusCode::UNPROCESSABLE_ENTITY,"VALIDATION_ERR", m.clone()),
            AppError::Database(e)     => {
                tracing::error!("DB error: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "DB_ERROR", "データベースエラーが発生しました".into())
            }
            AppError::Jwt(e)          => {
                tracing::warn!("JWT error: {e}");
                (StatusCode::UNAUTHORIZED, "INVALID_TOKEN", "トークンが無効です".into())
            }
            AppError::Internal(m)     => {
                tracing::error!("Internal error: {m}");
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", m.clone())
            }
        };

        (status, Json(ErrorBody { error: code, message })).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
