"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { api, type ExerciseProgram, type ExerciseProgramDay, type ExerciseProgramItem, type ProgramMealEntry, type ProductPackage, type Exercise, type DietProgram, type DietItem, type Category } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const MEAL_TYPE_OPTIONS = [
  { value: "sabah", label: "🌅 Kahvaltı" },
  { value: "ara1",  label: "🍎 Ara Öğün 1" },
  { value: "ogle",  label: "☀️ Öğle" },
  { value: "ara2",  label: "🥜 Ara Öğün 2" },
  { value: "aksam", label: "🌙 Akşam" },
  { value: "gece",  label: "🌛 Gece" },
];
const MEAL_TYPE_EMOJI: Record<string, string> = {
  sabah: "🌅", ara1: "🍎", ogle: "☀️", ara2: "🥜", aksam: "🌙", gece: "🌛",
};

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

// ── Exercise Picker (hierarchical) ───────────────────────────────────────────

function ExercisePicker({
  token,
  exercises,
  selectedId,
  onChange,
}: {
  token: string;
  exercises: Exercise[];
  selectedId: number;
  onChange: (id: number) => void;
}) {
  const [rootCats, setRootCats] = useState<Category[]>([]);
  const [catPath, setCatPath] = useState<Category[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.admin.categoryTree(token, "exercise").then(setRootCats).catch(() => {});
  }, [token]);

  const currentCat = catPath[catPath.length - 1] ?? null;
  const currentChildren = currentCat ? currentCat.children : rootCats;
  const hasChildren = currentChildren.length > 0;

  const visibleExercises = query.trim()
    ? exercises.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
    : exercises.filter((e) => {
        if (!currentCat) return !e.category;
        return e.category === currentCat.id;
      });

  const selectedEx = exercises.find((e) => e.id === selectedId);

  return (
    <div className="space-y-2">
      {/* Selected chip */}
      {selectedEx && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{selectedEx.title}</span>
          <button type="button" onClick={() => onChange(0)} className="ml-auto text-xs text-slate-400 hover:text-red-500">×</button>
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Egzersiz ara…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {!query.trim() && hasChildren && (
        <CategoryBreadcrumb
          categories={currentChildren}
          path={catPath}
          onSelect={(c) => { setCatPath((p) => [...p, c]); setQuery(""); }}
          onBack={() => { setCatPath((p) => p.slice(0, -1)); setQuery(""); }}
          accentClass="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300"
        />
      )}
      {!query.trim() && !hasChildren && catPath.length > 0 && (
        <button type="button" onClick={() => setCatPath((p) => p.slice(0, -1))} className="text-[11px] text-slate-400 underline hover:text-slate-600">
          ‹ Geri
        </button>
      )}
      {(query.trim() || !hasChildren) && (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {visibleExercises.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{query.trim() ? "Sonuç bulunamadı" : "Bu kategoride egzersiz yok"}</p>
          ) : (
            visibleExercises.map((e) => {
              const isSel = e.id === selectedId;
              return (
                <button key={e.id} type="button" onClick={() => onChange(e.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${isSel ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                >
                  <span className={`font-medium ${isSel ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-100"}`}>
                    {isSel && "✓ "}{e.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{e.sets}×{e.reps}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ItemForm({
  token,
  exercises,
  initial,
  onSave,
  onCancel,
}: {
  token: string;
  exercises: Exercise[];
  initial?: Partial<ExerciseProgramItem>;
  onSave: (data: Partial<ExerciseProgramItem>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    exercise: initial?.exercise ?? 0,
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
          <ExercisePicker
            token={token}
            exercises={exercises}
            selectedId={form.exercise}
            onChange={(id) => setForm((f) => ({ ...f, exercise: id }))}
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

// ── Meal Entry Form ───────────────────────────────────────────────────────────

// ── Shared: category breadcrumb picker ───────────────────────────────────────

function CategoryBreadcrumb({
  categories,
  path,
  onSelect,
  onBack,
  accentClass,
}: {
  categories: Category[];
  path: Category[];
  onSelect: (c: Category) => void;
  onBack: () => void;
  accentClass: string;
}) {
  return (
    <div className="space-y-1.5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <button type="button" onClick={onBack} className="hover:text-slate-600 dark:hover:text-slate-200">
          {path.length === 0 ? "Kategoriler" : path.map((p) => p.name).join(" › ")}
        </button>
        {path.length > 0 && (
          <button type="button" onClick={onBack} className="ml-auto text-[10px] underline hover:text-slate-600">
            ‹ Geri
          </button>
        )}
      </div>
      {/* Category buttons */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${accentClass}`}
          >
            {c.name}
            {c.children.length > 0 && <span className="ml-1 opacity-60">›</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Diet Item Picker (hierarchical) ──────────────────────────────────────────

function DietItemPicker({
  token,
  selected,
  onChange,
}: {
  token: string;
  selected: DietItem[];
  onChange: (items: DietItem[]) => void;
}) {
  const [allItems, setAllItems] = useState<DietItem[]>([]);
  const [rootCats, setRootCats] = useState<Category[]>([]);
  const [catPath, setCatPath] = useState<Category[]>([]); // breadcrumb stack
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.admin.dietItems.list(token).then(setAllItems).catch(() => {});
    api.admin.categoryTree(token, "food").then(setRootCats).catch(() => {});
  }, [token]);

  const toggle = (item: DietItem) => {
    const exists = selected.find((s) => s.id === item.id);
    onChange(exists ? selected.filter((s) => s.id !== item.id) : [...selected, item]);
  };

  // current level categories
  const currentCat = catPath[catPath.length - 1] ?? null;
  const currentChildren = currentCat ? currentCat.children : rootCats;
  const hasChildren = currentChildren.length > 0;

  // items visible at this level (direct children of currentCat, or uncategorised if root)
  const visibleItems = query.trim()
    ? allItems.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    : allItems.filter((d) => {
        if (!currentCat) return !d.category; // root → uncategorised
        return d.category === currentCat.id;
      });

  const handleSelectCat = (c: Category) => {
    setCatPath((p) => [...p, c]);
    setQuery("");
  };

  const handleBack = () => {
    setCatPath((p) => p.slice(0, -1));
    setQuery("");
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s.id} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {s.name}
              <button type="button" onClick={() => toggle(s)} className="leading-none hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Search bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="İsme göre ara…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      {/* Category nav — hidden when searching */}
      {!query.trim() && hasChildren && (
        <CategoryBreadcrumb
          categories={currentChildren}
          path={catPath}
          onSelect={handleSelectCat}
          onBack={handleBack}
          accentClass="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300"
        />
      )}
      {!query.trim() && !hasChildren && catPath.length > 0 && (
        <button type="button" onClick={handleBack} className="text-[11px] text-slate-400 underline hover:text-slate-600">
          ‹ Geri
        </button>
      )}

      {/* Item list */}
      {(query.trim() || !hasChildren) && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {visibleItems.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {query.trim() ? "Sonuç bulunamadı" : "Bu kategoride besin yok"}
            </p>
          ) : (
            visibleItems.slice(0, 30).map((d) => {
              const isSel = !!selected.find((s) => s.id === d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggle(d)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${isSel ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                >
                  <span className={`font-medium ${isSel ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100"}`}>
                    {isSel && "✓ "}{d.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{d.calories} kcal{d.portion ? ` · ${d.portion}` : ""}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MealEntryForm({
  token,
  onSave,
  onCancel,
}: {
  token: string;
  onSave: (data: Partial<ProgramMealEntry>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ meal_type: "sabah", notification_time: "", description: "" });
  const [selectedItems, setSelectedItems] = useState<DietItem[]>([]);
  const [saving, setSaving] = useState(false);

  const totalCalories = selectedItems.reduce((sum, d) => sum + (d.calories || 0), 0);

  const handle = async () => {
    if (selectedItems.length === 0 && !form.description.trim()) return;
    setSaving(true);
    try {
      await onSave({
        meal_type: form.meal_type as ProgramMealEntry["meal_type"],
        notification_time: form.notification_time || null,
        diet_item_ids: selectedItems.map((d) => d.id),
        description: form.description,
        calories: totalCalories || null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Öğün *</label>
          <CustomSelect
            value={form.meal_type}
            onChange={(v) => setForm((f) => ({ ...f, meal_type: v as string }))}
            options={MEAL_TYPE_OPTIONS}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Bildirim Saati</label>
          <input
            type="time"
            value={form.notification_time}
            onChange={(e) => setForm((f) => ({ ...f, notification_time: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        {totalCalories > 0 && (
          <div className="flex items-end">
            <span className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {totalCalories} kcal
            </span>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Besinler (kütüphaneden seç)</label>
        <DietItemPicker token={token} selected={selectedItems} onChange={setSelectedItems} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Ek Not (opsiyonel)</label>
        <textarea rows={2} value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Porsiyon notu, hazırlık talimatı…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handle} disabled={saving || (selectedItems.length === 0 && !form.description.trim())}
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
    session_type: (initial?.session_type ?? "group") as "group" | "private",
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
          <label className="mb-1 block text-xs font-semibold text-slate-500">Ders Türü</label>
          <CustomSelect
            value={form.session_type}
            onChange={(v) => setForm((f) => ({ ...f, session_type: v as "group" | "private" }))}
            options={[
              { value: "group", label: "🧑‍🤝‍🧑 Grup Dersi" },
              { value: "private", label: "👤 Özel Ders" },
            ]}
          />
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

  // ── Meal handlers ──
  const handleCreateMeal = async (dayId: number, data: Partial<ProgramMealEntry>) => {
    await api.admin.createProgramMeal(token, dayId, data);
    setOpenId(null);
    await load();
  };

  const handleDeleteMeal = async (meal: ProgramMealEntry) => {
    const ok = await confirm({ title: "Öğünü kaldır", message: `"${meal.meal_type_label}" öğünü kaldırılacak.`, confirmLabel: "Kaldır" });
    if (!ok) return;
    await api.admin.deleteProgramMeal(token, meal.id);
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
                                  <span className="ml-1 text-xs text-slate-400">{day.items.length} egzersiz · {day.meal_entries.length} öğün</span>
                                </button>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => { if (!isDayExpanded) toggleDay(day.id); setOpenId(openId === newItemKey ? null : newItemKey); }}
                                    className="rounded-full border border-emerald-400/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50">
                                    + Egzersiz
                                  </button>
                                  <button type="button" onClick={() => { if (!isDayExpanded) toggleDay(day.id); setOpenId(openId === `new-meal-${day.id}` ? null : `new-meal-${day.id}`); }}
                                    className="rounded-full border border-orange-400/40 px-2.5 py-1 text-[11px] font-semibold text-orange-600 hover:bg-orange-50 dark:text-orange-400">
                                    + Öğün
                                  </button>
                                  <button type="button" onClick={() => handleDeleteDay(day, prog.name)}
                                    className="rounded-full border border-red-300/40 px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50">
                                    Sil
                                  </button>
                                </div>
                              </div>

                              {/* Day content */}
                              {isDayExpanded && (
                                <div className="border-t border-slate-100 px-4 pb-3 pt-2 dark:border-slate-800 space-y-3">

                                  {/* Egzersizler */}
                                  <div>
                                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">🏋️ Egzersizler</p>
                                    {openId === newItemKey && (
                                      <div className="mb-2">
                                        <ItemForm
                                          token={token}
                                          exercises={exercises}
                                          onSave={(data) => handleCreateItem(day.id, data)}
                                          onCancel={() => setOpenId(null)}
                                        />
                                      </div>
                                    )}
                                    {day.items.length === 0 ? (
                                      <p className="text-xs italic text-slate-400">Egzersiz eklenmedi.</p>
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

                                  {/* Öğünler */}
                                  <div>
                                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">🍽️ Öğünler</p>
                                    {openId === `new-meal-${day.id}` && (
                                      <div className="mb-2">
                                        <MealEntryForm
                                          token={token}
                                          onSave={(data) => handleCreateMeal(day.id, data)}
                                          onCancel={() => setOpenId(null)}
                                        />
                                      </div>
                                    )}
                                    {day.meal_entries.length === 0 ? (
                                      <p className="text-xs italic text-slate-400">Öğün eklenmedi.</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {day.meal_entries.map((meal) => (
                                          <div key={meal.id} className="flex items-start justify-between rounded-lg bg-orange-50/60 px-3 py-2 dark:bg-orange-950/20">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                <span className="text-sm">{MEAL_TYPE_EMOJI[meal.meal_type]}</span>
                                                <span className="text-xs font-bold text-orange-700 dark:text-orange-400">{meal.meal_type_label}</span>
                                                {meal.notification_time && (
                                                  <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    🕐 {meal.notification_time.slice(0, 5)}
                                                  </span>
                                                )}
                                                {meal.calories && <span className="text-xs text-slate-400">{meal.calories} kcal</span>}
                                              </div>
                                              {meal.diet_items && meal.diet_items.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                  {meal.diet_items.map((di) => (
                                                    <span key={di.id} className="rounded-full bg-white/80 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-slate-800 dark:border-orange-800/40 dark:text-orange-400">
                                                      {di.name} · {di.calories} kcal
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                              {meal.description && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">{meal.description}</p>}
                                            </div>
                                            <button type="button" onClick={() => handleDeleteMeal(meal)}
                                              className="ml-3 shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-100">
                                              Kaldır
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
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
                        <Badge className={pkg.session_type === "private" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}>
                          {pkg.session_type === "private" ? "👤 Özel Ders" : "🧑‍🤝‍🧑 Grup"}
                        </Badge>
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
