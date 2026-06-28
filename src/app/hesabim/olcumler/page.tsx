"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type BodyMeasurement } from "@/lib/api";

const COLUMNS: { key: keyof BodyMeasurement; label: string; unit?: string }[] = [
  { key: "date", label: "Tarih" },
  { key: "label", label: "Etiket" },
  { key: "weight", label: "Kilo", unit: "kg" },
  { key: "yag_orani", label: "Yağ %", unit: "%" },
  { key: "bel", label: "Bel", unit: "cm" },
  { key: "kalca", label: "Kalça", unit: "cm" },
  { key: "gogus", label: "Göğüs", unit: "cm" },
  { key: "omuz", label: "Omuz", unit: "cm" },
  { key: "gobek", label: "Göbek", unit: "cm" },
  { key: "alt_karin", label: "Alt Karın", unit: "cm" },
  { key: "basen", label: "Basen", unit: "cm" },
  { key: "sag_bacak", label: "Sağ Bacak", unit: "cm" },
  { key: "sol_bacak", label: "Sol Bacak", unit: "cm" },
  { key: "sag_kol", label: "Sağ Kol", unit: "cm" },
  { key: "sol_kol", label: "Sol Kol", unit: "cm" },
];

function fmtCell(col: { key: keyof BodyMeasurement; label: string; unit?: string }, m: BodyMeasurement): string {
  if (col.key === "date") return new Date(m.date).toLocaleDateString("tr-TR");
  const val = m[col.key];
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

export default function OlcumlerPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.measurements
      .list(token)
      .then(setMeasurements)
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        @media print {
          aside, header, nav, .no-print { display: none !important; }
          body { background: white !important; }
          .glass-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; background: white !important; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
              Ölçümlerim
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Terapistiniz tarafından kaydedilen vücut ölçümleriniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print shrink-0 rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Yazdır
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        )}

        {error && (
          <GlassCard className="p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </GlassCard>
        )}

        {!loading && !error && measurements.length === 0 && (
          <GlassCard className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz kaydedilmiş ölçüm bulunmuyor.
          </GlassCard>
        )}

        {!loading && measurements.length > 0 && (
          <GlassCard className="glass-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-slate-600/50">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      {col.label}
                      {col.unit ? ` (${col.unit})` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`border-b border-slate-100/60 dark:border-slate-700/40 ${
                      i % 2 === 0
                        ? "bg-white/30 dark:bg-slate-800/20"
                        : "bg-white/10 dark:bg-slate-900/10"
                    }`}
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="whitespace-nowrap px-4 py-2.5 text-slate-800 dark:text-slate-200"
                      >
                        {fmtCell(col, m)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </>
  );
}
