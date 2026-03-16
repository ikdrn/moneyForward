"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpgradeWall } from "@/components/upgrade-wall";

interface ActualRow { atype: string; amnts: string; }
interface TargetRow  { atype: string; trrat: string; }
interface PortfolioData { actual: ActualRow[]; targets: TargetRow[]; }

const ATYPE_LABEL: Record<string, string> = {
  bank: "銀行", fund: "投資信託", card: "クレジットカード", pens: "年金", poin: "ポイント",
};
const ATYPE_COLOR: Record<string, string> = {
  bank: "#2563EB", fund: "#7C3AED", card: "#64748B", pens: "#059669", poin: "#D97706",
};

export default function PortfolioPage() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});

  const { data, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/v1/reports/portfolio");
      if (res.status === 403) {
        const json = await res.json();
        if (json.upgrade) throw Object.assign(new Error("upgrade"), { upgrade: true });
      }
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const targets = Object.entries(draft).map(([atype, trrat]) => ({ atype, trrat }));
      const res = await fetch("/api/v1/reports/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targets),
      });
      if (!res.ok) throw new Error("保存失敗");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setEditMode(false);
    },
  });

  if (isLoading) return <div className="text-slate-400 text-sm py-12 text-center">読み込み中...</div>;
  if (error && (error as { upgrade?: boolean }).upgrade) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold text-slate-900">ポートフォリオ管理</h1>
        <UpgradeWall requiredPlan="advance" feature="ポートフォリオ管理・配当金追跡" />
      </div>
    );
  }

  const { actual = [], targets = [] } = data ?? {};
  const totalActual = actual.reduce((s, r) => s + Number(r.amnts), 0);
  const targetMap   = Object.fromEntries(targets.map((t) => [t.atype, Number(t.trrat)]));

  function startEdit() {
    setDraft({ ...targetMap });
    setEditMode(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">ポートフォリオ管理</h1>
        {!editMode && (
          <button onClick={startEdit} className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:text-indigo-700 transition-colors">
            目標を編集
          </button>
        )}
      </div>

      {/* 実際の配分 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">現在の資産配分</h2>
        <div className="flex h-4 rounded-full overflow-hidden mb-3">
          {actual.map((r) => {
            const pct = totalActual > 0 ? (Number(r.amnts) / totalActual) * 100 : 0;
            return (
              <div key={r.atype} style={{ width: `${pct}%`, backgroundColor: ATYPE_COLOR[r.atype] ?? "#94A3B8" }} />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actual.map((r) => {
            const pct  = totalActual > 0 ? (Number(r.amnts) / totalActual) * 100 : 0;
            const tgt  = targetMap[r.atype];
            const diff = tgt !== undefined ? pct - tgt : null;
            return (
              <div key={r.atype} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: ATYPE_COLOR[r.atype] ?? "#94A3B8" }} />
                <span className="text-xs text-slate-600">{ATYPE_LABEL[r.atype] ?? r.atype}</span>
                <span className="text-xs font-medium text-slate-900 ml-auto">{pct.toFixed(1)}%</span>
                {diff !== null && (
                  <span className={`text-xs ${diff > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 目標配分の編集 */}
      {editMode && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">目標配分を設定</h2>
          {actual.map((r) => (
            <div key={r.atype} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-24">{ATYPE_LABEL[r.atype] ?? r.atype}</span>
              <input
                type="number"
                min={0} max={100} step={1}
                value={draft[r.atype] ?? 0}
                onChange={(e) => setDraft((d) => ({ ...d, [r.atype]: Number(e.target.value) }))}
                className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {save.isPending ? "保存中..." : "保存"}
            </button>
            <button onClick={() => setEditMode(false)} className="px-4 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
