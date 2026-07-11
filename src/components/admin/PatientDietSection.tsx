"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type DietProgram, type PatientDietAssignment } from "@/lib/api";

interface Props {
  patientId: number;
  onMessage: (msg: string, type: "success" | "error") => void;
}

const MEAL_TYPES: Record<string, string> = {
  sabah: "Kahvaltı", ara1: "Ara Öğün 1", ogle: "Öğle",
  ara2: "Ara Öğün 2", aksam: "Akşam", gece: "Gece", serbest: "Serbest Öğün",
};

export function PatientDietSection({ patientId, onMessage }: Props) {
  const confirm = useConfirm();
  const [assignments, setAssignments] = useState<PatientDietAssignment[]>([]);
  const [allPrograms, setAllPrograms] = useState<DietProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // atama formu
  const [showAssign, setShowAssign] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | "">("");
  const [assignNote, setAssignNote] = useState("");

  // görüntüleme
  const [viewAssignment, setViewAssignment] = useState<PatientDietAssignment | null>(null);
  const [viewDayIdx, setViewDayIdx] = useState(0);

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [asgns, progs] = await Promise.all([
        api.admin.dietAssignments.list(token, patientId),
        api.admin.dietPrograms.list(token),
      ]);
      setAssignments(asgns);
      setAllPrograms(progs);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [patientId]);

  const assignedProgramIds = new Set(assignments.map((a) => a.program.id));
  const availablePrograms = allPrograms.filter((p) => !assignedProgramIds.has(p.id));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) { onMessage("Bir program seçin.", "error"); return; }
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      await api.admin.dietAssignments.create(token, patientId, { program_id: Number(selectedProgramId), note: assignNote });
      onMessage("Program atandı.", "success");
      setShowAssign(false);
      setSelectedProgramId("");
      setAssignNote("");
      load();
    } catch (err) { onMessage(err instanceof Error ? err.message : "Hata.", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (a: PatientDietAssignment) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.dietAssignments.update(token, patientId, a.id, { is_active: !a.is_active });
      load();
    } catch { onMessage("Güncellenemedi.", "error"); }
  };

  const handleRemove = async (a: PatientDietAssignment) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Programı Kaldır", message: `"${a.program.title}" bu öğrenciden kaldırılacak.`, confirmLabel: "Kaldır", variant: "danger" });
    if (!ok) return;
    try {
      await api.admin.dietAssignments.delete(token, patientId, a.id);
      onMessage("Kaldırıldı.", "success");
      load();
    } catch { onMessage("Kaldırılamadı.", "error"); }
  };

  /* ---- VIEW ---- */
  if (viewAssignment) {
    const prog = viewAssignment.program;
    const days = prog.days ?? [];
    const day = days[viewDayIdx];
    return (
      <div className="space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <button onClick={() => setViewAssignment(null)} className="mb-2 text-xs text-blue-500 hover:underline">← Geri</button>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{prog.title}</h2>
          {prog.goals && <p className="mt-0.5 text-sm text-slate-500">{prog.goals}</p>}
          {prog.feeding_notes && <p className="mt-0.5 text-xs text-slate-400 italic">{prog.feeding_notes}</p>}
        </GlassCard>

        <div className="flex flex-wrap gap-2 px-1">
          {days.map((d, idx) => (
            <button key={d.id} onClick={() => setViewDayIdx(idx)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${viewDayIdx === idx ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200/60 bg-white/60 text-slate-600 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"}`}>
              Gün {d.day_number}{d.label ? ` — ${d.label}` : ""}
            </button>
          ))}
        </div>

        {day && (
          <GlassCard className="p-5 sm:p-6">
            {day.description && <p className="mb-4 text-sm text-slate-500">{day.description}</p>}
            <div className="space-y-4">
              {day.meals.map((meal) => {
                const total = meal.total_calories ?? meal.items.reduce((s, it) => s + (it.calories ?? 0), 0);
                return (
                  <div key={meal.id} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {MEAL_TYPES[meal.meal_type] ?? meal.meal_type}
                      </span>
                      {meal.meal_time && <span className="text-xs text-slate-500">🕐 {meal.meal_time}</span>}
                      {total > 0 && <span className="ml-auto text-xs font-bold text-orange-600 dark:text-orange-400">{total} kcal</span>}
                    </div>
                    {meal.description && <p className="mb-2 text-xs text-slate-500">{meal.description}</p>}
                    <div className="space-y-1.5">
                      {meal.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
                          <span className="text-sm text-slate-800 dark:text-slate-200">{it.name}</span>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{it.quantity} porsiyon</span>
                            <span className="font-semibold text-orange-500">{it.calories} kcal</span>
                            {it.note && <span className="italic">{it.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    );
  }

  /* ---- LIST ---- */
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Beslenme Programları</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Bu öğrenciye atanmış programlar.</p>
          </div>
          {!showAssign && availablePrograms.length > 0 && (
            <button onClick={() => setShowAssign(true)} className="shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
              + Program Ata
            </button>
          )}
        </div>

        {showAssign && (
          <form onSubmit={handleAssign} className="mt-5 space-y-4 border-t border-slate-200/60 pt-5 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Program Ata</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Program *</label>
                <CustomSelect<number | "">
                  value={selectedProgramId}
                  onChange={(v) => setSelectedProgramId(v)}
                  placeholder="Program seç…"
                  options={availablePrograms.map((p) => ({
                    value: p.id as number | "",
                    label: `${p.title} (${p.duration_days} gün)`,
                  }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Not (isteğe bağlı)</label>
                <input
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Atama notu…"
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                {saving ? "Atanıyor…" : "Ata"}
              </button>
              <button type="button" onClick={() => setShowAssign(false)} className="rounded-full border border-slate-300/60 px-5 py-2 text-sm font-medium text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
                İptal
              </button>
            </div>
          </form>
        )}
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : assignments.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz program atanmamış.</p>
          {allPrograms.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">Önce <a href="/panel/diyet" className="text-blue-500 hover:underline">Diyet sayfasından</a> program oluşturun.</p>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <GlassCard key={a.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{a.program.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      {a.is_active ? "Aktif" : "Pasif"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {a.program.duration_days} gün
                    </span>
                  </div>
                  {a.program.goals && <p className="mt-1 text-xs text-slate-500">{a.program.goals}</p>}
                  {a.note && <p className="mt-0.5 text-xs text-slate-400 italic">{a.note}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    Atandı: {new Date(a.assigned_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    {a.assigned_by_name && ` · ${a.assigned_by_name}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => { setViewAssignment(a); setViewDayIdx(0); }} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">
                    Görüntüle
                  </button>
                  <button onClick={() => toggleActive(a)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-400">
                    {a.is_active ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                  <button onClick={() => handleRemove(a)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">
                    Kaldır
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
