import { GlassCard } from "@/components/ui/GlassCard";

const FEATURES = [
  {
    icon: "🫀",
    title: "Bütüncül Hareket Sistemi",
    description:
      "Lenf sistemi desteği, kas aktivasyonu ve fonksiyonel egzersizleri modern cihaz teknolojileriyle birleştirerek kişiye özel programlar oluşturuyoruz.",
  },
  {
    icon: "🎯",
    title: "Detaylı Değerlendirme",
    description:
      "Her birey, detaylı değerlendirme sonrası kendi ihtiyacına göre yönlendirilir. Standart bir programa değil, özel bir plana dahil edilirsiniz.",
  },
  {
    icon: "🌐",
    title: "Online & Stüdyo Desteği",
    description:
      "Stüdyo içi uygulamaların yanı sıra online destek, grup programları ve evde sürdürülebilir sistemlerle bütüncül bir dönüşüm sunuyoruz.",
  },
];

export function AboutSection() {
  return (
    <section id="hakkimizda" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="font-eyebrow mb-4 inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-blue-700 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-300">
              Hakkımızda
            </span>
            <h2 className="font-display mt-4 text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              JFS Method Nedir?
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                JFS Method, fizik tedavi sonrası süreçte olan bireyler ve kronik ağrı yaşayan kişiler
                için geliştirilmiş bütüncül bir hareket ve iyileşme sistemidir.
              </p>
              <p>
                Bizim yaklaşımımız sadece egzersiz yaptırmak değil; vücudu yeniden güvenli, güçlü
                ve sürdürülebilir bir yapıya kavuşturmaktır.
              </p>
              <p>
                Ağrı, ödem, hareket kısıtlılığı veya fiziksel rahatsızlıklar nedeniyle yaşam
                kalitesi düşen bireylerin yeniden aktif, dinç ve özgüvenli bir bedene kavuşmasını
                hedefliyoruz.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            {FEATURES.map((feature, index) => (
              <GlassCard
                key={feature.title}
                className="group relative flex items-start gap-5 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="absolute -right-3 -top-3 text-6xl font-black text-white/20 transition-colors group-hover:text-blue-100/30 dark:text-white/10">
                  {index + 1}
                </div>
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="mb-1.5 font-bold text-slate-800 dark:text-slate-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
