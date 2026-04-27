"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function GoalAreaChart({
  data,
}: {
  data: Array<{ week: string; target: number; actual: number }>;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-64 w-full rounded-[24px] bg-slate-50" />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="target" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={12} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 16px 40px -24px rgba(15,23,42,0.35)",
            }}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#target)"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#2563EB"
            strokeWidth={3}
            fill="url(#actual)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
