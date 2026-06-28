"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import type { WellnessStats } from "@/lib/api";

export function WellnessStatsStrip({ stats }: { stats: WellnessStats }) {
  const cards = [
    {
      label: "Ev Egzersizi",
      value: stats.active_exercises,
      suffix: "aktif",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Bu Hafta",
      value: stats.completions_this_week,
      suffix: "tamamlama",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Ort. Ağrı",
      value: stats.average_pain ?? "—",
      suffix:
        stats.pain_change_week !== null
          ? `${stats.pain_change_week > 0 ? "↓" : stats.pain_change_week < 0 ? "↑" : ""}${Math.abs(stats.pain_change_week ?? 0)} haftalık`
          : "",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "İlerleme Foto",
      value: stats.progress_photo_count,
      suffix: "kayıt",
      color: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <GlassCard key={card.label} className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
          {card.suffix && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {card.suffix}
            </p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
