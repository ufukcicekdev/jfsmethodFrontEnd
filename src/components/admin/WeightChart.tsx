"use client";

import type { WeightStats } from "@/lib/api";

interface WeightChartProps {
  stats: WeightStats;
}

export function WeightChart({ stats }: WeightChartProps) {
  const history = stats.history;
  if (history.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Grafik için en az 2 kilo kaydı gerekir.
      </p>
    );
  }

  const weights = history.map((entry) => entry.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const width = 640;
  const height = 220;
  const padding = 24;

  const points = history.map((entry, index) => {
    const x =
      padding +
      (index / (history.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((entry.weight - min) / range) * (height - padding * 2);
    return { x, y, ...entry };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[320px]"
        role="img"
        aria-label="Kilo değişim grafiği"
      >
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - padding * 2);
          const value = (max - ratio * range).toFixed(1);
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeDasharray="4 4"
              />
              <text
                x={4}
                y={y + 4}
                className="fill-slate-400 text-[10px]"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path
          d={`${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#weightGradient)"
        />
        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <circle
            key={point.recorded_at}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {new Date(history[0].recorded_at).toLocaleDateString("tr-TR")}
        </span>
        <span>
          {new Date(history[history.length - 1].recorded_at).toLocaleDateString(
            "tr-TR"
          )}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  positiveIsGood = true,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  positiveIsGood?: boolean;
}) {
  if (value === null) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/40">
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-400">—</p>
      </div>
    );
  }

  const isPositive = value < 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const color = isGood
    ? "text-emerald-600 dark:text-emerald-400"
    : value === 0
      ? "text-slate-700 dark:text-slate-200"
      : "text-amber-600 dark:text-amber-400";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/40">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value > 0 ? "+" : ""}
        {value.toFixed(1)} {suffix ?? "kg"}
      </p>
    </div>
  );
}

export function WeightStatsCards({ stats }: { stats: WeightStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/40">
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Güncel Kilo
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {stats.current_weight ?? "—"} kg
        </p>
      </div>
      <StatCard label="Haftalık Değişim" value={stats.weight_change_week} />
      <StatCard label="Aylık Değişim" value={stats.weight_change_month} />
    </div>
  );
}
