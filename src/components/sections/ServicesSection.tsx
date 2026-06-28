"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { api, type LandingService } from "@/lib/api";

const FALLBACK: LandingService[] = [
  { id: 1, icon: "📲", tag: "Ücretsiz", title: "Sosyal Medya & Canlı Yayınlar", description: "Sosyal medya kanallarımız ve canlı yayınlar aracılığıyla fizyoterapi sonrası hareket, ağrı yönetimi ve sağlıklı yaşam hakkında ücretsiz bilgilendirme içerikleri.", sort_order: 0, is_active: true },
  { id: 2, icon: "💬", tag: "Online", title: "WhatsApp Destek Grubu", description: "Aylık program takibi ve sorularınız için WhatsApp destek grubu üyeliği. Uzman desteğine her an ulaşın, ilerlemenizi birlikte takip edelim.", sort_order: 1, is_active: true },
  { id: 3, icon: "👥", tag: "Grup", title: "Grup Seansları", description: "Cihaz destekli sistem deneyimi için grup seansları. Aynı iyileşme sürecindeki bireylerle birlikte, motivasyonu yüksek ve verimli bir ortamda çalışın.", sort_order: 2, is_active: true },
  { id: 4, icon: "🎯", tag: "Bireysel", title: "Bireysel Seanslar", description: "Kişiye özel çalışma planı ve birebir uzman desteği. Detaylı vücut değerlendirmesi sonrası ihtiyacınıza özel program ile en hızlı ve güvenli ilerlemeyi sağlayın.", sort_order: 3, is_active: true },
];

export function ServicesSection() {
  const [services, setServices] = useState<LandingService[]>([]);

  useEffect(() => {
    api.landing.services().then((data) => setServices(data.length ? data : FALLBACK)).catch(() => setServices(FALLBACK));
  }, []);

  const items = services.length ? services : FALLBACK;

  return (
    <section id="hizmetler" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="font-eyebrow mb-4 inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-blue-700 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-300">
            Hizmetlerimiz
          </span>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Neler Sunuyoruz?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Her bütçeye ve ihtiyaca uygun esnek hizmet seçenekleri. İster ücretsiz içeriklerimizle
            başlayın, ister bireysel programla maksimum sonuç alın.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((service) => (
            <GlassCard
              key={service.id}
              className="group flex flex-col p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="text-4xl">{service.icon}</div>
                {service.tag && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {service.tag}
                  </span>
                )}
              </div>
              <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">
                {service.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {service.description}
              </p>
              <a
                href="#iletisim"
                className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-all group-hover:gap-2 dark:text-blue-400"
              >
                Bilgi Al
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
