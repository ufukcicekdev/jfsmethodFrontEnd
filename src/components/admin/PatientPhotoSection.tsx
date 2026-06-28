"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField, FormGroup, FormInput } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ImageCompareSlider } from "@/components/ui/ImageCompareSlider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type PatientProgressPhoto, type PhotoCategory } from "@/lib/api";

export const PHOTO_CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: "posture_front", label: "Önden (Postür)" },
  { value: "posture_side", label: "Yandan (Postür)" },
  { value: "posture_back", label: "Arkadan (Postür)" },
  { value: "exercise", label: "Egzersiz" },
  { value: "general", label: "Genel" },
  { value: "other", label: "Diğer" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface PatientPhotoSectionProps {
  patientId: number;
  photos: PatientProgressPhoto[];
  onPhotosChange: (photos: PatientProgressPhoto[]) => void;
  onMessage: (message: string, type: "success" | "error") => void;
}

export function PatientPhotoSection({
  patientId,
  photos,
  onPhotosChange,
  onMessage,
}: PatientPhotoSectionProps) {
  const confirm = useConfirm();
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | "all">(
    "all"
  );
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<PatientProgressPhoto | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadForm, setUploadForm] = useState({
    category: "posture_front" as PhotoCategory,
    title: "",
    note: "",
    taken_at: new Date().toISOString().split("T")[0],
    file: null as File | null,
  });

  const filteredPhotos = useMemo(() => {
    if (categoryFilter === "all") return photos;
    return photos.filter((photo) => photo.category === categoryFilter);
  }, [photos, categoryFilter]);

  const comparePhotos = useMemo(
    () =>
      selectedIds
        .map((id) => photos.find((photo) => photo.id === id))
        .filter(Boolean) as PatientProgressPhoto[],
    [photos, selectedIds]
  );

  const [beforePhoto, afterPhoto] = useMemo(() => {
    if (comparePhotos.length !== 2) return [null, null] as const;
    const sorted = [...comparePhotos].sort((a, b) => {
      const dateA = new Date(a.taken_at || a.created_at).getTime();
      const dateB = new Date(b.taken_at || b.created_at).getTime();
      return dateA - dateB;
    });
    return [sorted[0], sorted[1]] as const;
  }, [comparePhotos]);

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 2) {
        return [current[1], id];
      }
      return [...current, id];
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !uploadForm.file) return;

    setUploading(true);
    try {
      const photo = await api.admin.uploadPhoto(token, patientId, {
        image: uploadForm.file,
        category: uploadForm.category,
        title: uploadForm.title,
        note: uploadForm.note,
        taken_at: uploadForm.taken_at,
      });
      onPhotosChange([photo, ...photos]);
      setUploadForm({
        category: uploadForm.category,
        title: "",
        note: "",
        taken_at: new Date().toISOString().split("T")[0],
        file: null,
      });
      onMessage("Fotoğraf yüklendi.", "success");
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Fotoğraf yüklenemedi.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    const ok = await confirm({
      title: "Fotoğrafı sil",
      message: "Bu fotoğrafı silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;

    const token = getAccessToken();
    if (!token) return;

    setDeletingId(photoId);
    try {
      await api.admin.deletePhoto(token, patientId, photoId);
      onPhotosChange(photos.filter((photo) => photo.id !== photoId));
      setSelectedIds((current) => current.filter((id) => id !== photoId));
      if (previewPhoto?.id === photoId) setPreviewPhoto(null);
      onMessage("Fotoğraf silindi.", "success");
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Fotoğraf silinemedi.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Postür & İlerleme Fotoğrafları
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Postür bozukluğu ve tedavi ilerlemesini fotoğraflarla takip edin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCompareMode((value) => !value);
              setSelectedIds([]);
            }}
            className={`w-full rounded-full px-4 py-2 text-sm font-medium sm:w-auto ${
              compareMode
                ? "bg-blue-500 text-white"
                : "border border-slate-300/60 text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
            }`}
          >
            {compareMode ? "Karşılaştırmayı Kapat" : "Karşılaştır"}
          </button>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-6 space-y-4 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/30 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup label="Kategori" required>
              <CustomSelect
                value={uploadForm.category}
                onChange={(category) =>
                  setUploadForm((f) => ({ ...f, category }))
                }
                options={PHOTO_CATEGORIES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                aria-label="Fotoğraf kategorisi"
              />
            </FormGroup>
            <FormField
              label="Çekim Tarihi"
              name="taken_at"
              type="date"
              value={uploadForm.taken_at}
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, taken_at: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Başlık"
              name="photo_title"
              placeholder="Örn. İlk muayene — ön postür"
              value={uploadForm.title}
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            <FormField
              label="Not"
              name="photo_note"
              placeholder="Gözlem veya tedavi notu"
              value={uploadForm.note}
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </div>

          <FormGroup label="Fotoğraf" required hint="JPG, PNG veya WebP — en fazla 5 MB">
            <FormInput
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setUploadForm((f) => ({
                  ...f,
                  file: e.target.files?.[0] ?? null,
                }))
              }
            />
          </FormGroup>

          <button
            type="submit"
            disabled={uploading || !uploadForm.file}
            className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
          >
            {uploading ? "Yükleniyor…" : "Fotoğraf Yükle"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              categoryFilter === "all"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                : "border border-slate-300/60 text-slate-600 dark:border-slate-600/60 dark:text-slate-300"
            }`}
          >
            Tümü ({photos.length})
          </button>
          {PHOTO_CATEGORIES.map((item) => {
            const count = photos.filter((p) => p.category === item.value).length;
            if (count === 0) return null;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategoryFilter(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  categoryFilter === item.value
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "border border-slate-300/60 text-slate-600 dark:border-slate-600/60 dark:text-slate-300"
                }`}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </div>

        {compareMode && beforePhoto && afterPhoto && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ortadaki kaydırıcıyı sürükleyerek önce / sonra fotoğraflarını
              karşılaştırın.
            </p>
            <ImageCompareSlider
              beforeSrc={beforePhoto.image_url}
              afterSrc={afterPhoto.image_url}
              beforeAlt={beforePhoto.title || beforePhoto.category_label}
              afterAlt={afterPhoto.title || afterPhoto.category_label}
              beforeLabel={`Önce · ${formatDate(beforePhoto.taken_at)}`}
              afterLabel={`Sonra · ${formatDate(afterPhoto.taken_at)}`}
              className="mx-auto aspect-3/4 max-h-[560px] w-full max-w-2xl rounded-2xl border border-blue-300/50 dark:border-blue-700/40"
            />
            <div className="mx-auto grid max-w-2xl gap-2 text-sm sm:grid-cols-2">
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Önce:
                </span>{" "}
                {beforePhoto.title || beforePhoto.category_label}
              </p>
              <p className="text-slate-600 dark:text-slate-300 sm:text-right">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Sonra:
                </span>{" "}
                {afterPhoto.title || afterPhoto.category_label}
              </p>
            </div>
          </div>
        )}

        {compareMode && selectedIds.length < 2 && (
          <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">
            Karşılaştırmak için 2 fotoğraf seçin.
          </p>
        )}

        {filteredPhotos.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Bu kategoride henüz fotoğraf yok.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPhotos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`overflow-hidden rounded-2xl border bg-white/60 dark:bg-slate-800/40 ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-400/30"
                      : "border-slate-200/80 dark:border-slate-600/50"
                  }`}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      if (compareMode) {
                        toggleSelect(photo.id);
                      } else {
                        setPreviewPhoto(photo);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image_url}
                      alt={photo.title || photo.category_label}
                      className="aspect-3/4 w-full object-cover"
                    />
                  </button>
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {photo.category_label}
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {photo.title || "Başlıksız"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(photo.taken_at)}
                        </p>
                      </div>
                      {compareMode && (
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isSelected ? "Seçili" : "Seç"}
                        </span>
                      )}
                    </div>
                    {photo.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {photo.note}
                      </p>
                    )}
                    {!compareMode && (
                      <button
                        type="button"
                        disabled={deletingId === photo.id}
                        onClick={() => handleDelete(photo.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                      >
                        {deletingId === photo.id ? "Siliniyor…" : "Sil"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-white dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.image_url}
              alt={previewPhoto.title || previewPhoto.category_label}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="space-y-2 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {previewPhoto.title || previewPhoto.category_label}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {previewPhoto.category_label} · {formatDate(previewPhoto.taken_at)}
              </p>
              {previewPhoto.note && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {previewPhoto.note}
                </p>
              )}
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white dark:bg-slate-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
