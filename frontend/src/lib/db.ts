import { Pool, PoolClient } from "pg";

// Vercel サーバーレス環境では関数インスタンスごとに接続を使い捨て
// Supabase の接続プーラー (port 6543) を使う場合は ?pgbouncer=true を付ける
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

export { pool };
export type { PoolClient };
