mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod sync;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, patch, post},
    Router,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use config::Config;
use db::create_pool;
use handlers::transaction::{
    create_transaction, delete_transaction, get_transaction,
    list_transactions, update_transaction,
};
use middleware::auth::jwt_auth;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── ロギング初期化 ──────────────────────────────────────
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // ── 設定読み込み ────────────────────────────────────────
    let config = Config::from_env();
    let pool   = create_pool(&config.database_url).await?;

    tracing::info!("DB pool created");

    // ── ルーター組み立て ────────────────────────────────────
    let api_routes = Router::new()
        .route("/transactions",     get(list_transactions).post(create_transaction))
        .route("/transactions/:id", get(get_transaction)
                                    .patch(update_transaction)
                                    .delete(delete_transaction))
        // JWT 認証ミドルウェアを API ルート全体に適用
        .layer(axum_middleware::from_fn_with_state(config.clone(), jwt_auth));

    let app = Router::new()
        .nest("/api/v1", api_routes)
        .with_state(pool)
        .layer(CorsLayer::permissive())   // 本番では origin を限定すること
        .layer(TraceLayer::new_for_http());

    // ── 自動同期ジョブ起動 (バックグラウンド) ───────────────
    let sync_pool = pool.clone();
    tokio::spawn(async move {
        sync::job::run_sync_loop(sync_pool).await;
    });

    // ── サーバ起動 ──────────────────────────────────────────
    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("listening on {addr}");

    axum::serve(listener, app).await?;
    Ok(())
}
