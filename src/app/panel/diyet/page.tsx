"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type DietItem } from "@/lib/api";

const EMPTY_FORM = { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "", is_active: true };

export default function DiyetPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try { setItems(await api.admin.dietItems.list(token)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const notify = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const openNew = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (item: DietItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, calories: item.calories, protein: Number(item.protein), carbs: Number(item.carbs), fat: Number(item.fat), portion: item.portion, is_active: item.is_active });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.name.trim()) { notify("Besin adı zorunludur.", false); return; }
    setSaving(true);
    try {
      if (editingId) { await api.admin.dietItems.update(token, editingId, form); notify("Güncellendi."); }
      else { await api.admin.dietItems.create(token, form); notify("Eklendi."); }
      setShowForm(false); load();
    } catch (err) { notify(err instanceof Error ? err.message : "Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: DietItem) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Besin Sil", message: `"${item.name}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.dietItems.delete(token, item.id); notify("Silindi."); load(); }
    catch { notify("Silinemedi.", false); }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: key === "name" || key === "portion" ? e.target.value : Number(e.target.value) }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Diyet Kütüphanesi</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Besin öğelerini tanımlayın, öğrencilere diyet planı atarken kullanın.</p>
        </div>
        <button type="button" onClick={openNew} className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
          + Yeni Besin
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">{editingId ? "Besini Düzenle" : "Yeni Besin Ekle"}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Besin Adı</label>
                <input required type="text" value={form.name} onChange={f("name")} placeholder="örn: Yulaf Ezmesi" className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
              </div>
              {([["calories", "Kalori (kcal)"], ["protein", "Protein (g)"], ["carbs", "Karbonhidrat (g)"], ["fat", "Yağ (g)"]] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
                  <input type="number" min={0} step="0.1" value={form[key]} onChange={f(key)} className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Porsiyon</label>
                <input type="text" value={form.portion} onChange={f("portion")} placeholder="örn: 1 kase (200 g)" className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">İptal</button>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : items.length === 0 ? (
        <GlassCard className="p-10 text-center"><p className="text-slate-500">Henüz besin eklenmemiş.</p></GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/50">
              <tr>
                {["Besin", "Kalori", "Protein", "Karbonhidrat", "Yağ", "Porsiyon", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-semibold">{item.calories} kcal</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{item.protein}g</td>
                  <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{item.carbs}g</td>
                  <td className="px-4 py-3 text-slate-500">{item.fat}g</td>
                  <td className="px-4 py-3 text-slate-500">{item.portion || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600/60 dark:text-slate-300">Düzenle</button>
                      <button type="button" onClick={() => handleDelete(item)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
