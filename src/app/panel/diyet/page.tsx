"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CategoryTree } from "@/components/ui/CategoryTree";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type Category, type DietItem, type DietProgram } from "@/lib/api";

/* ========================================================
   MEAL TYPES
   ======================================================== */
const MEAL_TYPES = [
  { value: "sabah",   label: "Kahvaltı" },
  { value: "ara1",    label: "Ara Öğün 1" },
  { value: "ogle",    label: "Öğle" },
  { value: "ara2",    label: "Ara Öğün 2" },
  { value: "aksam",   label: "Akşam" },
  { value: "gece",    label: "Gece" },
  { value: "serbest", label: "Serbest Öğün" },
];

/* ========================================================
   DRAFT TYPES
   ======================================================== */
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

let _k = 0;
const nk = () => String(++_k);

const emptyItem = (): DraftItem => ({ _key: nk(), diet_item_id: null, name: "", quantity: 1, calories: 0, note: "" });
const emptyMeal = (): DraftMeal => ({ _key: nk(), meal_type: "sabah", meal_time: "", description: "", items: [emptyItem()] });
const emptyDay = (n: number): DraftDay => ({ _key: nk(), day_number: n, label: "", description: "", meals: [emptyMeal()] });
const emptyProgram = (d = 7): DraftProgram => ({
  title: "", goals: "", feeding_notes: "", duration_days: d, is_active: true,
  days: Array.from({ length: d }, (_, i) => emptyDay(i + 1)),
});

function programToDraft(p: DietProgram): DraftProgram {
  return {
    title: p.title, goals: p.goals, feeding_notes: p.feeding_notes,
    duration_days: p.duration_days, is_active: p.is_active,
    days: p.days.map((d) => ({
      _key: nk(), day_number: d.day_number, label: d.label, description: d.description,
      meals: d.meals.map((m) => ({
        _key: nk(), meal_type: m.meal_type, meal_time: m.meal_time, description: m.description,
        items: m.items.length
          ? m.items.map((it) => ({ _key: nk(), diet_item_id: it.diet_item_id ?? null, name: it.name, quantity: it.quantity, calories: it.calories, note: it.note }))
          : [emptyItem()],
      })),
    })),
  };
}

function draftToPayload(draft: DraftProgram) {
  return {
    title: draft.title, goals: draft.goals, feeding_notes: draft.feeding_notes,
    duration_days: draft.duration_days, is_active: draft.is_active,
    days: draft.days.map((d) => ({
      day_number: d.day_number, label: d.label, description: d.description,
      meals: d.meals.map((m, mi) => ({
        meal_type: m.meal_type, meal_time: m.meal_time, description: m.description, order: mi,
        items: m.items.filter((it) => it.name.trim()).map((it) => ({
          diet_item_id: it.diet_item_id || null, name: it.name, quantity: it.quantity, calories: it.calories, note: it.note,
        })),
      })),
    })),
  };
}

/* ========================================================
   INPUT HELPERS
   ======================================================== */
const cls = "w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100";
const smCls = "rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100";

/* ========================================================
   MAIN PAGE
   ======================================================== */
const EMPTY_FOOD = { name: "", category_id: null as number | null, calories: 0, protein: 0, carbs: 0, fat: 0, portion: "", is_active: true };

