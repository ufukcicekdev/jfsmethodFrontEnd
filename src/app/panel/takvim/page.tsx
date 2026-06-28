"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type Appointment } from "@/lib/api";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  postponed: "Ertelendi",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

const STATUS_DOT: Record<Appointment["status"], string> = {
  pending: "bg-blue-400",
  approved: "bg-emerald-500",
  postponed: "bg-amber-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-500",
  no_show: "bg-orange-500",
};

const STATUS_CARD: Record<Appointment["status"], string> = {
  pending:
    "border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/30",
  approved:
    "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30",
  postponed:
    "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30",
  completed:
    "border-slate-200 bg-slate-50/70 dark:border-slate-700/60 dark:bg-slate-800/40",
  cancelled:
    "border-red-200 bg-red-50/60 opacity-70 dark:border-red-900/50 dark:bg-red-950/20",
  no_show:
    "border-orange-200 bg-orange-50/70 dark:border-orange-900/50 dark:bg-orange-950/30",
};

const DAY_LABELS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Pazartesi = 0
  d.setDate(d.getDate() - day);
  return d;
}

function toIsoDate(date: Date) {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD, yerel saat
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError("");
    api.admin
      .appointments(token, {
        dateFrom: toIsoDate(weekStart),
        dateTo: toIsoDate(addDays(weekStart, 6)),
      })
      .then(setAppointments)
      .catch(() => setError("Takvim yüklenemedi."))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      const key = toIsoDate(new Date(appt.appointment_datetime));
      (map[key] ??= []).push(appt);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) =>
          new Date(a.appointment_datetime).getTime() -
          new Date(b.appointment_datetime).getTime()
      );
    }
    return map;
  }, [appointments]);

  const todayIso = toIsoDate(new Date());

  const rangeLabel = `${weekStart.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
  })} – ${addDays(weekStart, 6).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Takvim
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Haftalık randevu görünümü.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="rounded-full border border-slate-300/60 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
            aria-label="Önceki hafta"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-full border border-slate-300/60 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-full border border-slate-300/60 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
            aria-label="Sonraki hafta"
          >
            →
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {rangeLabel}
      </p>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
          {weekDays.map((day, index) => {
            const key = toIsoDate(day);
            const dayAppointments = byDay[key] ?? [];
            const isToday = key === todayIso;
            return (
              <div
                key={key}
                className={`rounded-2xl border p-3 ${
                  isToday
                    ? "border-blue-400/70 bg-blue-50/40 dark:border-blue-700/60 dark:bg-blue-950/20"
                    : "border-slate-200/70 bg-white/40 dark:border-slate-700/50 dark:bg-slate-800/30"
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {DAY_LABELS[index]}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {dayAppointments.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    —
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {dayAppointments.map((appt) => (
                      <li key={appt.id}>
                        <Link
                          href={
                            appt.patient_id
                              ? `/panel/ogrenciler/${appt.patient_id}`
                              : "/panel/randevular"
                          }
                          className={`block rounded-lg border px-2 py-1.5 text-xs transition-transform hover:-translate-y-0.5 ${
                            STATUS_CARD[appt.status]
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                STATUS_DOT[appt.status]
                              }`}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {timeLabel(appt.appointment_datetime)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate font-medium text-slate-700 dark:text-slate-200">
                            {appt.patient_name ?? "Öğrenci"}
                          </p>
                          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {STATUS_LABELS[appt.status]}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
