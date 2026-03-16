// セルフホスト用: 全機能を無制限で開放
export interface PlanLimits {
  pname: string;
  acclm: number;
  hislm: number;
}

export async function getPlanLimits(_userId: string): Promise<PlanLimits> {
  return { pname: "advance", acclm: -1, hislm: -1 };
}

export function isPremium(_pname: string) { return true; }
export function isAdvance(_pname: string) { return true; }

export function historyFrom(_hislm: number): null { return null; }
