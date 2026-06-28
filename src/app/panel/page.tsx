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
        </>
      )}
    </div>
  );
}
