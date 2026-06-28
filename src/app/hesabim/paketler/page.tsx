"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type SessionPackage } from "@/lib/api";

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

export default function PatientPackagesPage() {
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.packages
      .me(token)
      .then(setPackages)
      .catch(() => setPackages([]))
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
          Seans Paketlerim
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Kalan seanslarınız, kullanım geçmişi ve ödeme durumu.
        </p>
      </div>

      {active ? (
        <GlassCard className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Aktif Paket
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
            {active.name || active.plan_name || `${active.total_sessions} seanslık paket`}
          </h2>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {active.remaining_sessions}
                <span className="text-lg font-medium text-slate-400">
                  {" "}
                  / {active.total_sessions}
                </span>
              </p>
              <p className="text-sm text-slate-500">kalan seans</p>
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-300">
              <p>Kullanılan: {active.used_sessions}</p>
              <p>Gelmedi: {active.no_show_count}</p>
              <p>Planlı: {active.scheduled_count}</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  active.total_sessions > 0
                    ? Math.round(
                        (active.used_sessions / active.total_sessions) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {formatPrice(active.price) && (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                {formatPrice(active.price)}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 ${
                active.is_paid
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {active.is_paid ? "Ödendi" : "Ödeme bekleniyor"}
            </span>
            <span className="text-slate-500">
              Satın alma: {formatDate(active.purchased_at)}
            </span>
          </div>
          <Link
            href="/hesabim/randevular"
            className="mt-5 inline-block rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Randevu Al
          </Link>
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
                  <th className="px-4 py-3">Seans</th>
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
                      {pkg.remaining_sessions}/{pkg.total_sessions}
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
    </div>
  );
}
