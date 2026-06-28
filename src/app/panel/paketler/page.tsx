"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormField } from "@/components/ui/FormField";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getAccessToken } from "@/lib/auth";
import { api, type PackagePlan } from "@/lib/api";

function formatPrice(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

const EMPTY_FORM = {
  name: "",
  total_sessions: "12",
  price: "",
  description: "",
};

export default function PackagePlansPage() {
  const confirm = useConfirm();
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .packagePlans(token)
      .then(setPlans)
      .catch(() => setMessage({ type: "error", text: "Paketler yüklenemedi." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const startEdit = (plan: PackagePlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      total_sessions: String(plan.total_sessions),
      price: String(Number(plan.price)),
      description: plan.description,
    });
    setImagePreview(plan.image_url ?? null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    const total = Number(form.total_sessions);
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Paket adı zorunludur." });
      return;
    }
    if (!total || total < 1) {
      setMessage({ type: "error", text: "Geçerli bir seans sayısı girin." });
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      name: form.name.trim(),
      total_sessions: total,
      price: form.price.trim() === "" ? 0 : Number(form.price),
      description: form.description,
      image: imageFile,
    };
    try {
      if (editingId) {
        await api.admin.updatePackagePlan(token, editingId, payload);
        setMessage({ type: "success", text: "Paket güncellendi." });
      } else {
        await api.admin.createPackagePlan(token, payload);
        setMessage({ type: "success", text: "Paket eklendi." });
      }
      resetForm();
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "İşlem başarısız.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: PackagePlan) => {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(plan.id);
    try {
      await api.admin.updatePackagePlan(token, plan.id, {
        is_active: !plan.is_active,
      });
      load();
    } catch {
      setMessage({ type: "error", text: "Güncellenemedi." });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (plan: PackagePlan) => {
    const ok = await confirm({
      title: "Paketi sil",
      message: `"${plan.name}" paketini silmek istediğinize emin misiniz? Daha önce atanmış hasta paketleri etkilenmez.`,
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    setBusyId(plan.id);
    try {
      await api.admin.deletePackagePlan(token, plan.id);
      setMessage({ type: "success", text: "Paket silindi." });
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Silinemedi.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Paketler
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Seans paketlerini (ad, seans sayısı, fiyat, içerik) burada tanımlayın.
          Hastalara bu katalogdan paket atanır.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : plans.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Henüz paket tanımlanmamış. Aşağıdan ilk paketinizi ekleyin.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <GlassCard
              key={plan.id}
              className={`p-4 sm:p-5 ${
                plan.is_active ? "" : "opacity-70"
              }`}
            >
              {plan.image_url && (
                <img src={plan.image_url} alt={plan.name} className="mb-3 h-32 w-full rounded-xl object-cover" />
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {plan.name}
                    {!plan.is_active && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Pasif
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {plan.total_sessions} seans · {formatPrice(plan.price)}
                  </p>
                </div>
              </div>
              {plan.description && (
                <div className="prose prose-sm mt-2 max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: plan.description }} />
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(plan)}
                  className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={busyId === plan.id}
                  onClick={() => toggleActive(plan)}
                  className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600/60 dark:text-slate-200"
                >
                  {plan.is_active ? "Pasifleştir" : "Aktifleştir"}
                </button>
                <button
                  type="button"
                  disabled={busyId === plan.id}
                  onClick={() => remove(plan)}
                  className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Sil
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {editingId ? "Paketi Düzenle" : "Yeni Paket Ekle"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Paket Adı"
            name="name"
            required
            placeholder="Örn. 12 Seanslık Fizyoterapi Paketi"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Seans Sayısı"
              name="total_sessions"
              type="number"
              min={1}
              max={200}
              required
              value={form.total_sessions}
              onChange={(e) =>
                setForm((f) => ({ ...f, total_sessions: e.target.value }))
              }
            />
            <FormField
              label="Fiyat (TL)"
              name="price"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Paket Görseli
            </label>
            {imagePreview && (
              <div className="mb-3 relative w-full max-w-xs">
                <img src={imagePreview} alt="Önizleme" className="h-40 w-full rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
                >
                  Kaldır
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                if (file) setImagePreview(URL.createObjectURL(file));
              }}
              className="block text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-300 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">İçerik / Açıklama</label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              placeholder="Paket kapsamı, özellikler, koşullar..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saving
                ? "Kaydediliyor…"
                : editingId
                  ? "Güncelle"
                  : "Paket Ekle"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
