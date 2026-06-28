export function FluidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-float absolute -left-32 top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-300/70 to-teal-200/50 blur-3xl opacity-60 dark:from-emerald-600/30 dark:to-teal-700/20 dark:opacity-40"
        aria-hidden
      />
      <div
        className="animate-float-reverse absolute right-[-15%] top-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-sky-300/70 to-blue-200/50 blur-3xl opacity-60 dark:from-blue-600/25 dark:to-indigo-700/20 dark:opacity-40"
        aria-hidden
      />
      <div
        className="animate-float-slow absolute bottom-[-5%] left-[30%] h-[450px] w-[700px] rounded-full bg-gradient-to-tr from-cyan-200/60 to-emerald-200/40 blur-3xl opacity-50 dark:from-cyan-700/20 dark:to-emerald-800/15 dark:opacity-30"
        aria-hidden
      />
      <div
        className="animate-float absolute right-[20%] top-[60%] h-[350px] w-[350px] rounded-full bg-gradient-to-tl from-blue-300/50 to-indigo-200/40 blur-3xl opacity-40 dark:from-indigo-600/20 dark:to-purple-800/15 dark:opacity-25"
        aria-hidden
      />
    </div>
  );
}
