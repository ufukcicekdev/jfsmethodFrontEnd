"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type SessionPackage } from "@/lib/api";
import { PatientAppointmentsPanel } from "@/components/patient/PatientAppointmentsPanel";

function formatPrice(value: string | number | null) {
  if (value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type Penalty = { date: string; note: string; created_at: string };

export default function PatientPackagesPage() {
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([
      api.packages.me(token),
      api.packages.penalties(token),
    ])
      .then(([pkgs, pen]) => {
        setPackages(pkgs);
        setPenalties(pen);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = packages.find((p) => p.is_active);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Paket &amp; Randevu
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Seans paketleriniz, randevularınız ve ödeme durumu.
        </p>
      </div>

      {active ? (
        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Aktif Paket
              </p>
              <h2 className="mt-0.5 truncate text-base font-bold text-slate-900 dark:text-slate-50">
                {active.name || active.plan_name || `${active.total_sessions} seanslık paket`}
              </h2>
            </div>
            <a
              href="#randevularim"
              className="shrink-0 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Randevu Al
            </a>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{active.remaining_sessions}</span>
              <span className="text-sm font-medium text-slate-400"> / {active.total_sessions}</span>
              <p className="text-xs text-slate-500">kalan seans</p>
            </div>
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${active.total_sessions > 0 ? Math.round((active.used_sessions / active.total_sessions) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex gap-3 text-xs text-slate-500">
                <span>Kullanılan: {active.used_sessions}</span>
                <span>Planlı: {active.scheduled_count}</span>
                <span>Gelmedi: {active.no_show_count}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {formatPrice(active.price) && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                {formatPrice(active.price)}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 ${
                active.is_paid
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {active.is_paid ? "Ödendi" : "Ödeme bekleniyor"}
            </span>
            <span className="text-slate-500">Satın alma: {formatDate(active.purchased_at)}</span>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Aktif seans paketiniz bulunmuyor.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Paket tanımlandığında burada görünecek. Bilgi için kliniğimizle
            iletişime geçebilirsiniz.
          </p>
          <Link
            href="/#iletisim"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            İletişime geç →
          </Link>
        </GlassCard>
      )}

      {packages.length > 0 && (
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-600/50">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Tüm Paketler
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-600/50">
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Kalan / Toplam</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Ödeme</th>
                  <th className="px-4 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {pkg.name || pkg.plan_name || "Paket"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{pkg.remaining_sessions}</span>
                      <span className="text-slate-400"> / {pkg.total_sessions}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          pkg.is_active
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {pkg.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {pkg.is_paid ? "Ödendi" : "Bekliyor"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(pkg.purchased_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
      {penalties.length > 0 && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Geç İptal / Ceza Geçmişi
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Son dakika iptalleriniz nedeniyle düşülen seans hakları.
          </p>
          <ul className="mt-4 space-y-2">
            {penalties.map((p, i) => (
              <li
                key={i}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-red-200/60 bg-red-50/50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/20"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(p.date)}
                  </p>
                  {p.note && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {p.note}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  −1 seans
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Randevular */}
      <div id="randevularim">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">Randevularım</h2>
        <PatientAppointmentsPanel />
      </div>
    </div>
  );
}
