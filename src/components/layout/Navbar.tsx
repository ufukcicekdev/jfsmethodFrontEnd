"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { isStaffUser } from "@/lib/auth";

const NAV_LINKS = [
  { href: "#hakkimizda", label: "Hakkımızda" },
  { href: "#hizmetler", label: "Hizmetler" },
  { href: "#neden-biz", label: "Neden JFS?" },
  { href: "#paketler", label: "Paketler" },
  { href: "#iletisim", label: "İletişim" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-1">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 backdrop-blur-md">
        <Link href="/" className="font-display text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
          JFS <span className="text-emerald-600 dark:text-emerald-400">Method</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <DarkModeToggle />

          {user && isStaffUser(user) && (
            <Link
              href="/panel"
              className="hidden rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/60 sm:inline-block dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              Panel
            </Link>
          )}
          {user && !isStaffUser(user) && (
            <Link
              href="/hesabim"
              className="hidden rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/60 sm:inline-block dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              Hesabım
            </Link>
          )}

          {user ? (
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/60 sm:inline-block dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              Çıkış
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/60 sm:inline-block dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="hidden rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 sm:inline-block"
              >
                Kayıt Ol
              </Link>
            </>
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full glass-subtle md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menüyü aç"
          >
            <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mx-4 mb-4 rounded-2xl glass p-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="border-t border-white/20 pt-3">
              {user ? (
                <>
                  {isStaffUser(user) ? (
                    <Link
                      href="/panel"
                      className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Yönetim Paneli
                    </Link>
                  ) : (
                    <Link
                      href="/hesabim"
                      className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Hesabım
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="block w-full py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="block rounded-full border border-slate-300/60 px-5 py-2.5 text-center text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    className="block rounded-full bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
