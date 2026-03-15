"use client";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/types/bindings";

interface Props {
  data: TrendPoint[];
}

// 万円単位フォーマット
const fmtY = (v: number) =>
  v >= 10_000_000
    ? `${(v / 1_000_000).toFixed(0)}M`
    : v >= 10_000
    ? `${(v / 10_000).toFixed(0)}万`
    : String(v);

const fmtTip = (v: number) => `¥${v.toLocaleString("ja-JP")} 円`;

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-56 text-slate-400 text-sm gap-2">
        <span className="text-3xl">📊</span>
        <p>残高を記録するとグラフが表示されます</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    dates:   d.dates,
    銀行口座: Number(d.bktot),
    投資証券: Number(d.fdtot),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="dates"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={{ stroke: "#E2E8F0" }}
        />
        <YAxis
          tickFormatter={fmtY}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value: number, name: string) => [fmtTip(value), name]}
          contentStyle={{
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
        />

        <Area
          type="monotone" dataKey="銀行口座"
          stackId="1" stroke="#2563EB" fill="url(#gb)" strokeWidth={1.5}
        />
        <Area
          type="monotone" dataKey="投資証券"
          stackId="1" stroke="#7C3AED" fill="url(#gf)" strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
