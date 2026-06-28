export function FluidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sadece 2 top öncelikli blob, animasyon sadece büyük ekranlarda */}
      <div
        className="absolute -left-32 top-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-300/50 to-teal-200/40 blur-2xl opacity-50 motion-safe:sm:animate-float dark:from-emerald-600/20 dark:to-teal-700/15 dark:opacity-30"
        aria-hidden
      />
      <div
        className="absolute right-[-15%] top-[20%] h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-sky-300/50 to-blue-200/40 blur-2xl opacity-50 motion-safe:sm:animate-float-reverse dark:from-blue-600/20 dark:to-indigo-700/15 dark:opacity-30"
        aria-hidden
      />
    </div>
  );
}
