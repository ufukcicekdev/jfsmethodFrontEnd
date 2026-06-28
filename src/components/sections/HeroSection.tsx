import { Model3DCanvas } from "@/components/ui/Model3DCanvas";

const HERO_CHIPS = [
  { label: "3D Anatomi", color: "from-blue-500/20 to-blue-500/5" },
  { label: "Uzman Destek", color: "from-emerald-500/20 to-emerald-500/5" },
  { label: "Anlık BMI", color: "from-cyan-500/20 to-cyan-500/5" },
];

export function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-12 overflow-hidden px-6 pb-16 pt-28 lg:flex-row lg:items-center lg:gap-16 lg:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      >
        <span className="font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-slate-900/[0.04] dark:text-white/[0.04]">
          JFS
        </span>
      </div>

      <div className="relative z-10 flex-1 space-y-7">
        <div className="font-eyebrow animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-1.5 text-[11px] font-medium tracking-widest text-emerald-700 uppercase dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Fizyoterapi Sonrası Hareket Danışmanlığı
        </div>

        <h1 className="font-display animate-fade-up animation-delay-100 text-[3.25rem] font-black uppercase leading-[0.95] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[4.5rem] lg:text-[5.5rem]">
          Ağrısız.
          <br />
          <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            Güçlü.
          </span>
          <br />
          Sürdürülebilir.
        </h1>

        <p className="animate-fade-up animation-delay-200 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
          Vücudu yeniden güvenli, güçlü ve sürdürülebilir bir yapıya
          kavuşturmak için bilimsel temelli dijital takip ve hareket danışmanlığı.
        </p>

        <div className="animate-fade-up animation-delay-300 flex flex-wrap gap-3">
          <a
            href="#iletisim"
            className="group relative overflow-hidden rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:bg-emerald-700 hover:shadow-emerald-600/50"
          >
            <span className="relative z-10">Ön Görüşme Al</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </a>
          <a
            href="#hizmetler"
            className="rounded-full glass px-8 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:scale-105 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Hizmetleri İncele
          </a>
          <a
            href="https://wa.me/905000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50/80 px-6 py-3.5 text-sm font-semibold text-emerald-700 transition-all hover:scale-105 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
        </div>

        <div className="animate-fade-up animation-delay-400 flex flex-wrap gap-3 pt-1">
          {HERO_CHIPS.map((chip) => (
            <span
              key={chip.label}
              className={`font-eyebrow rounded-full border border-white/40 bg-gradient-to-r ${chip.color} px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-slate-600 backdrop-blur-sm dark:border-slate-600/40 dark:text-slate-300`}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="animate-fade-up animation-delay-200 relative flex flex-1 items-center justify-center">
        <div className="relative h-[420px] w-full max-w-lg lg:h-[540px]">
          <div className="animate-pulse-glow absolute inset-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 blur-3xl" />
          <div className="absolute -left-4 top-12 z-10 hidden animate-float rounded-2xl glass-subtle px-4 py-3 sm:block">
            <p className="font-eyebrow text-[9px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Canlı Takip
            </p>
            <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">%98 Memnuniyet</p>
          </div>
          <div className="absolute -right-2 bottom-24 z-10 hidden animate-float-reverse rounded-2xl glass-subtle px-4 py-3 sm:block">
            <p className="font-eyebrow text-[9px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Dijital İkiz
            </p>
            <p className="font-display text-xl font-bold text-blue-600 dark:text-blue-400">3D Anatomi</p>
          </div>

          <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/30 shadow-2xl shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-cyan-50/30 dark:from-emerald-900/10 dark:to-cyan-900/10" />
            <Model3DCanvas variant="hero" className="relative h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
