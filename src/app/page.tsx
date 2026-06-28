"use client";

import { useEffect, useState } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { Navbar } from "@/components/layout/Navbar";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { DigitalTwinPanel } from "@/components/sections/DigitalTwinPanel";
import { ExpertProfile } from "@/components/sections/ExpertProfile";
import { FaqSection } from "@/components/sections/FaqSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksGrid } from "@/components/sections/HowItWorksGrid";
import { ContactSection } from "@/components/sections/ContactSection";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { RegisterSection } from "@/components/sections/RegisterSection";
import { StatsStrip } from "@/components/sections/StatsStrip";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { TreatmentsGrid } from "@/components/sections/TreatmentsGrid";
import { TrustMarquee } from "@/components/sections/TrustMarquee";
import { AboutSection } from "@/components/sections/AboutSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { PWABanner } from "@/components/ui/PWABanner";
import { api, type SiteSettings } from "@/lib/api";

const ALL_ON: Partial<SiteSettings> = {
  section_stats: true, section_marquee: true, section_about: true,
  section_services: true, section_digital_twin: true, section_treatments: true,
  section_how_it_works: true, section_why_us: true, section_testimonials: true,
  section_packages: true, section_cta: true, section_faq: true,
  registration_enabled: true,
};

export default function Home() {
  const [s, setS] = useState<Partial<SiteSettings>>(ALL_ON);

  useEffect(() => {
    api.site.settings().then(setS).catch(() => {});
  }, []);

  const show = (key: keyof SiteSettings) => s[key] !== false;

  return (
    <>
      <FluidBackground />
      <Navbar />
      <main>
        <HeroSection />
        {show("section_stats") && <StatsStrip />}
        {show("section_marquee") && <TrustMarquee />}
        {show("section_about") && <AboutSection />}
        {show("section_services") && <ServicesSection />}
        {show("section_digital_twin") && <DigitalTwinPanel />}
        {show("section_treatments") && <TreatmentsGrid />}
        {show("section_how_it_works") && <HowItWorksGrid />}
        {show("section_why_us") && <WhyUsSection />}
        {show("section_testimonials") && <TestimonialsSection />}
        <ExpertProfile />
        {show("section_cta") && <CtaBanner />}
        {show("section_packages") && <PackagesSection />}
        {show("registration_enabled") && <RegisterSection />}
        {show("section_faq") && <FaqSection />}
        <ContactSection />
        <PWABanner />
      </main>
      <footer className="border-t border-white/20 bg-white/20 py-10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">JFS Method</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} JFS Method. Fizyoterapi Sonrası Hareket Danışmanlığı.
          </p>
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
            <a href="#hakkimizda" className="hover:text-blue-600 dark:hover:text-blue-400">Hakkımızda</a>
            <a href="#hizmetler" className="hover:text-blue-600 dark:hover:text-blue-400">Hizmetler</a>
            <a href="#neden-biz" className="hover:text-blue-600 dark:hover:text-blue-400">Neden JFS?</a>
            <a href="#paketler" className="hover:text-blue-600 dark:hover:text-blue-400">Paketler</a>
            <a href="#sss" className="hover:text-blue-600 dark:hover:text-blue-400">SSS</a>
            <a href="#iletisim" className="hover:text-blue-600 dark:hover:text-blue-400">İletişim</a>
          </div>
        </div>
      </footer>
    </>
  );
}
