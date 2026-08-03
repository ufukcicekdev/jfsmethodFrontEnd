"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { api, type ExerciseProgram, type ExerciseProgramDay, type ExerciseProgramItem, type ProductPackage, type Exercise, type DietProgram } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

// ── Program Form ──────────────────────────────────────────────────────────────

function ProgramForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ExerciseProgram>;
  onSave: (data: Partial<ExerciseProgram>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    program_type: initial?.program_type ?? "weekly",
    difficulty: initial?.difficulty ?? "easy",
    duration_weeks: initial?.duration_weeks ?? 4,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Program Adı *</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="ör: 4 Haftalık Güç Programı" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Açıklama</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Tür</label>
          <CustomSelect
            value={form.program_type}
            onChange={(v) => setForm((f) => ({ ...f, program_type: v as "weekly" | "sequential" }))}
            options={[
              { value: "weekly", label: "Haftalık Plan (Pzt–Paz)" },
              { value: "sequential", label: "Sıralı Günler (1. gün, 2. gün…)" },
            ]}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Zorluk</label>
          <CustomSelect
            value={form.difficulty}
            onChange={(v) => setForm((f) => ({ ...f, difficulty: v as "easy" | "medium" | "hard" }))}
            options={[
              { value: "easy", label: "Kolay" },
              { value: "medium", label: "Orta" },
              { value: "hard", label: "Zor" },
            ]}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Süre (hafta)</label>
          <input type="number" min={1} max={52} value={form.duration_weeks} onChange={(e) => setForm((f) => ({ ...f, duration_weeks: Number(e.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div className="flex items-center gap-2 self-end">
          <input type="checkbox" id="prog-active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          <label htmlFor="prog-active" className="text-sm text-slate-700 dark:text-slate-300">Aktif</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handle} disabled={saving || !form.name.trim()}
          className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200">
          İptal
        </button>
      </div>
    </div>
  );
}

// ── Day Form ──────────────────────────────────────────────────────────────────

function DayForm({
  programType,
  existingDayNumbers,
  initial,
  onSave,
  onCancel,
}: {
  programType: "weekly" | "sequential";
  existingDayNumbers: number[];
  initial?: Partial<ExerciseProgramDay>;
  onSave: (data: Partial<ExerciseProgramDay>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    day_number: initial?.day_number ?? (programType === "sequential" ? (Math.max(0, ...existingDayNumbers) + 1) : 0),
    title: initial?.title ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            {programType === "weekly" ? "Gün" : "Gün Numarası"}
          </label>
          {programType === "weekly" ? (
            <CustomSelect
              value={form.day_number}
              onChange={(v) => setForm((f) => ({ ...f, day_number: Number(v) }))}
              options={WEEK_DAYS.map((d, i) => ({
                value: i,
                label: d,
                disabled: existingDayNumbers.includes(i) && initial?.day_number !== i,
              }))}
            />
          ) : (
            <input type="number" min={1} value={form.day_number} onChange={(e) => setForm((f) => ({ ...f, day_number: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Başlık (opsiyonel)</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder={programType === "weekly" ? "ör: Göğüs Günü" : "ör: Isınma Haftası"} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handle} disabled={saving}
          className="rounded-xl bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
          {saving ? "…" : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">İptal</button>
      </div>
    </div>
  );
}

// ── Item Form ─────────────────────────────────────────────────────────────────

function ItemForm({
  exercises,
  initial,
  onSave,
  onCancel,
}: {
  exercises: Exercise[];
  initial?: Partial<ExerciseProgramItem>;
  onSave: (data: Partial<ExerciseProgramItem>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    exercise: initial?.exercise ?? (exercises[0]?.id ?? 0),
    sets: initial?.sets ?? 3,
    reps: initial?.reps ?? (10 as number | null),
    duration_seconds: initial?.duration_seconds ?? (null as number | null),
    rest_seconds: initial?.rest_seconds ?? 60,
    note: initial?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [useTime, setUseTime] = useState(!!(initial?.duration_seconds));

  const handle = async () => {
    if (!form.exercise) return;
    setSaving(true);
    try {
      await onSave({
        exercise: form.exercise,
        sets: form.sets,
        reps: useTime ? null : form.reps,
        duration_seconds: useTime ? form.duration_seconds : null,
        rest_seconds: form.rest_seconds,
        note: form.note,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Egzersiz *</label>
          <CustomSelect
            value={form.exercise}
            onChange={(v) => setForm((f) => ({ ...f, exercise: Number(v) }))}
            options={exercises.map((ex) => ({ value: ex.id, label: ex.title }))}
            placeholder="Egzersiz seçin"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Set</label>
          <input type="number" min={1} value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: Number(e.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">{useTime ? "Süre (sn)" : "Tekrar"}</label>
            <button type="button" onClick={() => setUseTime((v) => !v)}
              className="text-[10px] text-blue-500 underline">{useTime ? "Tekrara geç" : "Süreye geç"}</button>
          </div>
          {useTime ? (
            <input type="number" min={1} value={form.duration_seconds ?? ""} onChange={(e) => setForm((f) => ({ ...f, duration_seconds: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="ör: 30" />
          ) : (
            <input type="number" min={1} value={form.reps ?? ""} onChange={(e) => setForm((f) => ({ ...f, reps: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="ör: 12" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Dinlenme (sn)</label>
          <input type="number" min={0} value={form.rest_seconds} onChange={(e) => setForm((f) => ({ ...f, rest_seconds: Number(e.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Not</label>
          <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="opsiyonel" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handle} disabled={saving || !form.exercise}
          className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40">
          {saving ? "…" : "Ekle"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">İptal</button>
      </div>
    </div>
  );
}

// ── Package Form ──────────────────────────────────────────────────────────────

function PackageForm({
  programs,
  dietPrograms,
  initial,
  onSave,
  onCancel,
}: {
  programs: ExerciseProgram[];
  dietPrograms: DietProgram[];
  initial?: Partial<ProductPackage>;
  onSave: (data: Partial<ProductPackage>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    exercise_program: initial?.exercise_program ?? (null as number | null),
    diet_program: initial?.diet_program ?? (null as number | null),
    price: initial?.price ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave({ ...form, price: form.price || null } as Partial<ProductPackage>); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Paket Adı *</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="ör: Başlangıç Paketi" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Açıklama</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Egzersiz Programı</label>
          <CustomSelect
            value={form.exercise_program ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, exercise_program: v ? Number(v) : null }))}
            options={[{ value: "", label: "— Yok —" }, ...programs.map((p) => ({ value: p.id, label: p.name }))]}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Diyet Programı</label>
          <CustomSelect
            value={form.diet_program ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, diet_program: v ? Number(v) : null }))}
            options={[{ value: "", label: "— Yok —" }, ...dietPrograms.map((p) => ({ value: p.id, label: p.title }))]}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Fiyat (₺) — bilgi amaçlı</label>
          <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="ör: 999" />
        </div>
        <div className="flex items-center gap-2 self-end">
          <input type="checkbox" id="pkg-active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          <label htmlFor="pkg-active" className="text-sm text-slate-700 dark:text-slate-300">Aktif</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handle} disabled={saving || !form.name.trim()}
          className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200">İptal</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "programs" | "packages";
type OpenId = string | null;

export default function ProgramlarPage() {
  const [tab, setTab] = useState<Tab>("programs");
  const [programs, setPrograms] = useState<ExerciseProgram[]>([]);
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dietPrograms, setDietPrograms] = useState<DietProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<OpenId>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const confirm = useConfirm();

  const token = getAccessToken() ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [progs, pkgs, exs, diets] = await Promise.all([
        api.admin.exercisePrograms(token),
        api.admin.productPackages(token),
        api.admin.exerciseLibrary(token),
        api.admin.dietPrograms.list(token),
      ]);
      setPrograms(progs);
      setPackages(pkgs);
      setExercises(exs);
      setDietPrograms(diets);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggleProgram = (id: number) =>
    setExpandedPrograms((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleDay = (id: number) =>
    setExpandedDays((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── Program handlers ──
  const handleCreateProgram = async (data: Partial<ExerciseProgram>) => {
    await api.admin.createExerciseProgram(token, data);
    setOpenId(null);
    await load();
  };

  const handleUpdateProgram = async (id: number, data: Partial<ExerciseProgram>) => {
    await api.admin.updateExerciseProgram(token, id, data);
    setOpenId(null);
    await load();
  };

  const handleDeleteProgram = async (prog: ExerciseProgram) => {
    const ok = await confirm({ title: "Programı sil", message: `"${prog.name}" silinecek. Emin misin?`, confirmLabel: "Sil" });
    if (!ok) return;
    await api.admin.deleteExerciseProgram(token, prog.id);
    await load();
  };

  // ── Day handlers ──
  const handleCreateDay = async (programId: number, data: Partial<ExerciseProgramDay>) => {
    await api.admin.createProgramDay(token, programId, data);
    setOpenId(null);
    await load();
  };

  const handleDeleteDay = async (day: ExerciseProgramDay, programName: string) => {
    const ok = await confirm({ title: "Günü sil", message: `"${programName}" programından bu günü silmek istediğine emin misin?`, confirmLabel: "Sil" });
    if (!ok) return;
    await api.admin.deleteProgramDay(token, day.id);
    await load();
  };

  // ── Item handlers ──
  const handleCreateItem = async (dayId: number, data: Partial<ExerciseProgramItem>) => {
    await api.admin.createProgramItem(token, dayId, data);
    setOpenId(null);
    await load();
  };

  const handleDeleteItem = async (item: ExerciseProgramItem) => {
    const ex = exercises.find((e) => e.id === item.exercise);
    const ok = await confirm({ title: "Egzersizi kaldır", message: `"${ex?.title ?? "Bu egzersiz"}" günden kaldırılacak.`, confirmLabel: "Kaldır" });
    if (!ok) return;
    await api.admin.deleteProgramItem(token, item.id);
    await load();
  };

  // ── Package handlers ──
  const handleCreatePackage = async (data: Partial<ProductPackage>) => {
    await api.admin.createProductPackage(token, data);
    setOpenId(null);
    await load();
  };

  const handleUpdatePackage = async (id: number, data: Partial<ProductPackage>) => {
    await api.admin.updateProductPackage(token, id, data);
    setOpenId(null);
    await load();
  };

  const handleDeletePackage = async (pkg: ProductPackage) => {
    const ok = await confirm({ title: "Paketi sil", message: `"${pkg.name}" silinecek.`, confirmLabel: "Sil" });
    if (!ok) return;
    await api.admin.deleteProductPackage(token, pkg.id);
    await load();
  };

  const getDayLabel = (prog: ExerciseProgram, day: ExerciseProgramDay) => {
    if (prog.program_type === "weekly") return WEEK_DAYS[day.day_number] ?? `Gün ${day.day_number}`;
    return `${day.day_number}. Gün`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Programlar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Egzersiz programları ve satış paketleri</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTab("programs")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "programs" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"}`}>
            Egzersiz Programları
          </button>
          <button type="button" onClick={() => setTab("packages")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "packages" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"}`}>
            Paketler
          </button>
        </div>
      </div>

      {/* ── Programs Tab ── */}
      {tab === "programs" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpenId(openId === "new-program" ? null : "new-program")}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              + Yeni Program
            </button>
          </div>

          {openId === "new-program" && (
            <GlassCard>
              <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Yeni Egzersiz Programı</p>
              <ProgramForm onSave={handleCreateProgram} onCancel={() => setOpenId(null)} />
            </GlassCard>
          )}

          {programs.length === 0 && openId !== "new-program" && (
            <GlassCard>
              <p className="text-center text-sm text-slate-400">Henüz egzersiz programı yok.</p>
            </GlassCard>
          )}

          {programs.map((prog) => {
            const isExpanded = expandedPrograms.has(prog.id);
            const editKey = `edit-prog-${prog.id}`;
            const newDayKey = `new-day-${prog.id}`;

            return (
              <GlassCard key={prog.id} className="overflow-hidden p-0">
                {/* Program header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button type="button" onClick={() => toggleProgram(prog.id)} className="flex flex-1 items-center gap-3 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600 dark:bg-blue-900/40">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-50">{prog.name}</span>
                        <Badge className={DIFFICULTY_COLORS[prog.difficulty]}>{DIFFICULTY_LABELS[prog.difficulty]}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {prog.program_type === "weekly" ? "Haftalık" : "Sıralı"} · {prog.duration_weeks} hafta
                        </Badge>
                        {!prog.is_active && <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-700">Pasif</Badge>}
                      </div>
                      {prog.description && <p className="mt-0.5 text-xs text-slate-400">{prog.description}</p>}
                    </div>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {prog.days.length} gün
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => { if (!isExpanded) toggleProgram(prog.id); setOpenId(openId === newDayKey ? null : newDayKey); }}
                      className="rounded-full border border-emerald-400/60 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400">
                      + Gün
                    </button>
                    <button type="button" onClick={() => { if (!isExpanded) toggleProgram(prog.id); setOpenId(openId === editKey ? null : editKey); }}
                      className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">
                      Düzenle
                    </button>
                    <button type="button" onClick={() => handleDeleteProgram(prog)}
                      className="rounded-full border border-red-300/60 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                      Sil
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 dark:border-slate-800">
                    {/* Edit program form */}
                    {openId === editKey && (
                      <div className="mb-4">
                        <ProgramForm initial={prog} onSave={(data) => handleUpdateProgram(prog.id, data)} onCancel={() => setOpenId(null)} />
                      </div>
                    )}

                    {/* New day form */}
                    {openId === newDayKey && (
                      <div className="mb-4">
                        <DayForm
                          programType={prog.program_type}
                          existingDayNumbers={prog.days.map((d) => d.day_number)}
                          onSave={(data) => handleCreateDay(prog.id, data)}
                          onCancel={() => setOpenId(null)}
                        />
                      </div>
                    )}

                    {/* Days */}
                    {prog.days.length === 0 ? (
                      <p className="text-sm italic text-slate-400">Henüz gün eklenmedi.</p>
                    ) : (
                      <div className="space-y-2">
                        {prog.days.map((day) => {
                          const isDayExpanded = expandedDays.has(day.id);
                          const newItemKey = `new-item-${day.id}`;

                          return (
                            <div key={day.id} className="rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                              {/* Day header */}
                              <div className="flex items-center gap-2 px-4 py-2.5">
                                <button type="button" onClick={() => toggleDay(day.id)} className="flex flex-1 items-center gap-2 text-left">
                                  <span className="text-xs text-slate-400">{isDayExpanded ? "▾" : "▸"}</span>
                                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {getDayLabel(prog, day)}
                                    {day.title ? ` — ${day.title}` : ""}
                                  </span>
                                  <span className="ml-1 text-xs text-slate-400">{day.items.length} egzersiz</span>
                                </button>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => { if (!isDayExpanded) toggleDay(day.id); setOpenId(openId === newItemKey ? null : newItemKey); }}
                                    className="rounded-full border border-emerald-400/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50">
                                    + Egzersiz
                                  </button>
                                  <button type="button" onClick={() => handleDeleteDay(day, prog.name)}
                                    className="rounded-full border border-red-300/40 px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50">
                                    Sil
                                  </button>
                                </div>
                              </div>

                              {/* Day content */}
                              {isDayExpanded && (
                                <div className="border-t border-slate-100 px-4 pb-3 pt-2 dark:border-slate-800">
                                  {openId === newItemKey && (
                                    <div className="mb-3">
                                      <ItemForm
                                        exercises={exercises}
                                        onSave={(data) => handleCreateItem(day.id, data)}
                                        onCancel={() => setOpenId(null)}
                                      />
                                    </div>
                                  )}
                                  {day.items.length === 0 ? (
                                    <p className="text-xs italic text-slate-400">Egzersiz yok.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {day.items.map((item) => {
                                        const ex = exercises.find((e) => e.id === item.exercise);
                                        return (
                                          <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                                            <div>
                                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.exercise_title || ex?.title}</span>
                                              <span className="ml-2 text-xs text-slate-400">
                                                {item.sets} set ×{" "}
                                                {item.reps ? `${item.reps} tekrar` : item.duration_seconds ? `${item.duration_seconds}sn` : "—"}
                                                {" · "}{item.rest_seconds}sn dinlenme
                                              </span>
                                              {item.note && <span className="ml-2 text-xs italic text-slate-400">{item.note}</span>}
                                            </div>
                                            <button type="button" onClick={() => handleDeleteItem(item)}
                                              className="ml-3 shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-100">
                                              Kaldır
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── Packages Tab ── */}
      {tab === "packages" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpenId(openId === "new-package" ? null : "new-package")}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              + Yeni Paket
            </button>
          </div>

          {openId === "new-package" && (
            <GlassCard>
              <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Yeni Paket</p>
              <PackageForm programs={programs} dietPrograms={dietPrograms} onSave={handleCreatePackage} onCancel={() => setOpenId(null)} />
            </GlassCard>
          )}

          {packages.length === 0 && openId !== "new-package" && (
            <GlassCard>
              <p className="text-center text-sm text-slate-400">Henüz paket yok.</p>
            </GlassCard>
          )}

          {packages.map((pkg) => {
            const editKey = `edit-pkg-${pkg.id}`;
            return (
              <GlassCard key={pkg.id}>
                {openId === editKey ? (
                  <PackageForm programs={programs} dietPrograms={dietPrograms} initial={pkg}
                    onSave={(data) => handleUpdatePackage(pkg.id, data)} onCancel={() => setOpenId(null)} />
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-50">{pkg.name}</span>
                        {pkg.price && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">₺{pkg.price}</Badge>}
                        {!pkg.is_active && <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-700">Pasif</Badge>}
                      </div>
                      {pkg.description && <p className="mt-1 text-sm text-slate-500">{pkg.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        {pkg.exercise_program_name && <span>🏋️ {pkg.exercise_program_name}</span>}
                        {pkg.diet_program_name && <span>🥗 {pkg.diet_program_name}</span>}
                        {!pkg.exercise_program_name && !pkg.diet_program_name && <span className="italic">Program eklenmemiş</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setOpenId(editKey)}
                        className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">
                        Düzenle
                      </button>
                      <button type="button" onClick={() => handleDeletePackage(pkg)}
                        className="rounded-full border border-red-300/60 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
