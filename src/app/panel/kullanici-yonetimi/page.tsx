"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, type AdminUser } from "@/lib/api";

const ALL_SECTIONS: { slug: string; label: string }[] = [
  { slug: "ogrenciler",         label: "Öğrenciler" },
  { slug: "randevular",         label: "Randevular" },
  { slug: "takvim",             label: "Takvim" },
  { slug: "calisma-programi",   label: "Çalışma Programı" },
  { slug: "egzersizler",        label: "Egzersizler" },
  { slug: "programlar",         label: "Programlar" },
  { slug: "paketler",           label: "Paketler" },
  { slug: "mesajlar",           label: "Mesajlar" },
  { slug: "diyet",              label: "Diyet" },
  { slug: "blog",               label: "Blog" },
  { slug: "bildirim-gonder",    label: "Bildirim Gönder" },
  { slug: "bildirim-zamanlama", label: "Bildirim Zamanlama" },
  { slug: "sistem-loglari",     label: "Sistem Logları" },
  { slug: "ayarlar",            label: "Ayarlar" },
  { slug: "kullanici-yonetimi", label: "Kullanıcı Yönetimi" },
];

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  allowed_sections: ALL_SECTIONS.map((s) => s.slug),
};

export default function AdminUserManagementPage() {
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .adminUsers(token)
      .then(setUsers)
      .catch(() => setMessage({ type: "error", text: "Kullanıcılar yüklenemedi." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      allowed_sections: u.allowed_sections.length === 0
        ? ALL_SECTIONS.map((s) => s.slug)
        : u.allowed_sections,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const toggleSection = (slug: string) => {
    setForm((f) => ({
      ...f,
      allowed_sections: f.allowed_sections.includes(slug)
        ? f.allowed_sections.filter((s) => s !== slug)
        : [...f.allowed_sections, slug],
    }));
  };

  const toggleAll = () => {
    const allSlugs = ALL_SECTIONS.map((s) => s.slug);
    setForm((f) => ({
      ...f,
      allowed_sections:
        f.allowed_sections.length === allSlugs.length ? [] : allSlugs,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const allSlugs = ALL_SECTIONS.map((s) => s.slug);
      // Tüm bölümler seçiliyse boş liste gönder (= kısıtlama yok)
      const sections =
        form.allowed_sections.length === allSlugs.length
          ? []
          : form.allowed_sections;

      if (editingUser) {
        const payload: Parameters<typeof api.admin.updateAdminUser>[2] = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          allowed_sections: sections,
        };
        if (form.password) payload.password = form.password;
        await api.admin.updateAdminUser(token, editingUser.id, payload);
        setMessage({ type: "success", text: "Kullanıcı güncellendi." });
      } else {
        await api.admin.createAdminUser(token, {
          username: form.username,
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          allowed_sections: sections,
        });
        setMessage({ type: "success", text: "Admin kullanıcı oluşturuldu." });
      }
      closeModal();
      load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "İşlem başarısız." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    const ok = await confirm({
      title: "Admin kullanıcıyı sil",
      message: `"${u.username}" kullanıcısı silinecek. Emin misiniz?`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.deleteAdminUser(token, u.id);
      setMessage({ type: "success", text: "Kullanıcı silindi." });
      load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Silinemedi." });
    }
  };

  const isSuperuser = (me as { is_superuser?: boolean })?.is_superuser;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Kullanıcı Yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Admin kullanıcıları yönetin ve panel bölümü erişimlerini düzenleyin.
          </p>
        </div>
        {isSuperuser && (
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            + Yeni Admin
          </button>
        )}
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const sections = u.allowed_sections.length === 0
              ? ALL_SECTIONS.map((s) => s.label)
              : ALL_SECTIONS.filter((s) => u.allowed_sections.includes(s.slug)).map((s) => s.label);

            return (
              <GlassCard key={u.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {u.first_name || u.last_name
                          ? `${u.first_name} ${u.last_name}`.trim()
                          : u.username}
                      </span>
                      {u.is_superuser && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Superuser
                        </span>
                      )}
                      {!u.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-700">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      @{u.username}{u.email ? ` · ${u.email}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {u.is_superuser || u.allowed_sections.length === 0 ? "Tüm bölümlere erişim" : `${sections.length} bölüm`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {u.is_superuser || u.allowed_sections.length === 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Tümü ✓
                      </span>
                    ) : (
                      sections.map((label) => (
                        <span key={label} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {label}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {isSuperuser && !u.is_superuser && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
                    >
                      Düzenle
                    </button>
                    {u.id !== me?.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-700/60">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {editingUser ? "Admini Düzenle" : "Yeni Admin Ekle"}
              </h2>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Ad</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Soyad</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Kullanıcı Adı *</label>
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="örn: ahmet.admin"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">E-posta</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className={editingUser ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    {editingUser ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder={editingUser ? "Değiştirmek için girin" : ""}
                  />
                </div>
              </div>

              {/* Section permissions */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Panel Bölüm Erişimleri
                  </label>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-blue-500 hover:text-blue-700"
                  >
                    {form.allowed_sections.length === ALL_SECTIONS.length ? "Tümünü kaldır" : "Tümünü seç"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_SECTIONS.map(({ slug, label }) => {
                    const checked = form.allowed_sections.includes(slug);
                    return (
                      <label
                        key={slug}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500/60 dark:bg-blue-900/20 dark:text-blue-200"
                            : "border-slate-200/80 text-slate-500 dark:border-slate-700/60 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSection(slug)}
                          className="h-3.5 w-3.5 rounded accent-blue-500"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Tüm bölümler seçiliyse kısıtlama uygulanmaz.
                </p>
              </div>

              {message && (
                <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
                  {message.text}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : editingUser ? "Güncelle" : "Oluştur"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-200"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
