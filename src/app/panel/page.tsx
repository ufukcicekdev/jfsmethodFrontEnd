"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type AdminDashboard } from "@/lib/api";

export default function PanelDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    api.admin
      .dashboard(token)
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Toplam Öğrenci",
      value: stats?.patient_count ?? 0,
      href: "/panel/ogrenciler",
      color: "text-blue-600 dark:text-blue-400",
      icon: "👥",
    },
    {
      label: "Aktif Paket",
      value: stats?.active_packages ?? 0,
      href: "/panel/paketler",
      color: "text-emerald-600 dark:text-emerald-400",
      icon: "📦",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Genel Bakış
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Klinik özetiniz ve hızlı erişim bağlantıları.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {cards.map((card) => (
              <Link key={card.label} href={card.href}>
                <GlassCard className="p-5 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs dark:text-slate-400">
                      {card.label}
                    </p>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </GlassCard>
              </Link>
            ))}
          </div>

          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Hızlı İşlemler
            </h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/panel/ogrenciler"
                className="rounded-full bg-blue-500 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-600"
              >
                Öğrencileri Görüntüle
              </Link>
              <Link
                href="/panel/egzersizler"
                className="rounded-full border border-blue-500/40 px-5 py-2.5 text-center text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                Egzersiz Kütüphanesi
              </Link>
              <Link
                href="/panel/paketler"
                className="rounded-full border border-blue-500/40 px-5 py-2.5 text-center text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                Paketleri Yönet
              </Link>
            </div>
          </GlassCard>

          {/* Analitik */}
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            {/* Haftalık katılım */}
            <GlassCard className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                Haftalık Egzersiz Katılımı
              </h2>
              {stats?.weekly_attendance && stats.weekly_attendance.length > 0 ? (() => {
                const data = stats.weekly_attendance;
                const maxCount = Math.max(...data.map((d) => d.count), 1);
                const W = 560;
                const H = 140;
                const PAD = 24;
                const barW = (W - PAD * 2) / data.length - 4;
                return (
                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]">
                      {data.map((d, i) => {
                        const barH = (d.count / maxCount) * (H - PAD * 2);
                        const x = PAD + i * ((W - PAD * 2) / data.length) + 2;
                        const y = H - PAD - barH;
                        const weekLabel = new Date(d.week_start).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                        return (
                          <g key={i}>
                            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx="4"
                              fill={i === data.length - 1 ? "#3b82f6" : "#93c5fd"} />
                            {d.count > 0 && (
                              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#3b82f6">
                                {d.count}
                              </text>
                            )}
                            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#94a3b8">
                              {weekLabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })() : (
                <p className="py-8 text-center text-sm text-slate-400">Henüz veri yok.</p>
              )}
            </GlassCard>

            {/* En popüler egzersizler */}
            <GlassCard className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                En Çok Tamamlanan Egzersizler (Son 30 Gün)
              </h2>
              {stats?.top_exercises && stats.top_exercises.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_exercises.map((ex, i) => {
                    const maxCount = stats.top_exercises[0]?.count || 1;
                    const pct = Math.round((ex.count / maxCount) * 100);
                    return (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{ex.title}</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{ex.count}</p>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">Son 30 günde tamamlanan egzersiz yok.</p>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
