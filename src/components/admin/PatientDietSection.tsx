"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type DietItem,
  type DietProgram,
  type DietDay,
  type DietMeal,
  type DietMealItem,
} from "@/lib/api";

const MEAL_TYPES = [
  { value: "sabah", label: "Kahvaltı" },
  { value: "ara1", label: "Ara Öğün 1" },
  { value: "ogle", label: "Öğle" },
  { value: "ara2", label: "Ara Öğün 2" },
  { value: "aksam", label: "Akşam" },
  { value: "gece", label: "Gece" },
  { value: "serbest", label: "Serbest Öğün" },
] as const;

interface Props {
  patientId: number;
  onMessage: (msg: string, type: "success" | "error") => void;
}

/* ---- draft types (local form state) ---- */
interface DraftItem {
  _key: string;
  diet_item_id: number | null;
  name: string;
  quantity: number;
  calories: number;
  note: string;
}

interface DraftMeal {
  _key: string;
  meal_type: string;
  meal_time: string;
  description: string;
  items: DraftItem[];
}

interface DraftDay {
  _key: string;
  day_number: number;
  label: string;
  description: string;
  meals: DraftMeal[];
}

interface DraftProgram {
  title: string;
  goals: string;
  feeding_notes: string;
  duration_days: number;
  is_active: boolean;
  days: DraftDay[];
}

let _key = 0;
const nextKey = () => String(++_key);

const emptyItem = (): DraftItem => ({
  _key: nextKey(), diet_item_id: null, name: "", quantity: 1, calories: 0, note: "",
});

const emptyMeal = (): DraftMeal => ({
  _key: nextKey(), meal_type: "sabah", meal_time: "", description: "", items: [emptyItem()],
});

const emptyDay = (dayNumber: number): DraftDay => ({
  _key: nextKey(), day_number: dayNumber, label: "", description: "", meals: [emptyMeal()],
});

const emptyProgram = (days = 7): DraftProgram => ({
  title: "",
  goals: "",
  feeding_notes: "",
  duration_days: days,
  is_active: true,
  days: Array.from({ length: days }, (_, i) => emptyDay(i + 1)),
});

function programToDraft(p: DietProgram): DraftProgram {
  return {
    title: p.title,
    goals: p.goals,
    feeding_notes: p.feeding_notes,
    duration_days: p.duration_days,
    is_active: p.is_active,
    days: p.days.map((d) => ({
      _key: nextKey(),
      day_number: d.day_number,
      label: d.label,
      description: d.description,
      meals: d.meals.map((m) => ({
        _key: nextKey(),
        meal_type: m.meal_type,
        meal_time: m.meal_time,
        description: m.description,
        items: m.items.length
          ? m.items.map((it) => ({
              _key: nextKey(),
              diet_item_id: it.diet_item_id ?? null,
              name: it.name,
              quantity: it.quantity,
              calories: it.calories,
              note: it.note,
            }))
          : [emptyItem()],
      })),
    })),
  };
}

function draftToPayload(draft: DraftProgram) {
  return {
    title: draft.title,
    goals: draft.goals,
    feeding_notes: draft.feeding_notes,
    duration_days: draft.duration_days,
    is_active: draft.is_active,
    days: draft.days.map((d) => ({
      day_number: d.day_number,
      label: d.label,
      description: d.description,
      meals: d.meals.map((m, mi) => ({
        meal_type: m.meal_type,
        meal_time: m.meal_time,
        description: m.description,
        order: mi,
        items: m.items
          .filter((it) => it.name.trim())
          .map((it) => ({
            diet_item_id: it.diet_item_id || null,
            name: it.name,
            quantity: it.quantity,
            calories: it.calories,
            note: it.note,
          })),
      })),
    })),
  };
}

