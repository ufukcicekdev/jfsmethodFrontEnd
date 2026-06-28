"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LottieIcon } from "@/components/ui/LottieIcon";
import { ParallaxSection } from "@/components/ui/ParallaxSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type LandingTreatment } from "@/lib/api";

const GRADIENTS = [
  "from-blue-500/20 to-cyan-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-indigo-500/20 to-purple-500/10",
  "from-orange-500/20 to-amber-500/10",
  "from-cyan-500/20 to-sky-500/10",
  "from-rose-500/20 to-pink-500/10",
];
const LOTTIES = ["/lottie/health.json", "/lottie/calendar.json", "/lottie/mobile.json"];
const ICON_COLORS = ["text-blue-600", "text-emerald-600", "text-indigo-600", "text-orange-600", "text-cyan-600", "text-rose-600"];

const FALLBACK: LandingTreatment[] = [
  { id: 1, title: "Bel Ağrısı", description: "Lomber disk, kas spazmı ve kronik bel ağrısı rehabilitasyonu.", sort_order: 0, is_active: true },
  { id: 2, title: "Omuz & Boyun", description: "Donuk omuz, servikal ağrı ve postür kaynaklı gerginlik tedavisi.", sort_order: 1, is_active: true },
  { id: 3, title: "Diz & Eklem", description: "Menisküs, ligament ve artrit sonrası eklem mobilizasyonu.", sort_order: 2, is_active: true },
  { id: 4, title: "Spor Yaralanması", description: "Kas yırtığı, burkulma ve sporcu dönüş programları.", sort_order: 3, is_active: true },
  { id: 5, title: "Postür Analizi", description: "3D dijital ikiz ile duruş bozukluğu tespiti ve düzeltme.", sort_order: 4, is_active: true },
  { id: 6, title: "Pelvik Taban", description: "Kadın ve erkek sağlığına yönelik özel rehabilitasyon programları.", sort_order: 5, is_active: true },
];

export function TreatmentsGrid() {
  const [treatments, setTreatments] = useState<LandingTreatment[]>([]);

  useEffect(() => {
    api.landing.treatments().then((data) => setTreatments(data.length ? data : FALLBACK)).catch(() => setTreatments(FALLBACK));
  }, []);

  const items = treatments.length ? treatments : FALLBACK;

  return (
    <ParallaxSection id="hizmetler" className="mx-auto max-w-7xl px-6 py-24" intensity={0.05}>
      <ScrollReveal>
        <SectionHeader
          eyebrow="Hizmetlerimiz"
          title="Neler Yapıyoruz?"
          description="Ağrısız ve sürdürülebilir yaşam kalitesi için bilimsel temelli, kişiye özel hareket programları."
        />
      </ScrollReveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <ScrollReveal key={item.id} delay={index * 80}>
            <GlassCard className="group h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} p-3`}>
                <LottieIcon src={LOTTIES[index % LOTTIES.length]} className="h-12 w-12" />
              </div>
              <h3 className={`mb-2 text-lg font-bold ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
              <a
                href="#randevu"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 transition-all group-hover:opacity-100 dark:text-blue-400"
              >
                Randevu Al
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>
    </ParallaxSection>
  );
}
