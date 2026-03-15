"use client";

import { useSyncAccount, useDeleteAccount } from "@/hooks/use-accounts";
import type { Account } from "@/types/bindings";

// ── 状態バッジ ───────────────────────────────────────────────
function SyncBadge({ state }: { state: Account["state"] }) {
  const cfg = {
    idle: { dot: "bg-slate-300",           label: "未同期",   text: "text-slate-500" },
    sync: { dot: "bg-amber-400 animate-pulse", label: "同期中", text: "text-amber-600" },
    done: { dot: "bg-emerald-500",          label: "同期済み", text: "text-emerald-700" },
    erro: { dot: "bg-red-500",              label: "エラー",   text: "text-red-600"  },
  }[state];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── 口座種別ラベル ───────────────────────────────────────────
const TYPE_LABEL: Record<Account["itype"], { label: string; cls: string }> = {
  bank: { label: "銀行",   cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  brok: { label: "証券",   cls: "bg-violet-50 text-violet-700 border border-violet-200" },
  card: { label: "クレカ", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
};

interface Props {
  account: Account;
}

export function AccountCard({ account }: Props) {
  const { mutate: sync, isPending: syncing }   = useSyncAccount();
  const { mutate: remove, isPending: removing } = useDeleteAccount();

  const type  = TYPE_LABEL[account.itype];
  const bal   = account.amnts != null ? Number(account.amnts) : null;
  const lsync = account.lsync ? new Date(account.lsync).toLocaleString("ja-JP", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3">
      {/* ヘッダ行 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${type.cls}`}>
              {type.label}
            </span>
            <SyncBadge state={account.state} />
          </div>
          <p className="font-medium text-slate-900 truncate">{account.iname}</p>
          <p className="text-xs text-slate-400 truncate">{account.aname}</p>
        </div>
      </div>

      {/* 残高 (主役) */}
      <div>
        {bal !== null ? (
          <p className="text-2xl font-bold font-mono text-slate-900">
            ¥{bal.toLocaleString("ja-JP")}
          </p>
        ) : (
          <p className="text-slate-400 text-sm">残高未取得</p>
        )}
        {account.dates && (
          <p className="text-xs text-slate-400 mt-0.5">{account.dates} 時点</p>
        )}
      </div>

      {/* フッタ: アクションと最終同期 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {lsync ? `最終同期: ${lsync}` : "未同期"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => sync(account.objid)}
            disabled={syncing || account.state === "sync"}
            className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {syncing || account.state === "sync" ? "同期中..." : "同期"}
          </button>
          <button
            onClick={() => {
              if (confirm(`「${account.iname}」を削除しますか？残高履歴もすべて削除されます。`)) {
                remove(account.objid);
              }
            }}
            disabled={removing}
            className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-40"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
