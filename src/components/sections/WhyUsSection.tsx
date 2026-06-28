"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { api, type LandingWhyUsItem } from "@/lib/api";

const FALLBACK_HIGHLIGHTS: LandingWhyUsItem[] = [
  { id: 1, icon: "🏃", title: "Ağrısız Hareket", description: "Ağrısız hareket, doğru postür, dolaşım desteği ve sürdürülebilir vücut fonksiyonu temel hedefimizdir.", sort_order: 0, is_active: true },
  { id: 2, icon: "🧍", title: "Kişiye Özel Plan", description: "Her birey standart bir programa değil, kendi fiziksel durumuna göre hazırlanmış özel bir plana dahil edilir.", sort_order: 1, is_active: true },
  { id: 3, icon: "🩺", title: "Lenfatik & Cihaz Desteği", description: "Lenfatik destek, cihaz tabanlı kas aktivasyonu ve fonksiyonel egzersizler bir araya getirilerek güvenli ilerleme sağlanır.", sort_order: 2, is_active: true },
  { id: 4, icon: "🌱", title: "Kalıcı Dönüşüm", description: "Amacımız geçici sonuçlar değil; kalıcı bir fiziksel dönüşüm ve yaşam kalitesinde gerçek bir iyileşmedir.", sort_order: 3, is_active: true },
];

const STANDARD_ITEMS = [
  "Standart, herkese aynı egzersiz planı",
  "Yalnızca kilo verme veya estetik odak",
  "Ağrı ve ödem farkındalığı yok",
  "Kısa vadeli, geçici sonuçlar",
  "Sadece stüdyo içi uygulama",
];

const JFS_ITEMS = [
  "Kişiye özel fiziksel değerlendirme ve plan",
  "Ağrısız hareket, postür ve dolaşım odağı",
  "Lenfatik destek & cihaz tabanlı aktivasyon",
  "Kalıcı fiziksel dönüşüm hedefi",
  "Stüdyo + online + evde sürdürülebilir sistem",
];

export function WhyUsSection() {
  const [highlights, setHighlights] = useState<LandingWhyUsItem[]>([]);

  useEffect(() => {
    api.landing.whyUs().then((data) => setHighlights(data.length ? data : FALLBACK_HIGHLIGHTS)).catch(() => setHighlights(FALLBACK_HIGHLIGHTS));
  }, []);

  const items = highlights.length ? highlights : FALLBACK_HIGHLIGHTS;

  return (
    <section id="neden-biz" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="font-eyebrow mb-4 inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            Neden JFS?
          </span>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Klasik Egzersizden Farkımız
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            JFS Method, klasik egzersiz yaklaşımlarından farklı olarak sadece kas çalıştırmaya değil,
            vücudun bütün sistemlerini birlikte ele alan bütüncül bir yöntem sunar.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-100/60 p-8 backdrop-blur-sm dark:border-slate-700/40 dark:bg-slate-800/40">
            <h3 className="mb-6 text-lg font-bold text-slate-400 dark:text-slate-500">
              Klasik Yaklaşım
            </h3>
            <ul className="space-y-3">
              {STANDARD_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-300/60 dark:bg-slate-700/60">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <GlassCard className="border-emerald-200/60 p-8 dark:border-emerald-500/20">
            <h3 className="mb-6 text-lg font-bold text-emerald-700 dark:text-emerald-400">
              JFS Method
            </h3>
            <ul className="space-y-3">
              {JFS_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((highlight) => (
            <GlassCard
              key={highlight.id}
              className="group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              {highlight.icon && <div className="mb-4 text-3xl">{highlight.icon}</div>}
              <h4 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
                {highlight.title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {highlight.description}
              </p>
            </GlassCard>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-50/60 to-emerald-50/60 p-8 text-center dark:border-blue-800/30 dark:from-blue-900/20 dark:to-emerald-900/20">
          <p className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;Bireyler süreci sadece seanslarda değil, evde ve yaşamın içinde de
            sürdürebilir hale gelir. Amacımız geçici sonuçlar değil;{" "}
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              kalıcı bir fiziksel dönüşüm ve yaşam kalitesinde gerçek bir iyileşmedir.
            </span>
            &rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
