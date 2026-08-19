"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { PatientProgressGallery } from "@/components/patient/PatientProgressGallery";
import { PatientPostureView } from "@/components/patient/PatientPostureView";
import { PHOTO_CATEGORIES } from "@/components/admin/PatientPhotoSection";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { api, type PatientProgressPhoto } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function FotograflarimPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [photos, setPhotos] = useState<PatientProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "posture_front",
    title: "",
    note: "",
    taken_at: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.wellness.progressPhotos(token);
      setPhotos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setUploadError("Lütfen bir fotoğraf seçin."); return; }
    const token = getAccessToken();
    if (!token) return;
    setUploading(true);
    setUploadError(null);
    try {
      const photo = await api.wellness.uploadProgressPhoto(token, {
        image: file,
        category: form.category,
        title: form.title || undefined,
        note: form.note || undefined,
        taken_at: form.taken_at || undefined,
      });
      setPhotos((prev) => [photo, ...prev]);
      setFile(null);
      setPreview(null);
      setForm({ category: "posture_front", title: "", note: "", taken_at: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    } catch {
      setUploadError("Yükleme başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Fotoğrafı sil",
      message: "Bu fotoğrafı silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.wellness.deleteProgressPhoto(token, id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="space-y-6">
        {/* Klinisyenin eklediği postür analizleri (salt-okunur) */}
        <PatientPostureView />

        {/* Upload form */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Fotoğraf Yükle
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Camera / Gallery buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 py-4 text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-950/20 dark:text-blue-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-xs font-semibold">Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
                </svg>
                <span className="text-xs font-semibold">Galeri</span>
              </button>
            </div>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Preview */}
            {preview && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Önizleme"
                  className="max-h-64 w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kategori
              </label>
              <CustomSelect
                value={form.category}
                onChange={(val) => setForm((f) => ({ ...f, category: val }))}
                options={PHOTO_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                aria-label="Fotoğraf kategorisi"
              />
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Başlık (opsiyonel)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ör. 1. Seans Öncesi"
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Çekim Tarihi (opsiyonel)
              </label>
              <input
                type="date"
                value={form.taken_at}
                onChange={(e) => setForm((f) => ({ ...f, taken_at: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            {/* Note */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Not (opsiyonel)
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Kısa bir not ekleyebilirsiniz..."
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            {uploadError && (
              <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? "Yükleniyor..." : "Fotoğrafı Yükle"}
            </button>
          </form>
        </GlassCard>

        {/* Gallery */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : (
          <PatientProgressGallery photos={photos} onDelete={handleDelete} />
        )}
    </div>
  );
}
