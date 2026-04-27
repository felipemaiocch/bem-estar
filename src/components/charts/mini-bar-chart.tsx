"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MiniBarChart({
  data,
}: {
  data: Array<{ day: string; score: number }>;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-52 w-full rounded-[24px] bg-slate-50" />;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={8}>
          <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.06)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 16px 40px -24px rgba(15,23,42,0.35)",
            }}
          />
          <Bar
            dataKey="score"
            fill="url(#progressGradient)"
            radius={[12, 12, 4, 4]}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
