"use client";

import { useNetWorth } from "@/hooks/use-networth";

// ── フォーマットヘルパー ─────────────────────────────────────
function yen(v: string | null | undefined) {
  if (v == null) return "—";
  const n = Number(v);
  return n.toLocaleString("ja-JP");
}

function changeRate(current: string, prev: string) {
  const c = Number(current);
  const p = Number(prev);
  if (p === 0 || c === 0) return null;
  return ((c - p) / p) * 100;
}

export function NetWorthHero() {
  const { data, isLoading, isError } = useNetWorth();

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 animate-pulse">
        <div className="h-4 w-24 bg-slate-700 rounded mb-3" />
        <div className="h-12 w-64 bg-slate-700 rounded mb-6" />
        <div className="flex gap-6">
          <div className="h-4 w-32 bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-slate-900 rounded-xl p-8">
        <p className="text-slate-400 text-sm">データ取得エラー</p>
      </div>
    );
  }

  const rate  = changeRate(data.total, data.prevt);
  const delta = Number(data.total) - Number(data.prevt);
  const up    = delta >= 0;

  return (
    <div className="bg-slate-900 rounded-xl p-8 text-white">
      {/* ラベル */}
      <p className="text-slate-400 text-sm tracking-wide mb-2">純資産</p>

      {/* 主役: 純資産額 */}
      <div className="flex items-baseline gap-4 mb-1">
        <span className="text-5xl font-bold tracking-tight font-mono">
          ¥{yen(data.total)}
        </span>
        {rate !== null && (
          <span className={`text-base font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? "▲" : "▼"} {Math.abs(rate).toFixed(1)}%
          </span>
        )}
      </div>

      {/* 前月比 */}
      {delta !== 0 && (
        <p className="text-slate-400 text-sm mb-6">
          先月比 {up ? "+" : ""}{yen(String(delta))} 円
        </p>
      )}
      {delta === 0 && <div className="mb-6" />}

      {/* 内訳 */}
      <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-700">
        <Breakdown label="銀行口座" value={data.bkttl} color="text-blue-400" />
        <Breakdown label="投資・証券" value={data.fdttl} color="text-violet-400" />
        {data.lasdt && (
          <span className="ml-auto text-slate-500 text-xs self-end">
            {data.lasdt} 時点
          </span>
        )}
      </div>
    </div>
  );
}

function Breakdown({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className={`font-mono font-medium ${color}`}>¥{yen(value)}</p>
    </div>
  );
}
