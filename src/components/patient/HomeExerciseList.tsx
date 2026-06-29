"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { NeonSlider } from "@/components/ui/NeonSlider";
import { getExerciseImage, weeklyProgress } from "@/lib/exerciseImages";
import type { ExerciseAssignment } from "@/lib/api";

interface HomeExerciseListProps {
  exercises: ExerciseAssignment[];
  onComplete: (
    assignmentId: number,
    data?: { pain_before?: number; pain_after?: number }
  ) => Promise<void>;
  bare?: boolean;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

export function HomeExerciseList({
  exercises,
  onComplete,
  bare,
}: HomeExerciseListProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [painBefore, setPainBefore] = useState(3);
  const [painAfter, setPainAfter] = useState(2);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const active = exercises.filter((item) => item.is_active);
  const detailAssignment = active.find((a) => a.id === detailId);
  const completeAssignment = active.find((a) => a.id === completeId);

  const submitComplete = async () => {
    if (!completeId) return;
    setCompletingId(completeId);
    try {
      await onComplete(completeId, {
        pain_before: painBefore,
        pain_after: painAfter,
      });
      setCompleteId(null);
    } finally {
      setCompletingId(null);
    }
  };

  const grid =
    active.length === 0 ? (
      <div className="mt-2 rounded-xl border border-dashed border-slate-300/70 px-4 py-8 text-center dark:border-slate-600/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Henüz atanmış ev egzersizi yok.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Terapistiniz programınızı eklediğinde burada görünecek. Randevu
          alarak seans planlayabilirsiniz.
        </p>
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        {active.filter((a) => a.exercise).map((assignment) => {
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
                className="relative block aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-700/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getExerciseImage(exercise)}
                  alt={exercise.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {assignment.completed_today && (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white shadow">
                    Bugün yapıldı
                  </span>
                )}
              </button>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailId(assignment.id)}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {exercise.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {exercise.sets} set × {exercise.reps} tekrar ·{" "}
                      {exercise.duration_minutes} dk
                    </p>
                  </button>
                  <CircularProgress value={progress} size={52} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={assignment.completed_today}
                    onClick={() => {
                      setPainBefore(3);
                      setPainAfter(2);
                      setCompleteId(assignment.id);
                    }}
                    className="flex-1 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {assignment.completed_today ? "Bugün tamam" : "Tamamladım"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailId(assignment.id)}
                    className="rounded-full border border-slate-300/60 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
                  >
                    Detay
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

  const modals = (
    <>
      {detailAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setDetailId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getExerciseImage(detailAssignment.exercise)}
              alt={detailAssignment.exercise.title}
              className="aspect-16/10 w-full rounded-xl object-cover"
            />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
              {detailAssignment.exercise.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {detailAssignment.exercise.sets} set ×{" "}
              {detailAssignment.exercise.reps} tekrar ·{" "}
              {detailAssignment.exercise.duration_minutes} dk ·{" "}
              {detailAssignment.frequency_label}
            </p>
            {detailAssignment.exercise.description && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {detailAssignment.exercise.description}
              </p>
            )}
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-200">
              {detailAssignment.exercise.instructions}
            </pre>
            {detailAssignment.therapist_note && (
              <p className="mt-3 rounded-lg bg-blue-50/70 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                Terapist notu: {detailAssignment.therapist_note}
              </p>
            )}
            <button
              type="button"
              onClick={() => setDetailId(null)}
              className="mt-5 w-full rounded-full border border-slate-300/70 py-2.5 text-sm font-medium dark:border-slate-600/60"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {completeAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setCompleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Egzersizi tamamladınız mı?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {completeAssignment.exercise.title}
            </p>
            <div className="mt-4 space-y-4">
              <NeonSlider
                label="Egzersiz öncesi ağrı (0–10)"
                value={painBefore}
                min={0}
                max={10}
                unit=""
                accent="blue"
                orientation="horizontal"
                onChange={setPainBefore}
              />
              <NeonSlider
                label="Egzersiz sonrası ağrı (0–10)"
                value={painAfter}
                min={0}
                max={10}
                unit=""
                accent="mint"
                orientation="horizontal"
                onChange={setPainAfter}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setCompleteId(null)}
                className="flex-1 rounded-full border border-slate-300/70 py-2.5 text-sm font-medium dark:border-slate-600/60"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={completingId === completeId}
                onClick={submitComplete}
                className="flex-1 rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {completingId === completeId ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (bare) {
    return (
      <>
        {grid}
        {modals}
      </>
    );
  }

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Ev Programım
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Terapistinizin atadığı hareketleri evde uygulayın ve tamamlandı
          işaretleyin.
        </p>
        <div className="mt-4">{grid}</div>
      </GlassCard>
      {modals}
    </>
  );
}
