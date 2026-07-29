"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type Exercise, type ExerciseAssignment } from "@/lib/api";
import { getExerciseImage } from "@/lib/exerciseImages";

const FREQUENCIES = [
  { value: "daily", label: "Her gün" },
  { value: "every_other_day", label: "Gün aşırı" },
  { value: "weekly", label: "Haftada 3" },
  { value: "as_needed", label: "İhtiyaç halinde" },
];

interface PatientExerciseSectionProps {
  patientId: number;
  onMessage: (message: string, type: "success" | "error") => void;
}

// ---------------------------------------------------------------------------
// Lightbox — resim büyütme veya video oynatma
// ---------------------------------------------------------------------------
function MediaLightbox({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const content = exercise.video_url ? (
    <video
      ref={videoRef}
      src={exercise.video_url}
      controls
      autoPlay
      playsInline
      className="max-h-[80vh] w-full rounded-2xl object-contain"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getExerciseImage(exercise)}
      alt={exercise.title}
      className="max-h-[80vh] w-full rounded-2xl object-contain"
    />
  );

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
          aria-label="Kapat"
        >
          ✕
        </button>

        {content}

        <p className="mt-3 text-center text-sm font-medium text-white/80">
          {exercise.title}
        </p>

        {/* Resim varsa video'ya geç / video varsa resme geç butonu */}
        {exercise.video_url && exercise.image_url && (
          <p className="mt-1 text-center text-xs text-white/50">
            Video oynatılıyor — resmi görmek için kapatıp 🖼 ikonuna tıklayın
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Ana bileşen
// ---------------------------------------------------------------------------
export function PatientExerciseSection({
  patientId,
  onMessage,
}: PatientExerciseSectionProps) {
  const confirm = useConfirm();
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [assignments, setAssignments] = useState<ExerciseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [form, setForm] = useState({
    exercise_id: 0,
    frequency: "daily",
    therapist_note: "",
  });
  const [lightbox, setLightbox] = useState<{
    exercise: Exercise;
    mode: "image" | "video";
  } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    Promise.all([
      api.admin.exerciseLibrary(token),
      api.admin.patientExercises(token, patientId),
    ])
      .then(([exercises, patientAssignments]) => {
        const activeLibrary = exercises.filter((e) => e.is_active);
        setLibrary(activeLibrary);
        setAssignments(patientAssignments);
        if (activeLibrary.length && !form.exercise_id) {
          setForm((f) => ({ ...f, exercise_id: activeLibrary[0].id }));
        }
      })
      .catch(() => onMessage("Ev programı yüklenemedi.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.exercise_id) return;

    setAssigning(true);
    try {
      await api.admin.assignExercise(token, patientId, {
        exercise_id: form.exercise_id,
        frequency: form.frequency,
        therapist_note: form.therapist_note,
      });
      setForm((f) => ({ ...f, therapist_note: "" }));
      load();
      onMessage("Egzersiz atandı.", "success");
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Atama başarısız.",
        "error"
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleDeactivate = async (assignmentId: number) => {
    const ok = await confirm({
      title: "Egzersizi pasif yap",
      message: "Bu egzersizi pasif yapmak istediğinize emin misiniz?",
      confirmLabel: "Pasif yap",
      variant: "danger",
    });
    if (!ok) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      await api.admin.deactivateExercise(token, patientId, assignmentId);
      load();
      onMessage("Egzersiz pasif yapıldı.", "success");
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "İşlem başarısız.",
        "error"
      );
    }
  };

  // Seçili egzersizin preview'ı (form'daki dropdown için)
  const selectedExercise = library.find((e) => e.id === form.exercise_id);

  if (loading) {
    return (
      <GlassCard className="flex justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </GlassCard>
    );
  }

  const active = assignments.filter((a) => a.is_active);

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Ev Egzersiz Programı
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Öğrenciye evde yapması için hareket atayın. Tamamlamalar dijital ikiz
          ekranında görünür.
        </p>

        <form
          onSubmit={handleAssign}
          className="mt-4 space-y-3 rounded-xl border border-dashed border-slate-300/70 bg-slate-50/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/30"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Egzersiz
              </p>
              <CustomSelect
                value={form.exercise_id}
                onChange={(exercise_id) =>
                  setForm((f) => ({ ...f, exercise_id: Number(exercise_id) }))
                }
                options={library.map((ex) => ({
                  value: ex.id,
                  label: ex.title,
                }))}
                aria-label="Egzersiz seçin"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sıklık
              </p>
              <CustomSelect
                value={form.frequency}
                onChange={(frequency) =>
                  setForm((f) => ({ ...f, frequency: String(frequency) }))
                }
                options={FREQUENCIES}
                aria-label="Sıklık"
              />
            </div>
          </div>

          {/* Seçili egzersizin önizlemesi */}
          {selectedExercise && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/60 p-3 dark:border-slate-600/40 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    exercise: selectedExercise,
                    mode: selectedExercise.video_url ? "video" : "image",
                  })
                }
                className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg"
                title={selectedExercise.video_url ? "Videoyu oynat" : "Resmi büyüt"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getExerciseImage(selectedExercise)}
                  alt={selectedExercise.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <span className="text-xl text-white">
                    {selectedExercise.video_url ? "▶" : "⛶"}
                  </span>
                </div>
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {selectedExercise.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedExercise.sets} set × {selectedExercise.reps} tekrar ·{" "}
                  {selectedExercise.duration_minutes} dk ·{" "}
                  {selectedExercise.difficulty_label}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({ exercise: selectedExercise, mode: "image" })
                    }
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    🖼 Resmi büyüt
                  </button>
                  {selectedExercise.video_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox({ exercise: selectedExercise, mode: "video" })
                      }
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      ▶ Videoyu izle
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Terapist Notu
            </label>
            <textarea
              rows={2}
              placeholder="Örn. Sabah aç karnına, ağrı olursa dur."
              value={form.therapist_note}
              onChange={(e) =>
                setForm((f) => ({ ...f, therapist_note: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm dark:border-slate-600/60 dark:bg-slate-800/80"
            />
          </div>
          <button
            type="submit"
            disabled={assigning || !form.exercise_id}
            className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {assigning ? "Atanıyor…" : "Egzersiz Ata"}
          </button>
        </form>

        {active.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Aktif ev egzersizi yok.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {active.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200/80 px-4 py-3 dark:border-slate-600/50"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail — tıklanabilir */}
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({
                        exercise: assignment.exercise,
                        mode: assignment.exercise.video_url ? "video" : "image",
                      })
                    }
                    className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-600/40"
                    title={
                      assignment.exercise.video_url
                        ? "Videoyu oynat"
                        : "Resmi büyüt"
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getExerciseImage(assignment.exercise)}
                      alt={assignment.exercise.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                      <span className="text-lg text-white">
                        {assignment.exercise.video_url ? "▶" : "⛶"}
                      </span>
                    </div>
                    {assignment.exercise.video_url && (
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                        ▶
                      </span>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {assignment.exercise.title}
                      </p>
                      {assignment.completed_today && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✓ Bugün tamamlandı
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {assignment.frequency_label} · Bu hafta{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {assignment.completions_this_week}
                      </span>{" "}
                      tamamlama
                      {assignment.last_completed_at && (
                        <>
                          {" "}
                          · Son:{" "}
                          {new Date(
                            assignment.last_completed_at
                          ).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                      {!assignment.last_completed_at && (
                        <span className="ml-1 text-amber-500 dark:text-amber-400">
                          · Henüz tamamlanmadı
                        </span>
                      )}
                    </p>
                    {assignment.therapist_note && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {assignment.therapist_note}
                      </p>
                    )}
                    {/* Medya linkleri */}
                    <div className="mt-1 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLightbox({
                            exercise: assignment.exercise,
                            mode: "image",
                          })
                        }
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        🖼 Resmi büyüt
                      </button>
                      {assignment.exercise.video_url && (
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              exercise: assignment.exercise,
                              mode: "video",
                            })
                          }
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          ▶ Videoyu izle
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeactivate(assignment.id)}
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  Pasif Yap
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {lightbox && (
        <MediaLightbox
          exercise={
            lightbox.mode === "video"
              ? lightbox.exercise
              : { ...lightbox.exercise, video_url: null }
          }
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
