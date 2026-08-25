"use client";

import Link from "next/link";

/**
 * Her zaman görünür sohbet kısayolu + okunmamış mesaj rozeti (WhatsApp tarzı).
 * Header/toolbar içinde bildirim zilinin yanında kullanılır.
 */
export function ChatIndicator({ href, count }: { href: string; count: number }) {
  return (
    <Link
      href={href}
      aria-label="Mesajlar"
      title="Mesajlar"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/60 bg-white/60 text-slate-700 transition-colors hover:bg-white dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
