"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { label: "En Yeni", value: "newest" },
  { label: "En Çok Okunan", value: "popular" },
];

export function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  const set = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/blog?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => set(tab.value)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            current === tab.value
              ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
