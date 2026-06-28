"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField, FormGroup } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api, type SiteSettings, type Testimonial, type LandingService, type LandingTreatment, type LandingWhyUsItem, type Faq } from "@/lib/api";
import { useConfirm } from "@/components/providers/ConfirmProvider";

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-800/50">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${value ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

/* ─── TextArea ───────────────────────────────────────────────────────────── */
function Textarea({ label, value, onChange, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <FormGroup label={label}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </FormGroup>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Tab = "iletisim" | "sosyal" | "bolumler" | "uzman" | "yorumlar" | "hizmetler" | "tedavi" | "nedenJfs" | "sss" | "seo";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "iletisim", label: "İletişim", icon: "📍" },
  { key: "sosyal", label: "Sosyal Medya", icon: "🔗" },
  { key: "bolumler", label: "Bölüm Görünürlüğü", icon: "🏠" },
  { key: "hizmetler", label: "Hizmetler", icon: "💼" },
  { key: "tedavi", label: "Tedavi Alanları", icon: "🏥" },
  { key: "nedenJfs", label: "Neden JFS", icon: "✅" },
  { key: "yorumlar", label: "Hasta Yorumları", icon: "💬" },
  { key: "sss", label: "SSS", icon: "❓" },
  { key: "uzman", label: "Uzman Profili", icon: "👨‍⚕️" },
  { key: "seo", label: "SEO & Analytics", icon: "📊" },
];

const EMPTY: SiteSettings = {
  clinic_name: "", address: "", phone: "", whatsapp: "", email: "",
  working_hours: "", map_embed_url: "",
  instagram_url: "", facebook_url: "", x_url: "", youtube_url: "", linkedin_url: "",
  google_analytics_id: "", google_search_console_verification: "",
  registration_enabled: true,
  section_stats: true, section_marquee: true, section_about: true,
  section_services: true, section_digital_twin: true, section_treatments: true,
  section_how_it_works: true, section_why_us: true, section_testimonials: true,
  section_packages: true, section_cta: true, section_faq: true,
  expert_visible: true, expert_name: "", expert_title: "", expert_bio: "",
  expert_years: 0, expert_patient_count: "", expert_rating: "", expert_badges: "",
};

/* ─── Testimonials Tab ───────────────────────────────────────────────────── */
const TESTIMONIAL_EMPTY = { name: "", treatment: "", text: "", rating: 5, is_active: true, sort_order: 0 };

