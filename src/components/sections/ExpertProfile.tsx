"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type SiteSettings } from "@/lib/api";

export function ExpertProfile() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    api.site.settings().then(setSettings).catch(() => {});
  }, []);

  if (settings && !settings.expert_visible) return null;

  const name = settings?.expert_name || "Dr. Ayşe Yılmaz";
  const title = settings?.expert_title || "Fizyoterapist & Ortopedik Rehabilitasyon Uzmanı";
  const bio = settings?.expert_bio || "15 yıllık deneyimiyle dijital fizyoterapi alanında öncü. Kişiselleştirilmiş 3D tedavi planları ve veri odaklı rehabilitasyon yaklaşımıyla 2.000+ hastaya hizmet vermiştir.";
  const years = settings?.expert_years || 15;
  const patientCount = settings?.expert_patient_count || "2.000+";
  const rating = settings?.expert_rating || "4.9";
  const badges = settings?.expert_badges
    ? settings.expert_badges.split(",").map((b) => b.trim()).filter(Boolean)
    : ["Ortopedik Rehabilitasyon", "Spor Yaralanmaları", "3D Postür Analizi", "Manuel Terapi"];

  return (
    <section id="uzman" className="relative mx-auto max-w-4xl px-6 py-24">
      <ScrollReveal>
        <SectionHeader
          eyebrow="Uzman Kadro"
          title="Deneyimli Fizyoterapistiniz"
          description="Alanında uzman, dijital tedavi yaklaşımına hakim profesyonel destek."
        />
      </ScrollReveal>

      <ScrollReveal delay={120}>
      <GlassCard className="overflow-hidden p-8 sm:p-12">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white/50 shadow-xl sm:h-40 sm:w-40">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <svg className="h-16 w-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{name}</h3>
            <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">{title}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{bio}</p>

            {badges.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full glass-subtle px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-6 sm:justify-start">
              {patientCount && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{patientCount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hasta</p>
                  </div>
                  <div className="h-8 w-px bg-slate-300/50 dark:bg-slate-600/60" />
                </>
              )}
              {rating && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{rating}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Puan</p>
                  </div>
                  <div className="h-8 w-px bg-slate-300/50 dark:bg-slate-600/60" />
                </>
              )}
              {years > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{years}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yıl Deneyim</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
      </ScrollReveal>
    </section>
  );
}
