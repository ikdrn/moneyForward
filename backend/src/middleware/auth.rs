use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::Config, error::AppError};

/// JWT クレーム
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub:  String,       // ユーザ UUID
    pub role: String,       // "app_user" | "app_admin"
    pub exp:  usize,
}

/// Axum Extension として注入される認証済みユーザ情報
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id:   Uuid,
    pub role: String,
}

/// JWT 検証ミドルウェア
/// Authorization: Bearer <token> ヘッダを検証し、AuthUser を Extension に追加する
pub async fn jwt_auth(
    State(config): State<Config>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Authorization ヘッダがありません".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Bearer トークンではありません".into()))?;

    let key = DecodingKey::from_secret(config.jwt_secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;

    let claims = decode::<Claims>(token, &key, &validation)
        .map_err(AppError::Jwt)?
        .claims;

    let user_id = claims
        .sub
        .parse::<Uuid>()
        .map_err(|_| AppError::Unauthorized("sub が有効な UUID ではありません".into()))?;

    req.extensions_mut().insert(AuthUser {
        id:   user_id,
        role: claims.role,
    });

    Ok(next.run(req).await)
}
