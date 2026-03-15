//! 金融機関データ取得モジュール
//!
//! 本番では以下の方式を選択する:
//!   (a) Open Banking API (銀行が提供する公式 API)
//!   (b) 口座集計サービス API (Moneytree, Plaid JP 等)
//!   (c) スクレイピング (各金融機関の Web サイト)
//!
//! 現在の実装: 開発・デモ用のモック。
//!   実運用に切り替える場合は `fetch_balance()` 内を置き換える。

use anyhow::Result;
use rust_decimal::Decimal;
use std::str::FromStr;

/// 口座種別ごとの取得設定 (将来的に認証情報を保持する)
pub struct FetchConfig {
    pub account_id:   String,
    pub inst_type:    String,   // "bank" | "brok" | "card"
    pub inst_name:    String,
}

/// 残高取得結果
pub struct FetchResult {
    pub balance:  Decimal,
    pub currency: String,   // "JPY"
    pub fetched_at: chrono::DateTime<chrono::Utc>,
}

/// 残高を取得する
///
/// 本番への移行手順:
///   1. `FetchConfig` に認証情報 (API key, OAuth token 等) を追加
///   2. 金融機関 API クライアントを実装 (reqwest を推奨)
///   3. この関数内でリクエストを送信し、レスポンスをパース
///   4. 必要なら暗号化された認証情報を DB から復元
pub async fn fetch_balance(config: &FetchConfig) -> Result<FetchResult> {
    // ── モック実装 ─────────────────────────────────────────
    // 口座種別に応じたベース残高 + 小さなランダム変動 (±1%)
    let base: f64 = match config.inst_type.as_str() {
        "bank" => 3_000_000.0,
        "brok" => 5_500_000.0,
        "card" => 50_000.0,    // クレカは負債として扱う
        _      => 1_000_000.0,
    };

    // 擬似的なランダム変動 (実装簡略化のため固定シード)
    // 実装では rand::random() を使う
    let variation = base * 0.005; // ±0.5%
    let mock_balance = base + variation;

    Ok(FetchResult {
        balance:    Decimal::from_str(&format!("{:.2}", mock_balance))
                        .unwrap_or(Decimal::ZERO),
        currency:   "JPY".to_string(),
        fetched_at: chrono::Utc::now(),
    })
}
