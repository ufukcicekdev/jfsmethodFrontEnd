"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type ExerciseAssignment } from "@/lib/api";
import { getExerciseImage, weeklyProgress } from "@/lib/exerciseImages";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { NeonSlider } from "@/components/ui/NeonSlider";

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

function ExerciseDetailModal({
  assignment,
  onClose,
  onComplete,
}: {
  assignment: ExerciseAssignment;
  onClose: () => void;
  onComplete: (id: number, data?: { pain_before?: number; pain_after?: number }) => Promise<void>;
}) {
  const { exercise } = assignment;
  const [painBefore, setPainBefore] = useState(0);
  const [painAfter, setPainAfter] = useState(0);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(assignment.id, { pain_before: painBefore, pain_after: painAfter });
    setCompleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getExerciseImage(exercise)}
          alt={exercise.title}
          className="mb-4 h-48 w-full rounded-2xl object-cover"
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{exercise.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {exercise.sets} set × {exercise.reps} tekrar · {exercise.duration_minutes} dk · {assignment.frequency_label}
            </p>
          </div>
          {exercise.difficulty && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_BADGE[exercise.difficulty] ?? ""}`}>
              {exercise.difficulty}
            </span>
          )}
        </div>

        {exercise.description && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{exercise.description}</p>
        )}

        {assignment.therapist_note && (
          <div className="mt-3 rounded-xl bg-blue-50/80 p-3 dark:bg-blue-950/20">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Terapist notu</p>
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{assignment.therapist_note}</p>
          </div>
        )}

        {!assignment.completed_today && (
          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Egzersiz öncesi ağrı: <span className="text-slate-800 dark:text-slate-200">{painBefore}/10</span>
              </p>
              <NeonSlider label="Ağrı" unit="/10" min={0} max={10} value={painBefore} onChange={setPainBefore} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Egzersiz sonrası ağrı: <span className="text-slate-800 dark:text-slate-200">{painAfter}/10</span>
              </p>
              <NeonSlider label="Ağrı" unit="/10" min={0} max={10} value={painAfter} onChange={setPainAfter} />
            </div>
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-600 disabled:opacity-60"
            >
              {completing ? "Kaydediliyor…" : "Tamamlandı olarak işaretle"}
            </button>
          </div>
        )}

        {assignment.completed_today && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3 dark:bg-emerald-950/20">
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Bugün tamamlandı!</p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}

export default function EgzersizlerimPage() {
  const [exercises, setExercises] = useState<ExerciseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchExercises = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await api.wellness.exercises(token);
      setExercises(data.filter((a) => a.exercise));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const handleComplete = async (assignmentId: number, data?: { pain_before?: number; pain_after?: number }) => {
    const token = getAccessToken();
    if (!token) return;
    setCompleting(assignmentId);
    try {
      await api.wellness.completeExercise(token, assignmentId, data);
      setExercises((prev) =>
        prev.map((a) => a.id === assignmentId ? { ...a, completed_today: true, completions_this_week: a.completions_this_week + 1 } : a)
      );
    } catch {
      /* ignore */
    } finally {
      setCompleting(null);
    }
  };

  const active = exercises.filter((a) => a.is_active);
  const passive = exercises.filter((a) => !a.is_active);
  const detailAssignment = exercises.find((a) => a.id === detailId);

  const completedToday = active.filter((a) => a.completed_today).length;
  const totalActive = active.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Egzersizlerim</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Terapistinizin atadığı egzersiz programı.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
        </div>
      )}

      {!loading && active.length === 0 && (
        <GlassCard className="p-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Henüz egzersiz programınız oluşturulmamış.
          </p>
        </GlassCard>
      )}

      {!loading && active.length > 0 && (
        <>
          {/* Günlük özet */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-5">
              <CircularProgress value={totalActive > 0 ? (completedToday / totalActive) * 100 : 0} size={64} strokeWidth={6} />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Bugün {completedToday}/{totalActive} tamamlandı
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Bu hafta toplam {active.reduce((s, a) => s + a.completions_this_week, 0)} tamamlama
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Egzersiz kartları */}
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((assignment) => {
              const { exercise } = assignment;
              const progress = weeklyProgress(assignment);
              return (
                <div
                  key={assignment.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 transition-shadow hover:shadow-lg dark:border-slate-600/50 dark:bg-slate-800/40"
                >
                  <button
                    type="button"
                    onClick={() => setDetailId(assignment.id)}
                    className="relative block aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-700/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getExerciseImage(exercise)}
                      alt={exercise.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {assignment.completed_today && (
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                        ✓ Bugün yapıldı
                      </span>
                    )}
                    {exercise.difficulty && (
                      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_BADGE[exercise.difficulty] ?? ""}`}>
                        {exercise.difficulty}
                      </span>
                    )}
                  </button>

                  <div className="p-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{exercise.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {exercise.sets} set · {exercise.reps} tekrar · {assignment.frequency_label}
                    </p>

                    {/* Haftalık ilerleme */}
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Haftalık ilerleme</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailId(assignment.id)}
                        className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Detay
                      </button>
                      {!assignment.completed_today && (
                        <button
                          type="button"
                          onClick={() => handleComplete(assignment.id)}
                          disabled={completing === assignment.id}
                          className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                        >
                          {completing === assignment.id ? "…" : "Tamamlandı"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pasif egzersizler */}
      {!loading && passive.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Geçmiş</p>
          <div className="space-y-2">
            {passive.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/40 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/30">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{a.exercise.title}</p>
                  <p className="text-xs text-slate-400">{a.frequency_label}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">Pasif</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailAssignment && (
        <ExerciseDetailModal
          assignment={detailAssignment}
          onClose={() => setDetailId(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
