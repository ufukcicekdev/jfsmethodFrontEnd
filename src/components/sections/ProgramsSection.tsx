"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PublicProductPackage } from "@/lib/api";

const DIFF_LABELS: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFF_COLORS: Record<string, string> = {
  easy: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function LockOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end rounded-b-2xl bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent pb-6 pt-16">
      <span className="mb-2 text-2xl">🔒</span>
      <p className="text-center text-xs font-semibold text-slate-200">
        Detayları görmek için<br />programa katılın
      </p>
    </div>
  );
}

function ProgramCard({ pkg }: { pkg: PublicProductPackage }) {
  const ep = pkg.exercise_program;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/60 shadow-lg shadow-slate-200/40 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-900/60 dark:shadow-black/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 px-6 py-5 dark:from-blue-900/30 dark:to-violet-900/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{pkg.name}</h3>
            {pkg.description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{pkg.description}</p>
            )}
          </div>
          {pkg.price && (
            <div className="shrink-0 rounded-2xl bg-blue-500 px-3 py-1.5 text-center shadow-md shadow-blue-500/30">
              <p className="text-lg font-black text-white">
                {Number(pkg.price).toLocaleString("tr-TR")}₺
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {ep && (
            <>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFF_COLORS[ep.difficulty]}`}>
                {DIFF_LABELS[ep.difficulty]}
              </span>
              <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                {ep.program_type === "weekly" ? "Haftalık" : "Sıralı"} · {ep.duration_weeks} hafta
              </span>
              <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                🏋️ {ep.day_count} gün
              </span>
            </>
          )}
          {pkg.diet_program && (
            <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              🥗 Diyet Planı Dahil
            </span>
          )}
        </div>
      </div>

      {/* Preview days — teaser */}
      {ep && ep.preview_days.length > 0 && (
        <div className="relative flex-1 px-6 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Program Önizleme</p>
          <div className="space-y-2">
            {ep.preview_days.map((d) => (
              <div key={d.day_number} className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  {d.day_number + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {d.title || `Gün ${d.day_number + 1}`}
                  </p>
                  <p className="text-xs text-slate-400">{d.exercise_count} egzersiz</p>
                </div>
              </div>
            ))}
            {/* Locked remaining days */}
            {ep.day_count > ep.preview_days.length && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50/40 px-3 py-2 opacity-50 dark:bg-slate-800/20">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs dark:bg-slate-700">🔒</span>
                <p className="text-sm text-slate-400">
                  +{ep.day_count - ep.preview_days.length} gün daha…
                </p>
              </div>
            )}
          </div>

          {/* Full lock gradient overlay */}
          <LockOverlay />
        </div>
      )}

      {/* CTA */}
      <div className="px-6 pb-5 pt-2">
        <Link
          href="/login"
          className="block w-full rounded-xl bg-blue-500 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
        >
          Programa Katıl
        </Link>
      </div>
    </div>
  );
}

export function ProgramsSection() {
  const [packages, setPackages] = useState<PublicProductPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.site.publicPackages()
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || packages.length === 0) return null;

  return (
    <section id="programlar" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="mb-3 inline-block rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-400">
          Programlarımız
        </span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Size Özel Hazırlanmış Programlar
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-400">
          Egzersiz ve beslenme programlarını bir arada sunan kapsamlı paketlerimizle hedefinize ulaşın.
          Program içeriğini görmek için üye olun.
        </p>
      </div>

      {/* Cards */}
      <div className={`grid gap-6 ${packages.length === 1 ? "max-w-md mx-auto" : packages.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {packages.slice(0, 3).map((pkg) => (
          <ProgramCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {packages.length > 3 && (
        <p className="mt-6 text-center text-sm text-slate-400">
          ve {packages.length - 3} program daha…
        </p>
      )}
    </section>
  );
}
