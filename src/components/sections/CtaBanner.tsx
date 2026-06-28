import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function CtaBanner() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-16">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[2rem] p-px">
          <div className="absolute inset-0 animate-gradient-shift bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 opacity-80" />

          <div className="relative flex flex-col items-center gap-6 rounded-[calc(2rem-1px)] bg-white/90 px-8 py-12 text-center backdrop-blur-xl dark:bg-slate-900/90 sm:px-12 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Ücretsiz Ön Görüşme
            </p>
            <h2 className="max-w-xl text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              Yaşam kalitenizi bilimsel temellerle artırmaya hazır mısınız?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için
              hemen bir ön görüşme alın.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#iletisim"
                className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:bg-emerald-700 hover:shadow-emerald-600/50"
              >
                Ön Görüşme Al
              </a>
              <a
                href="#hizmetler"
                className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-400"
              >
                Hizmetleri İncele
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
