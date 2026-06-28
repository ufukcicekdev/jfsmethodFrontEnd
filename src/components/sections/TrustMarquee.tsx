const ITEMS = [
  "3D Dijital İkiz",
  "Uzman Fizyoterapist",
  "PWA Egzersiz Kütüphanesi",
  "Anlık BMI Takibi",
  "Online Randevu",
  "Kişiselleştirilmiş Tedavi",
  "7/24 Mobil Erişim",
];

export function TrustMarquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section className="relative overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f8fafc] to-transparent dark:from-[#0b1120]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f8fafc] to-transparent dark:from-[#0b1120]" />

      <div className="flex animate-marquee gap-4 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-5 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-800/60 dark:text-slate-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
