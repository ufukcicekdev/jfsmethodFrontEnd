"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ParallaxSection } from "@/components/ui/ParallaxSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type Testimonial } from "@/lib/api";

const FALLBACK: Testimonial[] = [
  { id: 1, name: "Elif K.", treatment: "Bel Ağrısı", rating: 5, text: "3D dijital ikiz sayesinde tedavi ilerlememi her hafta görebildim. Egzersiz videolarını telefonuma indirip evde devam ettim — inanılmaz pratik.", is_active: true, sort_order: 0, created_at: "" },
  { id: 2, name: "Mehmet A.", treatment: "Omuz Rehabilitasyonu", rating: 5, text: "Online randevu sistemi çok kolay. Kişisel egzersiz planım hep yanımdaydı. 6 haftada omuz hareketliliğim normale döndü.", is_active: true, sort_order: 1, created_at: "" },
  { id: 3, name: "Zeynep D.", treatment: "Postür Düzeltme", rating: 5, text: "Masabaşı çalışmasından kaynaklanan boyun ağrılarım vardı. JFS Method'in takip sistemi sayesinde ne zaman ilerlediğimi net gördüm.", is_active: true, sort_order: 2, created_at: "" },
];

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.testimonials.list().then((data) => setItems(data.length > 0 ? data : FALLBACK)).catch(() => setItems(FALLBACK));
  }, []);

  const TESTIMONIALS = items.length > 0 ? items : FALLBACK;

  useEffect(() => {
    if (TESTIMONIALS.length === 0) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [TESTIMONIALS.length]);

  return (
    <ParallaxSection id="yorumlar" className="mx-auto max-w-4xl px-6 py-24" intensity={0.07}>
      <ScrollReveal>
        <SectionHeader
          eyebrow="Hasta Deneyimi"
          title="Hastalarımız Ne Diyor?"
          description="Gerçek kullanıcı deneyimlerinden seçmeler."
        />
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <GlassCard className="relative overflow-hidden p-8 sm:p-10">
          <div className="absolute -right-8 -top-8 text-[120px] font-serif leading-none text-blue-500/10">
            &ldquo;
          </div>

          <div className="relative min-h-[180px]">
            {TESTIMONIALS.map((item, index) => (
              <div
                key={item.name}
                className={`transition-all duration-500 ${
                  index === active
                    ? "relative opacity-100"
                    : "pointer-events-none absolute inset-0 opacity-0"
                }`}
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${i < item.rating ? "text-amber-400" : "text-slate-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
                  &ldquo;{item.text}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 text-sm font-bold text-white">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.treatment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === active
                    ? "w-8 bg-blue-500"
                    : "w-2 bg-slate-300 dark:bg-slate-600"
                }`}
                aria-label={`Yorum ${index + 1}`}
              />
            ))}
          </div>
        </GlassCard>
      </ScrollReveal>
    </ParallaxSection>
  );
}
