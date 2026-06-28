import { ScrollReveal } from "@/components/ui/ScrollReveal";

const STATS = [
  { value: "2.000+", label: "Mutlu Hasta", accent: "text-blue-600" },
  { value: "4.9", label: "Ortalama Puan", accent: "text-emerald-600" },
  { value: "3D", label: "Vücut Takibi", accent: "text-cyan-600" },
];

export function StatsStrip() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-8">
      <ScrollReveal>
        <div className="glass grid grid-cols-3 gap-px overflow-hidden rounded-3xl">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center bg-white/50 px-4 py-6 text-center backdrop-blur-sm dark:bg-slate-800/60 sm:py-8"
            >
              <span className={`text-2xl font-extrabold sm:text-3xl ${stat.accent} dark:brightness-125`}>
                {stat.value}
              </span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