export default function DiyetPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<"library" | "programs">("programs");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const notify = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Diyet Yönetimi</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Programlar oluşturun, besin kütüphanesini düzenleyin.</p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/60 dark:border-slate-700/50">
        {([["programs", "Beslenme Programları"], ["library", "Besin Kütüphanesi"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "programs" && <ProgramsTab notify={notify} />}
      {tab === "library" && <LibraryTab notify={notify} />}
    </div>
  );
}

/* ========================================================
   PROGRAMS TAB
   ======================================================== */
function CategoryDialog({ onClose, onSave, initial }: { onClose: () => void; onSave: (name: string) => Promise<void>; initial: string }) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try { await onSave(name.trim()); onClose(); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{initial ? "Kategoriyi Yeniden Adlandır" : "Yeni Kategori"}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-700/80 dark:text-slate-100" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">İptal</button>
            <button type="submit" disabled={saving || !name.trim()} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgramsTab({ notify }: { notify: (t: string, ok?: boolean) => void }) {
  const confirm = useConfirm();
  const [programs, setPrograms] = useState<DietProgram[]>([]);
  const [allItems, setAllItems] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewProgram, setViewProgram] = useState<DietProgram | null>(null);
  const [viewDayIdx, setViewDayIdx] = useState(0);
  const [draft, setDraft] = useState<DraftProgram>(emptyProgram());
  const [activeDayKey, setActiveDayKey] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catDialog, setCatDialog] = useState<{ mode: "add-root" | "add-child" | "rename"; parentId?: number; cat?: Category } | null>(null);
  const [draftCategoryId, setDraftCategoryId] = useState<number | null>(null);

  const loadCategories = () => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.categoryTree(token, "diet").then(setCategories).catch(() => {});
  };

  const load = async (catId?: number | null) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [progs, items] = await Promise.all([
        api.admin.dietPrograms.list(token, catId),
        api.admin.dietItems.list(token),
      ]);
      setPrograms(progs);
      setAllItems(items);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { load(selectedCategoryId); }, [selectedCategoryId]);

  const flattenCategories = (nodes: Category[], prefix = ""): { value: string; label: string }[] => {
    const result: { value: string; label: string }[] = [];
    for (const n of nodes) {
      result.push({ value: String(n.id), label: prefix + n.name });
      result.push(...flattenCategories(n.children, prefix + "  "));
    }
    return result;
  };
  const categoryOptions = [{ value: "", label: "Kategorisiz" }, ...flattenCategories(categories)];
  const findCatName = (nodes: Category[], id: number): string | null => {
    for (const n of nodes) {
      if (n.id === id) return n.name;
      const r = findCatName(n.children, id);
      if (r) return r;
    }
    return null;
  };

  const openCreate = () => {
    const d = emptyProgram(7);
    setDraft(d); setActiveDayKey(d.days[0]._key); setEditingId(null);
    setDraftCategoryId(selectedCategoryId); setMode("create");
  };

  const openEdit = (prog: DietProgram) => {
    const d = programToDraft(prog);
    setDraft(d); setActiveDayKey(d.days[0]._key); setEditingId(prog.id);
    setDraftCategoryId(prog.category); setMode("edit");
  };

  const openView = (prog: DietProgram) => { setViewProgram(prog); setViewDayIdx(0); setMode("view"); };

  /* --- draft mutators --- */
  const setF = <K extends keyof DraftProgram>(k: K, v: DraftProgram[K]) => setDraft((p) => ({ ...p, [k]: v }));

  const changeDays = (n: number) => {
    const count = Math.max(1, Math.min(30, n));
    setDraft((p) => {
      const existing = p.days.slice(0, count);
      const extra = Array.from({ length: Math.max(0, count - existing.length) }, (_, i) => emptyDay(existing.length + i + 1));
      return { ...p, duration_days: count, days: [...existing, ...extra] };
    });
  };

  const activeDay = draft.days.find((d) => d._key === activeDayKey) ?? draft.days[0];

  const updDay = (key: string, patch: Partial<DraftDay>) =>
    setDraft((p) => ({ ...p, days: p.days.map((d) => d._key === key ? { ...d, ...patch } : d) }));

  const updMeal = (dayKey: string, mealKey: string, patch: Partial<DraftMeal>) => {
    const day = draft.days.find((d) => d._key === dayKey);
    if (!day) return;
    updDay(dayKey, { meals: day.meals.map((m) => m._key === mealKey ? { ...m, ...patch } : m) });
  };

  const updItem = (dayKey: string, mealKey: string, itemKey: string, patch: Partial<DraftItem>) => {
    const day = draft.days.find((d) => d._key === dayKey);
    if (!day) return;
    const meal = day.meals.find((m) => m._key === mealKey);
    if (!meal) return;
    updMeal(dayKey, mealKey, { items: meal.items.map((it) => it._key === itemKey ? { ...it, ...patch } : it) });
  };

  const pickLibItem = (dayKey: string, mealKey: string, itemKey: string, dietItemId: number | "") => {
    if (!dietItemId) { updItem(dayKey, mealKey, itemKey, { diet_item_id: null }); return; }
    const found = allItems.find((i) => i.id === dietItemId);
    if (found) updItem(dayKey, mealKey, itemKey, { diet_item_id: found.id, name: found.name, calories: found.calories });
  };

  const addMeal = (dayKey: string) => {
    const day = draft.days.find((d) => d._key === dayKey);
    if (!day) return;
    updDay(dayKey, { meals: [...day.meals, emptyMeal()] });
  };

  const removeMeal = (dayKey: string, mealKey: string) => {
    const day = draft.days.find((d) => d._key === dayKey);
    if (!day) return;
    updDay(dayKey, { meals: day.meals.filter((m) => m._key !== mealKey) });
  };

  const addItem = (dayKey: string, mealKey: string) => {
    const day = draft.days.find((d) => d._key === dayKey);
    const meal = day?.meals.find((m) => m._key === mealKey);
    if (!meal) return;
    updMeal(dayKey, mealKey, { items: [...meal.items, emptyItem()] });
  };

  const removeItem = (dayKey: string, mealKey: string, itemKey: string) => {
    const day = draft.days.find((d) => d._key === dayKey);
    const meal = day?.meals.find((m) => m._key === mealKey);
    if (!meal) return;
    updMeal(dayKey, mealKey, { items: meal.items.filter((it) => it._key !== itemKey) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) { notify("Program başlığı gerekli.", false); return; }
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      const payload = { ...draftToPayload(draft), category: draftCategoryId };
      if (editingId) {
        await api.admin.dietPrograms.update(token, editingId, payload);
        notify("Program güncellendi.");
      } else {
        await api.admin.dietPrograms.create(token, payload);
        notify("Program oluşturuldu.");
      }
      setMode("list"); load(selectedCategoryId);
    } catch (err) { notify(err instanceof Error ? err.message : "Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (prog: DietProgram) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Programı Sil", message: `"${prog.title}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.dietPrograms.delete(token, prog.id); notify("Silindi."); load(selectedCategoryId); }
    catch { notify("Silinemedi.", false); }
  };

  /* ---- VIEW MODE ---- */
  if (mode === "view" && viewProgram) {
    const days = viewProgram.days ?? [];
    const day = days[viewDayIdx];
    return (
      <div className="space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <button onClick={() => setMode("list")} className="mb-2 text-xs text-blue-500 hover:underline">← Listeye Dön</button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{viewProgram.title}</h2>
              {viewProgram.goals && <p className="mt-0.5 text-sm text-slate-500">{viewProgram.goals}</p>}
              {viewProgram.feeding_notes && <p className="mt-0.5 text-xs text-slate-400 italic">{viewProgram.feeding_notes}</p>}
            </div>
            <button onClick={() => openEdit(viewProgram)} className="shrink-0 rounded-full border border-blue-400/40 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400">
              Düzenle
            </button>
          </div>
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
                const mealLabel = MEAL_TYPES.find((mt) => mt.value === meal.meal_type)?.label ?? meal.meal_type;
                const total = meal.total_calories ?? meal.items.reduce((s, it) => s + (it.calories ?? 0), 0);
                return (
                  <div key={meal.id} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50">
                    <div className="mb-3 flex items-center gap-3 flex-wrap">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{mealLabel}</span>
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

  /* ---- CREATE / EDIT MODE ---- */
  if (mode === "create" || mode === "edit") {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <button type="button" onClick={() => setMode("list")} className="mb-2 text-xs text-blue-500 hover:underline">← İptal</button>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {mode === "edit" ? "Programı Düzenle" : "Yeni Beslenme Programı"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Başlık *</label>
              <input required value={draft.title} onChange={(e) => setF("title", e.target.value)} placeholder="örn: 7 Günlük Zayıflama Programı" className={cls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</label>
              <CustomSelect
                value={draftCategoryId ? String(draftCategoryId) : ""}
                onChange={(v) => setDraftCategoryId(v ? Number(v) : null)}
                options={categoryOptions}
                placeholder="Kategorisiz"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Süre (Gün)</label>
              <input type="number" min={1} max={30} value={draft.duration_days} onChange={(e) => changeDays(Number(e.target.value))} className={cls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hedefler</label>
              <input value={draft.goals} onChange={(e) => setF("goals", e.target.value)} placeholder="örn: Yağ kaybı, kas koruma" className={cls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Beslenme Notları</label>
              <input value={draft.feeding_notes} onChange={(e) => setF("feeding_notes", e.target.value)} placeholder="örn: 20:00 sonrası sadece su" className={cls} />
            </div>
          </div>
        </GlassCard>

        {/* Day selector */}
        <GlassCard className="p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Günler</p>
          <div className="flex flex-wrap gap-2">
            {draft.days.map((d) => (
              <button key={d._key} type="button" onClick={() => setActiveDayKey(d._key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${activeDayKey === d._key ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200/60 bg-white/60 text-slate-600 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"}`}>
                Gün {d.day_number}{d.label ? ` — ${d.label}` : ""}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Active day editor */}
        {activeDay && (
          <GlassCard className="p-5 sm:p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gün {activeDay.day_number}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Etiket</label>
                <input value={activeDay.label} onChange={(e) => updDay(activeDay._key, { label: e.target.value })} placeholder="örn: Düşük Karbonhidrat" className={cls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gün Notu</label>
                <input value={activeDay.description} onChange={(e) => updDay(activeDay._key, { description: e.target.value })} placeholder="Gün açıklaması…" className={cls} />
              </div>
            </div>

            <div className="space-y-4">
              {activeDay.meals.map((meal, mealIdx) => (
                <div key={meal._key} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Öğün {mealIdx + 1}</span>
                    {activeDay.meals.length > 1 && (
                      <button type="button" onClick={() => removeMeal(activeDay._key, meal._key)} className="text-xs text-red-400 hover:text-red-600">Öğünü Kaldır</button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Öğün Tipi</label>
                      <CustomSelect<string>
                        value={meal.meal_type}
                        onChange={(v) => updMeal(activeDay._key, meal._key, { meal_type: v })}
                        options={MEAL_TYPES.map((mt) => ({ value: mt.value, label: mt.label }))}
                        placeholder="Öğün seç…"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Saat</label>
                      <input type="time" value={meal.meal_time} onChange={(e) => updMeal(activeDay._key, meal._key, { meal_time: e.target.value })} className={smCls + " w-full"} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Açıklama</label>
                      <input value={meal.description} onChange={(e) => updMeal(activeDay._key, meal._key, { description: e.target.value })} placeholder="Öğün notu…" className={smCls + " w-full"} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {meal.items.map((item) => (
                      <div key={item._key} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50/60 px-3 py-2.5 dark:bg-slate-800/30">
                        {/* Library picker — custom dropdown */}
                        <div className="w-48 shrink-0">
                          <CustomSelect<number | "">
                            value={item.diet_item_id ?? ""}
                            onChange={(v) => pickLibItem(activeDay._key, meal._key, item._key, v)}
                            placeholder="Kütüphaneden seç…"
                            options={[
                              ...allItems.map((di) => ({ value: di.id as number | "", label: `${di.name} (${di.calories} kcal)` })),
                            ]}
                          />
                        </div>

                        {/* Name */}
                        <input
                          value={item.name}
                          onChange={(e) => updItem(activeDay._key, meal._key, item._key, { name: e.target.value })}
                          placeholder="Besin adı"
                          className="min-w-0 flex-1 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                        />

                        {/* Quantity */}
                        <input
                          type="number" min={0.5} step={0.5} value={item.quantity}
                          onChange={(e) => updItem(activeDay._key, meal._key, item._key, { quantity: Number(e.target.value) })}
                          className="w-16 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                        />
                        <span className="text-xs text-slate-400">porsiyon</span>

                        {/* Calories */}
                        <input
                          type="number" min={0} value={item.calories}
                          onChange={(e) => updItem(activeDay._key, meal._key, item._key, { calories: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                        />
                        <span className="text-xs text-slate-400">kcal</span>

                        {/* Note */}
                        <input
                          value={item.note}
                          onChange={(e) => updItem(activeDay._key, meal._key, item._key, { note: e.target.value })}
                          placeholder="Not"
                          className="w-24 rounded-lg border border-white/30 bg-white/70 px-2 py-1.5 text-xs focus:outline-none dark:bg-slate-700/60 dark:text-slate-200"
                        />

                        <button type="button" onClick={() => removeItem(activeDay._key, meal._key, item._key)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => addItem(activeDay._key, meal._key)}
                    className="mt-2 rounded-full border border-slate-300/60 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-400">
                    + Besin Ekle
                  </button>
                </div>
              ))}

              <button type="button" onClick={() => addMeal(activeDay._key)}
                className="w-full rounded-xl border border-dashed border-blue-300/60 py-2.5 text-sm font-medium text-blue-500 hover:bg-blue-50/40 dark:border-blue-700/50 dark:hover:bg-blue-900/20">
                + Öğün Ekle
              </button>
            </div>
          </GlassCard>
        )}

        <div className="flex gap-3 pb-2">
          <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
            {saving ? "Kaydediliyor…" : mode === "edit" ? "Güncelle" : "Programı Oluştur"}
          </button>
          <button type="button" onClick={() => setMode("list")} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">
            İptal
          </button>
        </div>
      </form>
    );
  }

  /* ---- Category helpers ---- */
  const handleCatSave = async (name: string) => {
    const token = getAccessToken();
    if (!token || !catDialog) return;
    if (catDialog.mode === "rename" && catDialog.cat) {
      await api.admin.updateCategory(token, catDialog.cat.id, { name });
    } else {
      await api.admin.createCategory(token, { name, category_type: "diet", parent: catDialog.parentId ?? null });
    }
    loadCategories();
  };

  const handleCatDelete = async (cat: Category) => {
    const ok = await confirm({ title: "Kategoriyi sil", message: `"${cat.name}" kategorisini silmek istediğinize emin misiniz?`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    await api.admin.deleteCategory(token, cat.id);
    if (selectedCategoryId === cat.id) setSelectedCategoryId(null);
    loadCategories();
  };

  /* ---- LIST MODE ---- */
  return (
    <div className="flex gap-6">
      {/* Category sidebar */}
      <div className="hidden w-56 shrink-0 lg:block">
        <GlassCard className="sticky top-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kategoriler</span>
            <button type="button" title="Kök kategori ekle" onClick={() => setCatDialog({ mode: "add-root" })} className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button type="button" onClick={() => setSelectedCategoryId(null)} className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${selectedCategoryId === null ? "bg-blue-500 text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"}`}>
            Tümü
          </button>
          {categories.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">Henüz kategori yok</p>
          ) : (
            <CategoryTree nodes={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} onAddChild={(parentId) => setCatDialog({ mode: "add-child", parentId })} onRename={(cat) => setCatDialog({ mode: "rename", cat })} onDelete={handleCatDelete} />
          )}
        </GlassCard>
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Mobile category strip */}
        <div className="lg:hidden -mx-1 overflow-x-auto pb-1">
          <div className="flex gap-2 px-1">
            <button type="button" onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCategoryId === null ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
              Tümü
            </button>
            {flattenCategories(categories).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setSelectedCategoryId(Number(opt.value))}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCategoryId === Number(opt.value) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
                {opt.label.trim()}
              </button>
            ))}
            <button type="button" title="Kategori ekle" onClick={() => setCatDialog({ mode: "add-root" })}
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

      <div className="flex justify-end">
        <button onClick={openCreate} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
          + Yeni Program
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : programs.length === 0 ? (
        <GlassCard className="p-10 text-center"><p className="text-slate-500">{selectedCategoryId ? "Bu kategoride program yok." : "Henüz beslenme programı oluşturulmamış."}</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {programs.map((prog) => (
            <GlassCard key={prog.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{prog.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${prog.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      {prog.is_active ? "Aktif" : "Pasif"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {prog.duration_days} gün
                    </span>
                    {prog.assignment_count > 0 && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        {prog.assignment_count} öğrenci
                      </span>
                    )}
                  </div>
                  {prog.category && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {findCatName(categories, prog.category) ?? ""}
                    </span>
                  )}
                  {prog.goals && <p className="mt-1 text-xs text-slate-500">{prog.goals}</p>}
                  {prog.feeding_notes && <p className="mt-0.5 text-xs text-slate-400 italic">{prog.feeding_notes}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(prog.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    {prog.created_by_name && ` · ${prog.created_by_name}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => openView(prog)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">Görüntüle</button>
                  <button onClick={() => openEdit(prog)} className="rounded-full border border-blue-400/40 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400">Düzenle</button>
                  <button onClick={() => handleDelete(prog)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      </div>

      {catDialog && (
        <CategoryDialog
          initial={catDialog.mode === "rename" && catDialog.cat ? catDialog.cat.name : ""}
          onClose={() => setCatDialog(null)}
          onSave={handleCatSave}
        />
      )}
    </div>
  );
}

/* ========================================================
   LIBRARY TAB (besin kütüphanesi — unchanged logic)
   ======================================================== */
function LibraryTab({ notify }: { notify: (t: string, ok?: boolean) => void }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<DietItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FOOD);
  const [catDialog, setCatDialog] = useState<{ mode: "add-root" | "add-child" | "rename"; parentId?: number; cat?: Category } | null>(null);
  const [catDialogName, setCatDialogName] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const loadItems = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try { setItems(await api.admin.dietItems.list(token)); }
    finally { setLoading(false); }
  };
  const loadCats = () => {
    const token = getAccessToken();
    if (token) api.admin.categoryTree(token, "food").then(setCategories).catch(() => {});
  };

  useEffect(() => { loadItems(); loadCats(); }, []);

  // flatten for mobile strip
  const flatCats = (nodes: Category[], prefix = ""): { value: number; label: string }[] =>
    nodes.flatMap((n) => [{ value: n.id, label: prefix + n.name }, ...flatCats(n.children, prefix + "  ")]);

  const findCatName = (nodes: Category[], id: number): string | null => {
    for (const n of nodes) {
      if (n.id === id) return n.name;
      const r = findCatName(n.children, id);
      if (r) return r;
    }
    return null;
  };

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY_FOOD, category_id: selectedCatId }); setShowForm(true); };
  const openEdit = (item: DietItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, category_id: item.category ?? null, calories: item.calories, protein: Number(item.protein), carbs: Number(item.carbs), fat: Number(item.fat), portion: item.portion, is_active: item.is_active });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.name.trim()) { notify("Besin adı zorunludur.", false); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId) { await api.admin.dietItems.update(token, editingId, payload); notify("Güncellendi."); }
      else { await api.admin.dietItems.create(token, payload); notify("Eklendi."); }
      setShowForm(false); loadItems();
    } catch (err) { notify(err instanceof Error ? err.message : "Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: DietItem) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Besin Sil", message: `"${item.name}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.dietItems.delete(token, item.id); notify("Silindi."); loadItems(); }
    catch { notify("Silinemedi.", false); }
  };

  const handleCatSave = async () => {
    const token = getAccessToken();
    if (!token || !catDialogName.trim() || !catDialog) return;
    setCatSaving(true);
    try {
      if (catDialog.mode === "rename" && catDialog.cat) {
        await api.admin.updateCategory(token, catDialog.cat.id, { name: catDialogName.trim() });
      } else {
        await api.admin.createCategory(token, { name: catDialogName.trim(), category_type: "food", parent: catDialog.parentId ?? null });
      }
      loadCats(); setCatDialog(null); setCatDialogName("");
    } catch { notify("Kategori kaydedilemedi.", false); }
    finally { setCatSaving(false); }
  };

  const handleCatDelete = async (cat: Category) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Kategori Sil", message: `"${cat.name}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.deleteCategory(token, cat.id); loadCats(); if (selectedCatId === cat.id) setSelectedCatId(null); }
    catch { notify("Kategori silinemedi.", false); }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: key === "name" || key === "portion" ? e.target.value : Number(e.target.value) }));

  const visibleItems = selectedCatId === null ? items : items.filter((i) => i.category === selectedCatId);
  const flatCatList = flatCats(categories);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="hidden w-52 shrink-0 lg:block">
        <GlassCard className="sticky top-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kategoriler</span>
            <button type="button" onClick={() => { setCatDialog({ mode: "add-root" }); setCatDialogName(""); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button type="button" onClick={() => setSelectedCatId(null)}
            className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${selectedCatId === null ? "bg-emerald-500 text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"}`}>
            Tümü
          </button>
          {categories.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">Henüz kategori yok</p>
          ) : (
            <CategoryTree nodes={categories} selectedId={selectedCatId} onSelect={setSelectedCatId}
              onAddChild={(parentId) => { setCatDialog({ mode: "add-child", parentId }); setCatDialogName(""); }}
              onRename={(cat) => { setCatDialog({ mode: "rename", cat }); setCatDialogName(cat.name); }}
              onDelete={handleCatDelete} />
          )}
        </GlassCard>
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Mobile category strip */}
        <div className="lg:hidden -mx-1 overflow-x-auto pb-1">
          <div className="flex gap-2 px-1">
            <button type="button" onClick={() => setSelectedCatId(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCatId === null ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
              Tümü
            </button>
            {flatCatList.map((c) => (
              <button key={c.value} type="button" onClick={() => setSelectedCatId(c.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCatId === c.value ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
                {c.label.trim()}
              </button>
            ))}
            <button type="button" title="Kategori ekle" onClick={() => { setCatDialog({ mode: "add-root" }); setCatDialogName(""); }}
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedCatId ? <><span className="font-semibold text-slate-700 dark:text-slate-200">{findCatName(categories, selectedCatId)}</span> · </> : ""}
            {visibleItems.length} besin
          </p>
          <button onClick={openNew} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">+ Yeni Besin</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
        ) : visibleItems.length === 0 ? (
          <GlassCard className="p-10 text-center"><p className="text-slate-500">{selectedCatId ? "Bu kategoride besin yok." : "Henüz besin eklenmemiş."}</p></GlassCard>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200/60 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <tr>
                    {["Besin", "Kategori", "Kalori", "Protein", "Karbonhidrat", "Yağ", "Porsiyon", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.name}</td>
                      <td className="px-4 py-3">
                        {item.category ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {findCatName(categories, item.category) ?? "—"}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">{item.calories} kcal</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{item.protein}g</td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{item.carbs}g</td>
                      <td className="px-4 py-3 text-slate-500">{item.fat}g</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.portion || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600/60 dark:text-slate-300 whitespace-nowrap">Düzenle</button>
                          <button onClick={() => handleDelete(item)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 whitespace-nowrap">Sil</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{editingId ? "Besini Düzenle" : "Yeni Besin Ekle"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Besin Adı *</label>
                  <input required type="text" value={form.name} onChange={f("name")} placeholder="örn: Yulaf Ezmesi" className={cls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</label>
                  <CustomSelect
                    value={form.category_id ?? ""}
                    onChange={(v) => setForm((p) => ({ ...p, category_id: v ? Number(v) : null }))}
                    options={[{ value: "", label: "— Kategorisiz —" }, ...flatCatList.map((c) => ({ value: c.value, label: c.label.trim() }))]}
                  />
                </div>
                {([["calories", "Kalori (kcal)"], ["protein", "Protein (g)"], ["carbs", "Karbonhidrat (g)"], ["fat", "Yağ (g)"]] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
                    <input type="number" min={0} step="0.1" value={form[key]} onChange={f(key)} className={cls} />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Porsiyon</label>
                  <input type="text" value={form.portion} onChange={f("portion")} placeholder="örn: 1 kase (200 g)" className={cls} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="food-active" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
                  <label htmlFor="food-active" className="text-sm text-slate-700 dark:text-slate-300">Aktif</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category dialog */}
      {catDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCatDialog(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
              {catDialog.mode === "rename" ? "Kategoriyi Yeniden Adlandır" : "Yeni Kategori"}
            </h3>
            <input autoFocus value={catDialogName} onChange={(e) => setCatDialogName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCatSave(); }}
              placeholder="Kategori adı" className={cls + " mb-4"} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCatDialog(null)} className="rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">İptal</button>
              <button type="button" disabled={catSaving || !catDialogName.trim()} onClick={handleCatSave}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{catSaving ? "…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
