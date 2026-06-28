"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type Exercise, type ExerciseAssignment } from "@/lib/api";

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

  if (loading) {
    return (
      <GlassCard className="flex justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </GlassCard>
    );
  }

  const active = assignments.filter((a) => a.is_active);

  return (
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
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {assignment.exercise.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {assignment.frequency_label} · Bu hafta{" "}
                  {assignment.completions_this_week} tamamlama
                </p>
                {assignment.therapist_note && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {assignment.therapist_note}
                  </p>
                )}
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
  );
}
