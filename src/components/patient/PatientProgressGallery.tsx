"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ImageCompareSlider } from "@/components/ui/ImageCompareSlider";
import type { PatientProgressPhoto } from "@/lib/api";

const CATEGORY_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "posture_front", label: "Ön" },
  { value: "posture_side", label: "Yan" },
  { value: "posture_back", label: "Arka" },
  { value: "exercise", label: "Egzersiz" },
] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PatientProgressGallery({
  photos,
}: {
  photos: PatientProgressPhoto[];
}) {
  const [preview, setPreview] = useState<PatientProgressPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredPhotos = useMemo(() => {
    if (activeFilter === "all") return photos;
    return photos.filter((p) => p.category === activeFilter);
  }, [photos, activeFilter]);

  const posturePhotos = filteredPhotos.filter((p) => p.category.startsWith("posture_"));
  const visiblePhotos = compareMode ? posturePhotos : filteredPhotos;

  const comparePhotos = useMemo(
    () =>
      selectedIds
        .map((id) => visiblePhotos.find((photo) => photo.id === id))
        .filter(Boolean) as PatientProgressPhoto[],
    [visiblePhotos, selectedIds]
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
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  };

  const allPosturePhotos = photos.filter((p) => p.category.startsWith("posture_"));

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        {/* Başlık + Karşılaştır butonu */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              İlerleme Fotoğrafları
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Terapistinizin yüklediği postür ve ilerleme kayıtları.
            </p>
          </div>
          {allPosturePhotos.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                setCompareMode((v) => !v);
                setSelectedIds([]);
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors sm:w-auto ${
                compareMode
                  ? "bg-blue-500 text-white shadow-blue-500/25 hover:bg-blue-600"
                  : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-950/30 dark:text-blue-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {compareMode ? "Karşılaştırmayı Kapat" : "Fotoğrafları Karşılaştır"}
            </button>
          )}
        </div>

        {/* Karşılaştırma sonucu */}
        {compareMode && beforePhoto && afterPhoto && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Kaydırıcıyı hareket ettirerek değişimi görün.
            </p>
            <ImageCompareSlider
              beforeSrc={beforePhoto.image_url}
              afterSrc={afterPhoto.image_url}
              beforeAlt={beforePhoto.title || beforePhoto.category_label}
              afterAlt={afterPhoto.title || afterPhoto.category_label}
              beforeLabel={`Önce · ${formatDate(beforePhoto.taken_at)}`}
              afterLabel={`Sonra · ${formatDate(afterPhoto.taken_at)}`}
              className="mx-auto aspect-3/4 max-h-[480px] w-full max-w-xl rounded-2xl border border-blue-300/50 dark:border-blue-700/40"
            />
          </div>
        )}

        {compareMode && selectedIds.length < 2 && (
          <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Karşılaştırmak için aşağıdan 2 fotoğraf seçin.{" "}
              <span className="font-semibold">({selectedIds.length}/2 seçili)</span>
            </p>
          </div>
        )}

        {/* Fotoğraf yoksa */}
        {photos.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl bg-slate-50 py-10 dark:bg-slate-800/40">
            <svg className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Henüz fotoğraf yüklenmemiş.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Seans sonrası terapistiniz ekleyecektir.</p>
          </div>
        ) : (
          <>
            {/* Kategori filtresi */}
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_FILTERS.filter((f) => {
                if (f.value === "all") return true;
                return photos.some((p) => p.category === f.value);
              }).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setActiveFilter(f.value); setSelectedIds([]); }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === f.value
                      ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-60">
                    {f.value === "all" ? photos.length : photos.filter((p) => p.category === f.value).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Fotoğraf grid */}
            {visiblePhotos.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Bu kategoride fotoğraf yok.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visiblePhotos.map((photo) => {
                  const isSelected = selectedIds.includes(photo.id);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        if (compareMode) toggleSelect(photo.id);
                        else setPreview(photo);
                      }}
                      className={`overflow-hidden rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-400/30"
                          : "border-slate-200/80 dark:border-slate-600/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt={photo.title || photo.category_label}
                        className="aspect-3/4 w-full object-cover"
                      />
                      <div className="p-2">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                          {photo.category_label}
                        </p>
                        <p className="text-[10px] text-slate-500">{formatDate(photo.taken_at)}</p>
                        {compareMode && (
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {isSelected ? `${selectedIds.indexOf(photo.id) + 1}. Seçili` : "Seç"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] max-w-lg overflow-auto rounded-2xl bg-white p-4 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image_url} alt={preview.title || preview.category_label} className="max-h-[60vh] w-full rounded-xl object-contain" />
            <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">{preview.title || preview.category_label}</p>
            <p className="text-sm text-slate-500">{formatDate(preview.taken_at)}</p>
            {preview.note && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{preview.note}</p>}
          </div>
        </div>
      )}
    </>
  );
}