function TestimonialsTab() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(TESTIMONIAL_EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.testimonials.list(token).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const notify = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const openNew = () => { setEditingId(null); setForm(TESTIMONIAL_EMPTY); setShowForm(true); };
  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({ name: t.name, treatment: t.treatment, text: t.text, rating: t.rating, is_active: t.is_active, sort_order: t.sort_order });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.name.trim() || !form.text.trim()) { notify("Ad ve yorum zorunludur.", false); return; }
    setSaving(true);
    try {
      if (editingId) { await api.admin.testimonials.update(token, editingId, form); notify("Güncellendi."); }
      else { await api.admin.testimonials.create(token, form); notify("Eklendi."); }
      setShowForm(false); load();
    } catch { notify("Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (t: Testimonial) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Yorumu Sil", message: `"${t.name}" yorumu silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.testimonials.delete(token, t.id); notify("Silindi."); load(); }
    catch { notify("Silinemedi.", false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Anasayfada gösterilecek hasta yorumlarını yönetin.</p>
        <button type="button" onClick={openNew} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">+ Yorum Ekle</button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>{msg.text}</div>
      )}

      {showForm && (
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{editingId ? "Yorumu Düzenle" : "Yeni Yorum"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Hasta Adı" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <FormField label="Tedavi Türü" name="treatment" placeholder="örn. Bel Ağrısı" value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} />
              <div className="sm:col-span-2">
                <Textarea label="Yorum Metni" value={form.text} onChange={(v) => setForm((f) => ({ ...f, text: v }))} rows={3} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Puan</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setForm((f) => ({ ...f, rating: star }))}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= form.rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <FormField label="Sıra No" name="sort_order" type="number" value={String(form.sort_order)} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
              </div>
              <div className="sm:col-span-2">
                <Toggle label="Aktif" description="Anasayfada gösterilsin" value={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
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
        <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-slate-500">Henüz yorum eklenmemiş.</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <GlassCard key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                    {t.treatment && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t.treatment}</span>}
                    <span className="text-amber-400">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
                    {!t.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">Pasif</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{t.text}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => openEdit(t)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">Düzenle</button>
                  <button type="button" onClick={() => handleDelete(t)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Generic icon+title+desc CRUD tab ──────────────────────────────────── */
type SimpleItem = { id: number; title: string; description: string; sort_order: number; is_active: boolean; icon?: string; tag?: string };

function GenericItemTab<T extends SimpleItem>({
  label, hasIcon = false, hasTag = false,
  listFn, createFn, updateFn, deleteFn,
  emptyIcon = "🎯",
}: {
  label: string; hasIcon?: boolean; hasTag?: boolean;
  listFn: (token: string) => Promise<T[]>;
  createFn: (token: string, d: Partial<T>) => Promise<T>;
  updateFn: (token: string, id: number, d: Partial<T>) => Promise<T>;
  deleteFn: (token: string, id: number) => Promise<void>;
  emptyIcon?: string;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<T>>({ title: "", description: "", sort_order: 0, is_active: true, icon: emptyIcon, tag: "" } as Partial<T>);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    listFn(token).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const notify = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const openNew = () => { setEditingId(null); setForm({ title: "", description: "", sort_order: 0, is_active: true, icon: emptyIcon, tag: "" } as Partial<T>); setShowForm(true); };
  const openEdit = (item: T) => { setEditingId(item.id); setForm({ ...item }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !(form as { title?: string }).title?.trim()) { notify("Başlık zorunludur.", false); return; }
    setSaving(true);
    try {
      if (editingId) { await updateFn(token, editingId, form); notify("Güncellendi."); }
      else { await createFn(token, form); notify("Eklendi."); }
      setShowForm(false); load();
    } catch { notify("Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: T) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: `${label} Sil`, message: `"${item.title}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await deleteFn(token, item.id); notify("Silindi."); load(); }
    catch { notify("Silinemedi.", false); }
  };

  const setF = (k: string, v: string | boolean | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Anasayfada görünecek {label.toLowerCase()} kartlarını yönetin.</p>
        <button type="button" onClick={openNew} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">+ Ekle</button>
      </div>
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>{msg.text}</div>}

      {showForm && (
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{editingId ? "Düzenle" : "Yeni " + label}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {hasIcon && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">İkon (emoji)</label>
                  <input value={(form as { icon?: string }).icon || ""} onChange={(e) => setF("icon", e.target.value)} className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-2xl shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80" />
                </div>
              )}
              {hasTag && (
                <FormField label="Etiket" name="tag" placeholder="örn. Bireysel" value={(form as { tag?: string }).tag || ""} onChange={(e) => setF("tag", e.target.value)} />
              )}
              <div className={hasIcon || hasTag ? "" : "sm:col-span-2"}>
                <FormField label="Başlık" name="title" value={(form as { title?: string }).title || ""} onChange={(e) => setF("title", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Açıklama" value={(form as { description?: string }).description || ""} onChange={(v) => setF("description", v)} rows={3} />
              </div>
              <FormField label="Sıra No" name="sort_order" type="number" value={String((form as { sort_order?: number }).sort_order ?? 0)} onChange={(e) => setF("sort_order", Number(e.target.value))} />
              <div className="flex items-end pb-1">
                <Toggle label="Aktif" value={(form as { is_active?: boolean }).is_active ?? true} onChange={(v) => setF("is_active", v)} />
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
        <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-slate-500">Henüz içerik eklenmemiş. Ekle butonuna tıklayın.</p></GlassCard>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-start gap-3">
                  {hasIcon && <span className="text-2xl shrink-0">{(item as { icon?: string }).icon}</span>}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                      {hasTag && (item as { tag?: string }).tag && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{(item as { tag?: string }).tag}</span>}
                      {!item.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">Pasif</span>}
                      <span className="text-xs text-slate-400">#{item.sort_order}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => openEdit(item)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">Düzenle</button>
                  <button type="button" onClick={() => handleDelete(item)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── FAQ Tab ────────────────────────────────────────────────────────────── */
function FaqTab() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.faqs.list(token).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const notify = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !form.question.trim()) { notify("Soru zorunludur.", false); return; }
    setSaving(true);
    try {
      if (editingId) { await api.admin.faqs.update(token, editingId, form); notify("Güncellendi."); }
      else { await api.admin.faqs.create(token, form); notify("Eklendi."); }
      setShowForm(false); load();
    } catch { notify("Hata.", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: Faq) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "SSS Sil", message: `"${item.question}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try { await api.admin.faqs.delete(token, item.id); notify("Silindi."); load(); }
    catch { notify("Silinemedi.", false); }
  };

  const openNew = () => { setEditingId(null); setForm({ question: "", answer: "", sort_order: 0, is_active: true }); setShowForm(true); };
  const openEdit = (item: Faq) => { setEditingId(item.id); setForm({ question: item.question, answer: item.answer, sort_order: item.sort_order, is_active: item.is_active }); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Sıkça sorulan soruları yönetin. Aktifler anasayfada görünür.</p>
        <button type="button" onClick={openNew} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">+ Soru Ekle</button>
      </div>
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>{msg.text}</div>}

      {showForm && (
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{editingId ? "Soruyu Düzenle" : "Yeni Soru"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <FormField label="Soru" name="question" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
            <Textarea label="Cevap" value={form.answer} onChange={(v) => setForm((f) => ({ ...f, answer: v }))} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Sıra No" name="sort_order" type="number" value={String(form.sort_order)} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
              <div className="flex items-end pb-1"><Toggle label="Aktif" value={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} /></div>
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
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-slate-500">Henüz soru eklenmemiş.</p></GlassCard>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.question}</span>
                    {!item.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">Pasif</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => openEdit(item)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300">Düzenle</button>
                  <button type="button" onClick={() => handleDelete(item)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">Sil</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("iletisim");
  const [data, setData] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.siteSettings(token)
      .then((s) => setData({ ...EMPTY, ...s }))
      .catch(() => setMessage({ type: "error", text: "Ayarlar yüklenemedi." }))
      .finally(() => setLoading(false));
  }, []);

  const upd = (key: keyof SiteSettings, value: string | boolean | number) =>
    setData((d) => ({ ...d, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.admin.updateSiteSettings(token, data);
      setData({ ...EMPTY, ...updated });
      setMessage({ type: "success", text: "Ayarlar kaydedildi." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Kayıt başarısız." });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>;
  }

  const SECTION_TOGGLES: { key: keyof SiteSettings; label: string }[] = [
    { key: "section_stats", label: "İstatistik Şeridi" },
    { key: "section_marquee", label: "Marka / Güven Şeridi" },
    { key: "section_about", label: "Hakkımızda" },
    { key: "section_services", label: "Hizmetler (Neler Yapıyoruz)" },
    { key: "section_digital_twin", label: "Dijital İkiz Paneli" },
    { key: "section_treatments", label: "Tedavi Alanları" },
    { key: "section_how_it_works", label: "Nasıl Çalışır" },
    { key: "section_why_us", label: "Neden JFS" },
    { key: "section_testimonials", label: "Hasta Yorumları" },
    { key: "section_packages", label: "Paketler" },
    { key: "section_cta", label: "CTA Banner" },
    { key: "section_faq", label: "Sıkça Sorulan Sorular (SSS)" },
    { key: "registration_enabled", label: "Kayıt Ol Formu" },
    { key: "expert_visible", label: "Uzman Profil Kartı" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Site Ayarları</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">İletişim, sosyal medya, anasayfa bölümleri ve içerik yönetimi.</p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>
          {message.text}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-white/30 bg-white/40 p-1 backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/40">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${activeTab === tab.key ? "bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-slate-50" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs — wrap in form only for settings tabs */}
      {activeTab === "yorumlar" ? (
        <TestimonialsTab />
      ) : activeTab === "hizmetler" ? (
        <GenericItemTab<LandingService> label="Hizmet" hasIcon hasTag
          listFn={(t) => api.admin.landing.services.list(t)}
          createFn={(t, d) => api.admin.landing.services.create(t, d)}
          updateFn={(t, id, d) => api.admin.landing.services.update(t, id, d)}
          deleteFn={(t, id) => api.admin.landing.services.delete(t, id)}
          emptyIcon="💪"
        />
      ) : activeTab === "tedavi" ? (
        <GenericItemTab<LandingTreatment> label="Tedavi Alanı"
          listFn={(t) => api.admin.landing.treatments.list(t)}
          createFn={(t, d) => api.admin.landing.treatments.create(t, d)}
          updateFn={(t, id, d) => api.admin.landing.treatments.update(t, id, d)}
          deleteFn={(t, id) => api.admin.landing.treatments.delete(t, id)}
        />
      ) : activeTab === "nedenJfs" ? (
        <GenericItemTab<LandingWhyUsItem> label="Neden JFS" hasIcon
          listFn={(t) => api.admin.landing.whyUs.list(t)}
          createFn={(t, d) => api.admin.landing.whyUs.create(t, d)}
          updateFn={(t, id, d) => api.admin.landing.whyUs.update(t, id, d)}
          deleteFn={(t, id) => api.admin.landing.whyUs.delete(t, id)}
          emptyIcon="✅"
        />
      ) : activeTab === "sss" ? (
        <FaqTab />
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === "iletisim" && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">İletişim Bilgileri</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField label="Klinik / Marka Adı" name="clinic_name" value={data.clinic_name} onChange={(e) => upd("clinic_name", e.target.value)} />
                </div>
                <Textarea label="Adres" value={data.address} onChange={(v) => upd("address", v)} />
                <Textarea label="Çalışma Saatleri" value={data.working_hours} onChange={(v) => upd("working_hours", v)} placeholder="Pazartesi–Cuma 09:00–18:00" />
                <FormField label="Telefon" name="phone" value={data.phone} onChange={(e) => upd("phone", e.target.value)} />
                <FormField label="WhatsApp" name="whatsapp" value={data.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} />
                <div className="sm:col-span-2">
                  <FormField label="E-posta" name="email" type="email" value={data.email} onChange={(e) => upd("email", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <FormField label="Google Harita (embed src)" name="map_embed_url" type="url" value={data.map_embed_url} onChange={(e) => upd("map_embed_url", e.target.value)} />
                  <p className="mt-1 text-xs text-slate-400">Google Haritalar → Paylaş → Haritayı yerleştir → iframe içindeki src değeri</p>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "sosyal" && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Sosyal Medya Linkleri</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Doldurduğunuz platformlar anasayfa İletişim bölümünde ikon olarak görünür.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Instagram" name="instagram_url" type="url" value={data.instagram_url} onChange={(e) => upd("instagram_url", e.target.value)} />
                <FormField label="Facebook" name="facebook_url" type="url" value={data.facebook_url} onChange={(e) => upd("facebook_url", e.target.value)} />
                <FormField label="X (Twitter)" name="x_url" type="url" value={data.x_url} onChange={(e) => upd("x_url", e.target.value)} />
                <FormField label="YouTube" name="youtube_url" type="url" value={data.youtube_url} onChange={(e) => upd("youtube_url", e.target.value)} />
                <FormField label="LinkedIn" name="linkedin_url" type="url" value={data.linkedin_url} onChange={(e) => upd("linkedin_url", e.target.value)} />
              </div>
            </GlassCard>
          )}

          {activeTab === "bolumler" && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-50">Anasayfa Bölümleri</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Hangi bölümlerin anasayfada görüneceğini seçin.</p>
              <div className="space-y-2">
                {SECTION_TOGGLES.map((t) => (
                  <Toggle
                    key={t.key}
                    label={t.label}
                    value={data[t.key] as boolean}
                    onChange={(v) => upd(t.key, v)}
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === "uzman" && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-50">Uzman Profili</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Anasayfadaki "Deneyimli Fizyoterapistiniz" kartının içeriği.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Ad Soyad" name="expert_name" value={data.expert_name} onChange={(e) => upd("expert_name", e.target.value)} />
                <FormField label="Unvan / Uzmanlık" name="expert_title" value={data.expert_title} onChange={(e) => upd("expert_title", e.target.value)} />
                <div className="sm:col-span-2">
                  <Textarea label="Biyografi" value={data.expert_bio} onChange={(v) => upd("expert_bio", v)} rows={3} />
                </div>
                <FormField label="Yıl Deneyim" name="expert_years" type="number" value={String(data.expert_years)} onChange={(e) => upd("expert_years", Number(e.target.value))} />
                <FormField label="Hasta Sayısı" name="expert_patient_count" placeholder="örn. 2.000+" value={data.expert_patient_count} onChange={(e) => upd("expert_patient_count", e.target.value)} />
                <FormField label="Puan" name="expert_rating" placeholder="örn. 4.9" value={data.expert_rating} onChange={(e) => upd("expert_rating", e.target.value)} />
                <div className="sm:col-span-2">
                  <FormField label="Uzmanlık Etiketleri (virgülle ayırın)" name="expert_badges" value={data.expert_badges} onChange={(e) => upd("expert_badges", e.target.value)} placeholder="Ortopedik Rehabilitasyon, Spor Yaralanmaları, Manuel Terapi" />
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "seo" && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-50">SEO & Analytics</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Google araçları. Değişiklikler tüm ziyaretçi sayfalarında geçerli olur.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FormField label="Google Analytics Ölçüm Kimliği" name="google_analytics_id" placeholder="G-XXXXXXXXXX" value={data.google_analytics_id} onChange={(e) => upd("google_analytics_id", e.target.value)} />
                </div>
                <div>
                  <FormField label="Search Console Doğrulama" name="google_search_console_verification" value={data.google_search_console_verification} onChange={(e) => upd("google_search_console_verification", e.target.value)} />
                  <p className="mt-1 text-xs text-slate-400">"HTML etiketi" yöntemindeki content değeri.</p>
                </div>
              </div>
            </GlassCard>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Ayarları Kaydet"}
          </button>
        </form>
      )}
    </div>
  );
}
