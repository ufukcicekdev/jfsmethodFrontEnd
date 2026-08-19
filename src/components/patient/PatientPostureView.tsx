"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type PostureAssessment } from "@/lib/api";
import { STATUS_STYLES } from "@/lib/posture";

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientPostureView() {
  const [items, setItems] = useState<PostureAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PostureAssessment | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.wellness
      .postureAssessments(token)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Klinisyen henüz analiz eklemediyse bölümü hiç gösterme.
  if (loading || items.length === 0) return null;

  return (
    <GlassCard className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Klinik Postür Analizlerim
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Uzmanınızın sizin için hazırladığı duruş analizleri. Detay için bir
        analize dokunun.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setDetail(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDetail(item);
            }}
            className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 text-left transition hover:border-blue-300 hover:shadow-md dark:border-slate-600/50 dark:bg-slate-800/40 dark:hover:border-blue-500/50"
          >
            {item.image_url && (
              <div className="relative aspect-3/4 w-full bg-slate-900/5">
                <Image
                  src={item.image_url}
                  alt={`Postür analizi — ${item.view_label}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {item.view_label}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(item.created_at)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.metrics?.map((m) => {
                  const s = STATUS_STYLES[m.status];
                  return (
                    <span
                      key={m.key}
                      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700/60 ${s.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {m.label}:{" "}
                      {m.value === null ? "—" : `${m.value}${m.unit}`}
                    </span>
                  );
                })}
              </div>
              {(item.admin_note || item.note) && (
                <p className="line-clamp-2 border-t border-slate-200/70 pt-2 text-xs text-slate-500 dark:border-slate-600/50 dark:text-slate-400">
                  {item.admin_note || item.note}
                </p>
              )}
              <span className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                Detayı gör
              </span>
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setDetail(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/30 bg-white/95 p-5 shadow-xl backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/95 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Postür Analizi — {detail.view_label}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDate(detail.created_at)}
                  {detail.created_by_name ? ` · ${detail.created_by_name}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                {detail.image_url && (
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-slate-900/5">
                    <Image
                      src={detail.image_url}
                      alt={`Postür analizi — ${detail.view_label}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {detail.metrics?.map((m) => {
                    const s = STATUS_STYLES[m.status];
                    return (
                      <span
                        key={m.key}
                        className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700/60 ${s.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {m.label}:{" "}
                        {m.value === null ? "—" : `${m.value}${m.unit}`}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {detail.note && (
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Değerlendirme
                    </p>
                    <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-600/50 dark:bg-slate-800/40 dark:text-slate-200">
                      {detail.note}
                    </p>
                  </div>
                )}
                {detail.admin_note && (
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Uzman Notu
                    </p>
                    <p className="whitespace-pre-wrap rounded-xl border border-blue-200/70 bg-blue-50/60 p-3 text-sm leading-relaxed text-slate-700 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-slate-200">
                      {detail.admin_note}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Bu ölçümler bilgilendirme amaçlıdır; klinik tanı yerine geçmez.
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
