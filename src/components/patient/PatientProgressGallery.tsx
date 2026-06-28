"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ImageCompareSlider } from "@/components/ui/ImageCompareSlider";
import type { PatientProgressPhoto } from "@/lib/api";

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

  const posturePhotos = photos.filter((p) =>
    p.category.startsWith("posture_")
  );

  const comparePhotos = useMemo(
    () =>
      selectedIds
        .map((id) => posturePhotos.find((photo) => photo.id === id))
        .filter(Boolean) as PatientProgressPhoto[],
    [posturePhotos, selectedIds]
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

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              İlerleme Fotoğrafları
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Terapistinizin yüklediği postür ve ilerleme kayıtları.
            </p>
          </div>
          {posturePhotos.length >= 2 && (
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
          )}
        </div>

        {compareMode && beforePhoto && afterPhoto && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Kaydırıcıyı hareket ettirerek tedavi öncesi ve sonrasını
              karşılaştırın.
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
          <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">
            Karşılaştırmak için 2 fotoğraf seçin.
          </p>
        )}

        {posturePhotos.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Henüz fotoğraf eklenmemiş. Seans sonrası terapistiniz ekleyecektir.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posturePhotos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    if (compareMode) {
                      toggleSelect(photo.id);
                    } else {
                      setPreview(photo);
                    }
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
                    <p className="text-[10px] text-slate-500">
                      {formatDate(photo.taken_at)}
                    </p>
                    {compareMode && (
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isSelected ? "Seçili" : "Seç"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[90vh] max-w-lg overflow-auto rounded-2xl bg-white p-4 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.image_url}
              alt={preview.title || preview.category_label}
              className="max-h-[60vh] w-full rounded-xl object-contain"
            />
            <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
              {preview.title || preview.category_label}
            </p>
            <p className="text-sm text-slate-500">{formatDate(preview.taken_at)}</p>
            {preview.note && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {preview.note}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
