"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/types/bindings";

interface Props {
  data: TrendPoint[];
}

// 万円単位に変換して表示
const fmt = (v: number) => `${(v / 10_000).toLocaleString("ja-JP", { maximumFractionDigits: 0 })}万`;

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        残高データがありません。資産を登録して残高を記録してください。
      </div>
    );
  }

  // recharts 用にデータ変換 (string → number)
  const chartData = data.map((d) => ({
    dates: d.dates,
    銀行口座: Number(d.bktot),
    投資信託: Number(d.fdtot),
    総資産:   Number(d.total),
  }));

  return (
    <div className="w-full">
      {/* 最新残高サマリ */}
      <LatestSummary latest={data[data.length - 1]} />

      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBank" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradFund" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="dates" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={70} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString("ja-JP")} 円`,
              name,
            ]}
          />
          <Legend />

          {/* 銀行口座 (下層) */}
          <Area
            type="monotone"
            dataKey="銀行口座"
            stackId="1"
            stroke="#3B82F6"
            fill="url(#gradBank)"
            strokeWidth={2}
          />
          {/* 投資信託 (上層) */}
          <Area
            type="monotone"
            dataKey="投資信託"
            stackId="1"
            stroke="#10B981"
            fill="url(#gradFund)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 最新残高サマリカード ──────────────────────────────────────
function LatestSummary({ latest }: { latest: TrendPoint }) {
  const total = Number(latest.total);
  const bank  = Number(latest.bktot);
  const fund  = Number(latest.fdtot);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <SummaryCard label="総資産"    value={total} color="text-gray-900" />
      <SummaryCard label="銀行口座"  value={bank}  color="text-blue-600" />
      <SummaryCard label="投資信託"  value={fund}  color="text-green-600" />
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${color}`}>
        {value.toLocaleString("ja-JP")} 円
      </p>
    </div>
  );
}
