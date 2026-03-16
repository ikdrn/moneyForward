// プランの制限値を DB から取得するヘルパー
// pool を直接使用 (RLS バイパス不要 — SELECT のみ)
import { pool } from "@/lib/db";

export interface PlanLimits {
  pname: string;
  acclm: number;  // 口座上限 (-1=無制限)
  hislm: number;  // 履歴保存月数 (-1=無制限)
}

export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const { rows } = await pool.query(
    `SELECT p.pname, p.acclm, p.hislm
     FROM TBL_SUBSC s
     JOIN TBL_PLANS p ON p.objid = s.plnid
     WHERE s.ownid = $1 AND s.state = 'activ'
     LIMIT 1`,
    [userId],
  );

  // サブスクなし or 無効 → free 扱い
  if (rows.length === 0) return { pname: "free", acclm: 4, hislm: 12 };
  return { pname: rows[0].pname, acclm: rows[0].acclm, hislm: rows[0].hislm };
}

// プラン階層チェック
export function isPremium(pname: string) { return pname !== "free"; }
export function isAdvance(pname: string) { return pname === "advance"; }

// 履歴制限の日付カットオフを返す (無制限なら null)
export function historyFrom(hislm: number): string | null {
  if (hislm === -1) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - hislm);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
