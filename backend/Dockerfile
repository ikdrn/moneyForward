# =============================================================
# Dockerfile  ·  Rust (Axum) バックエンド
# マルチステージビルドで最小イメージを生成
# Railway / Fly.io / Cloud Run にそのままデプロイ可能
# =============================================================

# ── ステージ 1: ビルド ───────────────────────────────────────
FROM rust:1.79-slim AS builder

# 依存解決を先にキャッシュ (ソース変更時の再ビルドを高速化)
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml ./
# ダミー main.rs でキャッシュレイヤ生成
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build --release --bin server
RUN rm src/main.rs

# 実際のソースをコピーしてビルド
COPY src ./src
# ビルドキャッシュを正しく更新するためにタイムスタンプを更新
RUN touch src/main.rs
RUN cargo build --release --bin server

# ── ステージ 2: 実行イメージ ─────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/server ./server

# ポートは環境変数で上書き可能 (デフォルト 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["./server"]
