"use client";

import { useEffect, useState } from "react";
import { api, type PatientProgram, type PatientProgramDay } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DIFF_LABELS: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFF_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function todayDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // 0=Pzt
}

export default function ProgramimPage() {
  const [program, setProgram] = useState<PatientProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const token = getAccessToken() ?? "";

  const load = async () => {
    setLoading(true);
    try {
      const { program: p } = await api.wellness.myProgram(token);
      setProgram(p);
      // Auto-expand today's day
      if (p) {
        const todayIdx = todayDayIndex();
        const todayDay = p.program_type === "weekly"
          ? p.days.find((d) => d.day_number === todayIdx)
          : p.days[0]; // sequential: first incomplete
        if (todayDay) setExpandedDay(todayDay.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async (itemId: number) => {
    setCompleting(itemId);
    try {
      await api.wellness.completeExerciseItem(token, itemId);
      await load();
    } finally {
      setCompleting(null);
    }
  };

  const getDayLabel = (day: PatientProgramDay) => {
    if (!program) return "";
    if (program.program_type === "weekly") return WEEK_DAYS[day.day_number] ?? `Gün ${day.day_number}`;
    return `${day.day_number}. Gün`;
  };

  const isToday = (day: PatientProgramDay) => {
    if (!program) return false;
    if (program.program_type === "weekly") return day.day_number === todayDayIndex();
    return false;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-slate-700">
        <p className="text-4xl">🏋️</p>
        <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">Henüz bir programınız yok</p>
        <p className="mt-1 text-sm text-slate-400">Uzmanınız size bir egzersiz programı atadığında burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{program.name}</h1>
            {program.description && <p className="mt-1 text-sm text-slate-500">{program.description}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFF_COLORS[program.difficulty]}`}>
                {DIFF_LABELS[program.difficulty]}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {program.program_type === "weekly" ? "Haftalık Plan" : "Sıralı Program"} · {program.duration_weeks} hafta
              </span>
            </div>
          </div>
          {/* Weekly progress */}
          {program.program_type === "weekly" && (
            <div className="flex gap-1">
              {WEEK_DAYS.slice(0, 7).map((day, i) => {
                const d = program.days.find((pd) => pd.day_number === i);
                const done = d ? d.items.every((it) => it.completed_today) && d.items.length > 0 : false;
                const isT = i === todayDayIndex();
                return (
                  <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    done ? "bg-emerald-500 text-white" : isT ? "bg-blue-500 text-white" : d ? "bg-slate-100 text-slate-500 dark:bg-slate-800" : "bg-slate-50 text-slate-300 dark:bg-slate-900"
                  }`}>
                    {done ? "✓" : day[0]}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {program.days.map((day) => {
          const isExpanded = expandedDay === day.id;
          const todayDay = isToday(day);
          const completedCount = day.items.filter((i) => i.completed_today).length;
          const allDone = completedCount === day.items.length && day.items.length > 0;

          return (
            <div key={day.id} className={`overflow-hidden rounded-2xl border transition-colors ${
              todayDay ? "border-blue-300/80 dark:border-blue-700/60" : "border-slate-200/80 dark:border-slate-700/60"
            } bg-white dark:bg-slate-900`}>
              {/* Day header */}
              <button type="button" onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  allDone ? "bg-emerald-500 text-white" : todayDay ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {allDone ? "✓" : isExpanded ? "▾" : "▸"}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{getDayLabel(day)}</span>
                    {day.title && <span className="text-sm text-slate-400">— {day.title}</span>}
                    {todayDay && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-900/40">Bugün</span>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {completedCount}/{day.items.length} egzersiz tamamlandı
                  </p>
                </div>
                {/* Mini progress */}
                <div className="flex shrink-0 items-center gap-1">
                  {day.items.map((item) => (
                    <span key={item.id} className={`h-2 w-2 rounded-full ${item.completed_today ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                  ))}
                </div>
              </button>

              {/* Exercises */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 pb-4 pt-3 dark:border-slate-800">
                  {day.items.length === 0 ? (
                    <p className="text-sm text-slate-400">Bu güne egzersiz eklenmemiş.</p>
                  ) : (
                    <div className="space-y-3">
                      {day.items.map((item) => (
                        <div key={item.id} className={`flex items-center gap-4 rounded-xl p-3 transition-colors ${
                          item.completed_today ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-slate-50 dark:bg-slate-800/40"
                        }`}>
                          {/* Image */}
                          {item.exercise_image ? (
                            <img src={item.exercise_image} alt={item.exercise_title}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl dark:bg-slate-700">🏋️</div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-50">{item.exercise_title}</p>
                            <p className="text-xs text-slate-500">
                              {item.sets} set ×{" "}
                              {item.reps ? `${item.reps} tekrar` : item.duration_seconds ? `${item.duration_seconds}sn` : "—"}
                              {" · "}{item.rest_seconds}sn dinlenme
                            </p>
                            {item.note && <p className="mt-0.5 text-xs italic text-slate-400">{item.note}</p>}
                          </div>

                          {/* Complete button */}
                          <button type="button"
                            onClick={() => !item.completed_today && handleComplete(item.id)}
                            disabled={item.completed_today || completing === item.id}
                            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                              item.completed_today
                                ? "bg-emerald-500 text-white"
                                : completing === item.id
                                ? "bg-slate-200 text-slate-400"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}>
                            {item.completed_today ? "✓ Tamamlandı" : completing === item.id ? "…" : "Tamamla"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