export function PatientDietSection({ patientId, onMessage }: Props) {
  const confirm = useConfirm();
  const [programs, setPrograms] = useState<DietProgram[]>([]);
  const [allItems, setAllItems] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // view state
  const [mode, setMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewProgram, setViewProgram] = useState<DietProgram | null>(null);
  const [viewDayIdx, setViewDayIdx] = useState(0);

  // form
  const [draft, setDraft] = useState<DraftProgram>(emptyProgram());
  const [activeDayKey, setActiveDayKey] = useState<string>("");

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [progs, items] = await Promise.all([
        api.admin.dietPrograms.list(token, patientId),
        api.admin.dietItems.list(token),
      ]);
      setPrograms(progs);
      setAllItems(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  const openCreate = () => {
    const d = emptyProgram(7);
    setDraft(d);
    setActiveDayKey(d.days[0]._key);
    setEditingId(null);
    setMode("create");
  };

  const openEdit = (prog: DietProgram) => {
    const d = programToDraft(prog);
    setDraft(d);
    setActiveDayKey(d.days[0]._key);
    setEditingId(prog.id);
    setMode("edit");
  };

  const openView = (prog: DietProgram) => {
    setViewProgram(prog);
    setViewDayIdx(0);
    setMode("view");
  };

  /* ---------- draft mutators ---------- */
  const setDraftField = <K extends keyof DraftProgram>(k: K, v: DraftProgram[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const changeDurationDays = (n: number) => {
    const count = Math.max(1, Math.min(30, n));
    setDraft((p) => {
      const existing = p.days.slice(0, count);
      const extra = Array.from({ length: Math.max(0, count - existing.length) }, (_, i) =>
        emptyDay(existing.length + i + 1)
      );
      const days = [...existing, ...extra];
      return { ...p, duration_days: count, days };
    });
  };

  const activeDay = draft.days.find((d) => d._key === activeDayKey) ?? draft.days[0];

  const updateDay = (key: string, patch: Partial<DraftDay>) =>
    setDraft((p) => ({ ...p, days: p.days.map((d) => d._key === key ? { ...d, ...patch } : d) }));

  const addMeal = (dayKey: string) =>
    updateDay(dayKey, { meals: [...(activeDay.meals), emptyMeal()] });

  const removeMeal = (dayKey: string, mealKey: string) =>
    updateDay(dayKey, { meals: activeDay.meals.filter((m) => m._key !== mealKey) });

  const updateMeal = (dayKey: string, mealKey: string, patch: Partial<DraftMeal>) =>
    updateDay(dayKey, {
      meals: activeDay.meals.map((m) => m._key === mealKey ? { ...m, ...patch } : m),
    });

  const addItemToMeal = (dayKey: string, mealKey: string) =>
    updateMeal(dayKey, mealKey, {
      items: [...(activeDay.meals.find((m) => m._key === mealKey)?.items ?? []), emptyItem()],
    });

  const removeItem = (dayKey: string, mealKey: string, itemKey: string) => {
    const meal = activeDay.meals.find((m) => m._key === mealKey);
    if (!meal) return;
    updateMeal(dayKey, mealKey, { items: meal.items.filter((it) => it._key !== itemKey) });
  };

  const updateItem = (dayKey: string, mealKey: string, itemKey: string, patch: Partial<DraftItem>) => {
    const meal = activeDay.meals.find((m) => m._key === mealKey);
    if (!meal) return;
    updateMeal(dayKey, mealKey, {
      items: meal.items.map((it) => it._key === itemKey ? { ...it, ...patch } : it),
    });
  };

  const pickLibraryItem = (dayKey: string, mealKey: string, itemKey: string, dietItemId: number) => {
    const found = allItems.find((i) => i.id === dietItemId);
    if (!found) return;
    updateItem(dayKey, mealKey, itemKey, {
      diet_item_id: found.id,
      name: found.name,
      calories: found.calories,
    });
  };

  /* ---------- save ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) { onMessage("Program başlığı gerekli.", "error"); return; }
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      const payload = draftToPayload(draft);
      if (editingId) {
        await api.admin.dietPrograms.update(token, patientId, editingId, payload);
        onMessage("Program güncellendi.", "success");
      } else {
        await api.admin.dietPrograms.create(token, patientId, payload);
        onMessage("Program oluşturuldu.", "success");
      }
      setMode("list");
      load();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Hata.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prog: DietProgram) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: "Programı sil",
      message: `"${prog.title}" programı kalıcı olarak silinecek.`,
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.admin.dietPrograms.delete(token, patientId, prog.id);
      onMessage("Silindi.", "success");
      load();
    } catch {
      onMessage("Silinemedi.", "error");
    }
  };

  const toggleActive = async (prog: DietProgram) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.dietPrograms.update(token, patientId, prog.id, { is_active: !prog.is_active });
      load();
    } catch {
      onMessage("Durum güncellenemedi.", "error");
    }
  };

  /* ===================== RENDER ===================== */

  if (mode === "view" && viewProgram) {
    const days = viewProgram.days ?? [];
    const day = days[viewDayIdx];
    return (
      <div className="space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button onClick={() => setMode("list")} className="mb-1 text-xs text-blue-500 hover:underline">← Listeye Dön</button>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{viewProgram.title}</h2>
              {viewProgram.goals && <p className="mt-0.5 text-sm text-slate-500">{viewProgram.goals}</p>}
            </div>
            <button
              onClick={() => openEdit(viewProgram)}
              className="shrink-0 rounded-full border border-blue-400/40 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400"
            >
              Düzenle
            </button>
          </div>
        </GlassCard>

        {/* Day tabs */}
        <div className="flex flex-wrap gap-2 px-1">
          {days.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setViewDayIdx(idx)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                viewDayIdx === idx
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200/60 bg-white/60 text-slate-600 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"
              }`}
            >
              Gün {d.day_number}{d.label ? ` — ${d.label}` : ""}
            </button>
          ))}
        </div>

        {day && (
          <GlassCard className="p-5 sm:p-6">
            {day.description && (
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{day.description}</p>
            )}
            <div className="space-y-4">
              {day.meals.map((meal) => {
                const totalCal = meal.total_calories ?? meal.items.reduce((s, it) => s + (it.calories ?? 0), 0);
                const mealLabel = MEAL_TYPES.find((mt) => mt.value === meal.meal_type)?.label ?? meal.meal_type;
                return (
                  <div key={meal.id} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {mealLabel}
                      </span>
                      {meal.meal_time && (
                        <span className="text-xs text-slate-500">🕐 {meal.meal_time}</span>
                      )}
                      {totalCal > 0 && (
                        <span className="ml-auto text-xs font-bold text-orange-600 dark:text-orange-400">{totalCal} kcal</span>
                      )}
                    </div>
                    {meal.description && (
                      <p className="mb-2 text-xs text-slate-500">{meal.description}</p>
                    )}
                    {meal.items.length > 0 && (
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
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    );
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button onClick={() => setMode("list")} className="mb-1 text-xs text-blue-500 hover:underline">← İptal</button>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {mode === "edit" ? "Programı Düzenle" : "Yeni Diyet Programı"}
              </h2>
            </div>
          </div>
        </GlassCard>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Program meta */}
          <GlassCard className="p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Program Bilgileri</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Başlık *</label>
                <input
                  required
                  value={draft.title}
                  onChange={(e) => setDraftField("title", e.target.value)}
                  placeholder="örn: 7 Günlük Zayıflama Programı"
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Süre (Gün)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.duration_days}
                  onChange={(e) => changeDurationDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hedefler</label>
                <input
                  value={draft.goals}
                  onChange={(e) => setDraftField("goals", e.target.value)}
                  placeholder="örn: Yağ kaybı, kas koruma"
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Beslenme Notları</label>
                <input
                  value={draft.feeding_notes}
                  onChange={(e) => setDraftField("feeding_notes", e.target.value)}
                  placeholder="örn: Bol su iç, şeker tüketme"
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
            </div>
          </GlassCard>

          {/* Day tabs */}
          <GlassCard className="p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Günler</p>
            <div className="flex flex-wrap gap-2">
              {draft.days.map((d) => (
                <button
                  key={d._key}
                  type="button"
                  onClick={() => setActiveDayKey(d._key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeDayKey === d._key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200/60 bg-white/60 text-slate-600 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"
                  }`}
                >
                  Gün {d.day_number}{d.label ? ` — ${d.label}` : ""}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Active day editor */}
          {activeDay && (
            <GlassCard className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gün {activeDay.day_number}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Etiket (isteğe bağlı)</label>
                  <input
                    value={activeDay.label}
                    onChange={(e) => updateDay(activeDay._key, { label: e.target.value })}
                    placeholder="örn: Düşük Karbonhidrat"
                    className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Açıklama</label>
                  <input
                    value={activeDay.description}
                    onChange={(e) => updateDay(activeDay._key, { description: e.target.value })}
                    placeholder="Gün notu…"
                    className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-4">
                {activeDay.meals.map((meal, mealIdx) => (
                  <div key={meal._key} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">Öğün {mealIdx + 1}</span>
                      {activeDay.meals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeal(activeDay._key, meal._key)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Öğünü Kaldır
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 mb-4">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Öğün Tipi</label>
                        <select
                          value={meal.meal_type}
                          onChange={(e) => updateMeal(activeDay._key, meal._key, { meal_type: e.target.value })}
                          className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                        >
                          {MEAL_TYPES.map((mt) => (
                            <option key={mt.value} value={mt.value}>{mt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Saat</label>
                        <input
                          type="time"
                          value={meal.meal_time}
                          onChange={(e) => updateMeal(activeDay._key, meal._key, { meal_time: e.target.value })}
                          className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Açıklama</label>
                        <input
                          value={meal.description}
                          onChange={(e) => updateMeal(activeDay._key, meal._key, { description: e.target.value })}
                          placeholder="Öğün notu…"
                          className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {meal.items.map((item) => (
                        <div key={item._key} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50/60 px-3 py-2.5 dark:bg-slate-800/30">
                          {/* Library picker */}
                          <select
                            value={item.diet_item_id ?? ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (v) pickLibraryItem(activeDay._key, meal._key, item._key, v);
                              else updateItem(activeDay._key, meal._key, item._key, { diet_item_id: null });
                            }}
                            className="rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                          >
                            <option value="">— Kütüphaneden seç —</option>
                            {allItems.map((di) => (
                              <option key={di.id} value={di.id}>{di.name} ({di.calories} kcal)</option>
                            ))}
                          </select>

                          {/* Name (free text or auto-filled) */}
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(activeDay._key, meal._key, item._key, { name: e.target.value })}
                            placeholder="Besin adı"
                            className="min-w-0 flex-1 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                          />

                          {/* Quantity */}
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={item.quantity}
                            onChange={(e) => updateItem(activeDay._key, meal._key, item._key, { quantity: Number(e.target.value) })}
                            className="w-16 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                          />
                          <span className="text-xs text-slate-400">porsiyon</span>

                          {/* Calories */}
                          <input
                            type="number"
                            min={0}
                            value={item.calories}
                            onChange={(e) => updateItem(activeDay._key, meal._key, item._key, { calories: Number(e.target.value) })}
                            className="w-20 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                          />
                          <span className="text-xs text-slate-400">kcal</span>

                          {/* Note */}
                          <input
                            value={item.note}
                            onChange={(e) => updateItem(activeDay._key, meal._key, item._key, { note: e.target.value })}
                            placeholder="Not"
                            className="w-24 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(activeDay._key, meal._key, item._key)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addItemToMeal(activeDay._key, meal._key)}
                      className="mt-2 rounded-full border border-slate-300/60 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-400"
                    >
                      + Besin Ekle
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addMeal(activeDay._key)}
                  className="w-full rounded-xl border border-dashed border-blue-300/60 py-2.5 text-sm font-medium text-blue-500 hover:bg-blue-50/40 dark:border-blue-700/50 dark:hover:bg-blue-900/20"
                >
                  + Öğün Ekle
                </button>
              </div>
            </GlassCard>
          )}

          <div className="flex gap-3 pb-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : mode === "edit" ? "Güncelle" : "Programı Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---- LIST ---- */
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Diyet Programları</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Çok günlü beslenme planları oluşturun ve yönetin.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            + Yeni Program
          </button>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : programs.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz diyet programı oluşturulmamış.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {programs.map((prog) => (
            <GlassCard key={prog.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{prog.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${prog.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      {prog.is_active ? "Aktif" : "Pasif"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {prog.duration_days} gün
                    </span>
                  </div>
                  {prog.goals && <p className="mt-1 text-xs text-slate-500">{prog.goals}</p>}
                  {prog.feeding_notes && <p className="mt-0.5 text-xs text-slate-400 italic">{prog.feeding_notes}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(prog.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    {prog.assigned_by_name && ` · ${prog.assigned_by_name}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => openView(prog)}
                    className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300"
                  >
                    Görüntüle
                  </button>
                  <button
                    onClick={() => openEdit(prog)}
                    className="rounded-full border border-blue-400/40 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => toggleActive(prog)}
                    className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-400"
                  >
                    {prog.is_active ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                  <button
                    onClick={() => handleDelete(prog)}
                    className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400"
                  >
                    Sil
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
