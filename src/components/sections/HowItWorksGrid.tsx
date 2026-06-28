"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LottieIcon } from "@/components/ui/LottieIcon";
import { ParallaxSection } from "@/components/ui/ParallaxSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const STEPS = [
  {
    title: "Dijital Check-in & Randevu",
    description:
      "Online randevu alın, dijital check-in ile bekleme süresini ortadan kaldırın. Takvim entegrasyonu ile hatırlatmalar alın.",
    lottie: "/lottie/calendar.json",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    title: "Kişiselleştirilmiş 3D Takip",
    description:
      "Dijital ikiziniz üzerinden tedavi ilerlemenizi görselleştirin. Uzmanınız vücut bölgelerinizi 3D mesh üzerinde işaretler.",
    lottie: "/lottie/health.json",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    title: "Cebinizdeki Egzersiz Kütüphanesi (PWA)",
    description:
      "Kişiselleştirilmiş egzersiz videolarınızı offline izleyin. PWA olarak telefonunuza ekleyin, her yerden erişin.",
    lottie: "/lottie/mobile.json",
    gradient: "from-indigo-500 to-blue-400",
  },
];

export function HowItWorksGrid() {
  return (
    <ParallaxSection id="nasil-calisir" className="mx-auto max-w-7xl px-6 py-24" intensity={0.06}>
      <ScrollReveal>
        <SectionHeader
          eyebrow="Süreç"
          title="Nasıl Çalışır?"
          description="Üç adımda dijital fizyoterapi deneyiminize başlayın."
        />
      </ScrollReveal>

      <div className="grid gap-8 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <ScrollReveal key={step.title} delay={index * 120}>
            <GlassCard className="group relative h-full overflow-hidden p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="absolute -right-4 -top-4 text-7xl font-black text-white/20 transition-colors group-hover:text-blue-100/30 dark:text-white/10">
                {index + 1}
              </div>

              <div
                className={`mb-6 inline-flex rounded-2xl bg-gradient-to-br ${step.gradient} p-2 shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <LottieIcon src={step.lottie} className="h-16 w-16" />
              </div>

              <h3 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.description}
              </p>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>
    </ParallaxSection>
  );
}
