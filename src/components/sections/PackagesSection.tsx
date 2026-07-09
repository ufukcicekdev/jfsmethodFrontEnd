"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type PackagePlan } from "@/lib/api";

function formatPrice(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Fiyat için iletişime geçin";
  return num.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
          Kapat
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl shadow-2xl object-contain max-h-[85vh]"
        />
      </div>
    </div>
  );
}

export function PackagesSection() {
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    api.packagePlans
      .public()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && plans.length === 0) return null;

  return (
    <section id="paketler" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Danışmanlık Paketleri"
          title="Size Uygun Programı Seçin"
          description="Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için esnek danışmanlık paketleri."
        />

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : (
          <div className={`mt-10 grid gap-5 mx-auto ${
            plans.length === 1
              ? "max-w-md"
              : plans.length === 2
              ? "sm:grid-cols-2 max-w-2xl"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}>
            {plans.map((plan) => (
              <GlassCard key={plan.id} className="flex flex-col p-6 transition-shadow hover:shadow-lg">
                {plan.image_url && (
                  <button
                    type="button"
                    onClick={() => setLightbox({ src: plan.image_url!, alt: plan.name })}
                    className="group mb-4 overflow-hidden rounded-xl relative cursor-zoom-in"
                  >
                    <img
                      src={plan.image_url}
                      alt={plan.name}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full bg-white/20 backdrop-blur-sm p-2.5">
                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {plan.total_sessions} seans
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                  {plan.name}
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(plan.price)}
                </p>
                {plan.description && (
                  <div
                    className="prose prose-sm mt-3 flex-1 max-w-none text-slate-600 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: plan.description }}
                  />
                )}
                <Link
                  href="#iletisim"
                  className="mt-6 block rounded-full bg-blue-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Bilgi Al
                </Link>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
