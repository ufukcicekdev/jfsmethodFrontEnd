"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type DietItem, type DietPlan } from "@/lib/api";

const MEAL_OPTIONS = [
  { value: "sabah", label: "Kahvaltı" },
  { value: "ara1", label: "Ara Öğün 1" },
  { value: "ogle", label: "Öğle" },
  { value: "ara2", label: "Ara Öğün 2" },
  { value: "aksam", label: "Akşam" },
  { value: "gece", label: "Gece" },
];

interface PlanFormItem { diet_item_id: number; quantity: number; note: string; name: string; calories: number; }

interface Props {
  patientId: number;
  onMessage: (msg: string, type: "success" | "error") => void;
}

export function PatientDietSection({ patientId, onMessage }: Props) {
  const confirm = useConfirm();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [allItems, setAllItems] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: new Date().toISOString().slice(0, 10), meal_type: "ogle" });
  const [formItems, setFormItems] = useState<PlanFormItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number>(0);

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [p, i] = await Promise.all([
        api.admin.patientDiets.list(token, patientId),
        api.admin.dietItems.list(token),
      ]);
      setPlans(p);
      setAllItems(i);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [patientId]);

  const openNew = () => {
    setEditingPlan(null);
    setForm({ title: "", description: "", date: new Date().toISOString().slice(0, 10), meal_type: "ogle" });
    setFormItems([]);
    setShowForm(true);
  };

  const openEdit = (plan: DietPlan) => {
    setEditingPlan(plan);
    setForm({ title: plan.title, description: plan.description, date: plan.date, meal_type: plan.meal_type });
    setFormItems(plan.plan_items.map((pi) => ({
      diet_item_id: pi.diet_item.id,
      quantity: pi.quantity,
      note: pi.note,
      name: pi.diet_item.name,
      calories: pi.diet_item.calories,
    })));
    setShowForm(true);
  };

  const addItem = () => {
    const item = allItems.find((i) => i.id === selectedItemId);
    if (!item) return;
    if (formItems.find((fi) => fi.diet_item_id === item.id)) return;
    setFormItems((prev) => [...prev, { diet_item_id: item.id, quantity: 1, note: "", name: item.name, calories: item.calories }]);
    setSelectedItemId(0);
  };

  const removeItem = (id: number) => setFormItems((prev) => prev.filter((fi) => fi.diet_item_id !== id));

  const updateItemQty = (id: number, qty: number) =>
    setFormItems((prev) => prev.map((fi) => fi.diet_item_id === id ? { ...fi, quantity: qty } : fi));

  const totalCal = formItems.reduce((s, fi) => s + fi.calories * fi.quantity, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.title.trim()) { onMessage("Plan başlığı zorunludur.", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, items: formItems.map((fi) => ({ diet_item_id: fi.diet_item_id, quantity: fi.quantity, note: fi.note })) };
      if (editingPlan) {
        await api.admin.patientDiets.update(token, patientId, editingPlan.id, payload);
        onMessage("Plan güncellendi.", "success");
      } else {
        await api.admin.patientDiets.create(token, patientId, payload);
        onMessage("Plan oluşturuldu.", "success");
      }
      setShowForm(false);
      load();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Hata.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (plan: DietPlan) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Planı Sil", message: `"${plan.title}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.patientDiets.delete(token, patientId, plan.id); onMessage("Silindi.", "success"); load(); }
    catch { onMessage("Silinemedi.", "error"); }
  };

  const byDate = plans.reduce<Record<string, DietPlan[]>>((acc, p) => {
    (acc[p.date] = acc[p.date] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Diyet Planları</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Günlük öğün planları oluşturun ve atayın.</p>
          </div>
          <button type="button" onClick={openNew} className="shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            + Yeni Plan
          </button>
        </div>
      </GlassCard>

      {showForm && (
        <GlassCard className="p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{editingPlan ? "Planı Düzenle" : "Yeni Diyet Planı"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Plan Başlığı</label>
                <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="örn: Kilo Verme Diyeti" className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tarih</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Öğün</label>
                <CustomSelect
                  value={form.meal_type}
                  onChange={(v) => setForm((f) => ({ ...f, meal_type: v }))}
                  options={MEAL_OPTIONS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Açıklama (isteğe bağlı)</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
              </div>
            </div>

            {/* Besin ekleme */}
            <div className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-700/50">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Besinler</p>
              <div className="flex gap-2">
                <CustomSelect<number>
                  value={selectedItemId}
                  onChange={setSelectedItemId}
                  placeholder="Besin seç…"
                  className="flex-1"
                  options={[
                    ...allItems
                      .filter((i) => !formItems.find((fi) => fi.diet_item_id === i.id))
                      .map((i) => ({ value: i.id, label: `${i.name} (${i.calories} kcal)` })),
                  ]}
                />
                <button type="button" onClick={addItem} disabled={!selectedItemId} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">Ekle</button>
              </div>

              {formItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formItems.map((fi) => (
                    <div key={fi.diet_item_id} className="flex items-center gap-3 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{fi.name}</span>
                      <span className="shrink-0 text-xs text-orange-600 dark:text-orange-400">{Math.round(fi.calories * fi.quantity)} kcal</span>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-400">×</label>
                        <input type="number" min={0.5} step={0.5} value={fi.quantity} onChange={(e) => updateItemQty(fi.diet_item_id, Number(e.target.value))} className="w-16 rounded-lg border border-slate-200/60 bg-white/60 px-2 py-1 text-xs focus:outline-none dark:bg-slate-700/50 dark:text-slate-100" />
                      </div>
                      <button type="button" onClick={() => removeItem(fi.diet_item_id)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Toplam: {Math.round(totalCal)} kcal</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">İptal</button>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : Object.keys(byDate).length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-slate-500 dark:text-slate-400">Henüz diyet planı oluşturulmamış.</p></GlassCard>
      ) : (
        Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, datePlans]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="space-y-2">
              {datePlans.map((plan) => (
                <GlassCard key={plan.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{plan.meal_type_label}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.title}</span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{plan.total_calories} kcal</span>
                      </div>
                      {plan.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>}
                      {plan.plan_items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {plan.plan_items.map((pi) => (
                            <span key={pi.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {pi.diet_item.name} {pi.quantity !== 1 ? `×${pi.quantity}` : ""} <span className="text-orange-500">{Math.round(pi.diet_item.calories * pi.quantity)} kcal</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button type="button" onClick={() => openEdit(plan)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">Düzenle</button>
                      <button type="button" onClick={() => handleDelete(plan)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
