"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type NotificationSchedule, type NotificationScheduleType } from "@/lib/api";

const TYPE_OPTIONS: { value: NotificationScheduleType; label: string; emoji: string; defaultTitle: string; defaultMsg: string }[] = [
  { value: "water", label: "Su Hatırlatması", emoji: "💧", defaultTitle: "Su içmeyi unutma!", defaultMsg: "Bugün yeterince su içmedin. Sağlıklı kalmak için su iç! 💧" },
  { value: "steps", label: "Adım Hatırlatması", emoji: "🏃", defaultTitle: "Hareket zamanı!", defaultMsg: "Bugün henüz adım kaydın yok. Kısa bir yürüyüş seni iyi hissettirير! 🚶" },
  { value: "exercise", label: "Egzersiz Hatırlatması", emoji: "💪", defaultTitle: "Egzersiz zamanı!", defaultMsg: "Bugün egzersizini tamamlamadın. Ev programını yapmayı unutma! 💪" },
  { value: "custom", label: "Özel Mesaj", emoji: "📢", defaultTitle: "", defaultMsg: "" },
];

const DAYS = [
  { value: 0, label: "Pzt" },
  { value: 1, label: "Sal" },
  { value: 2, label: "Çar" },
  { value: 3, label: "Per" },
  { value: 4, label: "Cum" },
  { value: 5, label: "Cmt" },
  { value: 6, label: "Paz" },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type FormState = {
  notification_type: NotificationScheduleType;
  title: string;
  message: string;
  send_time: string;
  days_of_week: number[];
  is_enabled: boolean;
};

const EMPTY_FORM: FormState = {
  notification_type: "water",
  title: "",
  message: "",
  send_time: "10:00",
  days_of_week: ALL_DAYS,
  is_enabled: true,
};

export default function BildirimZamanlamaPage() {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.admin.notificationSchedules.list(token);
      setSchedules(data);
    } catch {
      showToast("Yüklenemedi.", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: NotificationSchedule) => {
    setEditingId(s.id);
    setForm({
      notification_type: s.notification_type,
      title: s.title,
      message: s.message,
      send_time: s.send_time.slice(0, 5),
      days_of_week: s.days_of_week,
      is_enabled: s.is_enabled,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      const payload = { ...form, send_time: form.send_time + ":00" };
      if (editingId) {
        await api.admin.notificationSchedules.update(token, editingId, payload);
      } else {
        await api.admin.notificationSchedules.create(token, payload);
      }
      setShowModal(false);
      showToast(editingId ? "Güncellendi." : "Oluşturuldu.");
      load();
    } catch {
      showToast("Kaydedilemedi.", false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: NotificationSchedule) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.notificationSchedules.update(token, s.id, { is_enabled: !s.is_enabled });
      setSchedules((prev) => prev.map((x) => x.id === s.id ? { ...x, is_enabled: !s.is_enabled } : x));
    } catch {
      showToast("Güncellenemedi.", false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu zamanlamayı silmek istiyor musunuz?")) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.notificationSchedules.delete(token, id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast("Silindi.");
    } catch {
      showToast("Silinemedi.", false);
    }
  };

  const handleTest = async (id: number) => {
    const token = getAccessToken();
    if (!token) return;
    setTestingId(id);
    try {
      const res = await api.admin.notificationSchedules.test(token, id);
      showToast(res.detail || "Test bildirimi gönderildi.");
    } catch {
      showToast("Gönderilemedi.", false);
    } finally {
      setTestingId(null);
    }
  };

  const handleTypeChange = (type: NotificationScheduleType) => {
    const opt = TYPE_OPTIONS.find((o) => o.value === type);
    setForm((f) => ({
      ...f,
      notification_type: type,
      title: f.title || opt?.defaultTitle || "",
      message: f.message || opt?.defaultMsg || "",
    }));
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day].sort(),
    }));
  };

  const formatTime = (t: string) => t.slice(0, 5);
  const dayLabels = (days: number[]) =>
    days.length === 7 ? "Her gün" : days.map((d) => DAYS[d]?.label).join(", ");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Bildirim Zamanlama
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Motivasyon bildirimlerini otomatik olarak zamanlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
        >
          + Yeni Ekle
        </button>
      </div>

      {/* Railway Cron Hatırlatması */}
      <GlassCard className="border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">⚙️ Railway Cron Servisi Gerekli</p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
          Bildirimlerin otomatik gönderilmesi için Railway Dashboard'da Cron Service ekleyin:
          <code className="ml-1 rounded bg-amber-200/60 px-1 py-0.5 font-mono dark:bg-amber-900/40">*/10 * * * * → python manage.py fire_scheduled_notifications</code>
        </p>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : schedules.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-4xl">🔔</p>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Henüz zamanlama eklenmemiş.
          </p>
          <button type="button" onClick={openAdd} className="mt-4 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600">
            İlk Zamanlamayı Ekle
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const opt = TYPE_OPTIONS.find((o) => o.value === s.notification_type);
            return (
              <GlassCard key={s.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-2xl">{opt?.emoji ?? "🔔"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.is_enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {s.is_enabled ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">🕐 {formatTime(s.send_time)}</span>
                        <span>{dayLabels(s.days_of_week)}</span>
                        <span className="text-[10px] uppercase tracking-wide">{s.notification_type_label}</span>
                        {s.last_triggered_date && (
                          <span>Son: {new Date(s.last_triggered_date).toLocaleDateString("tr-TR")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(s)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.is_enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                      aria-label={s.is_enabled ? "Devre dışı bırak" : "Etkinleştir"}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.is_enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTest(s.id)}
                      disabled={testingId === s.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700/40 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      {testingId === s.id ? "…" : "Test"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingId ? "Zamanlamayı Düzenle" : "Yeni Zamanlama"}
            </h2>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* Tip */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bildirim Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTypeChange(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        form.notification_type === opt.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="mr-1">{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Başlık</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              {/* Mesaj */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Mesaj</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              {/* Saat */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Gönderim Saati</label>
                <input
                  type="time"
                  required
                  value={form.send_time}
                  onChange={(e) => setForm((f) => ({ ...f, send_time: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              {/* Günler */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Günler</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, days_of_week: f.days_of_week.length === 7 ? [] : ALL_DAYS }))}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {form.days_of_week.length === 7 ? "Hiçbiri" : "Tümü"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        form.days_of_week.includes(d.value)
                          ? "bg-blue-500 text-white"
                          : "border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || form.days_of_week.length === 0}
                  className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
