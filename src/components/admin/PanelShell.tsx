"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useAuth } from "@/components/providers/AuthProvider";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { isStaffUser } from "@/lib/auth";

const NAV_ITEMS = [
  {
    href: "/panel",
    label: "Genel Bakış",
    exact: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/panel/ogrenciler",
    label: "Öğrenciler",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/panel/egzersizler",
    label: "Egzersizler",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: "/panel/paketler",
    label: "Paketler",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/panel/mesajlar",
    label: "Mesajlar",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/panel/diyet",
    label: "Diyet",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/panel/bildirim-gonder",
    label: "Bildirim Gönder",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: "/panel/ayarlar",
    label: "Ayarlar",
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      {open ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  );
}

function SidebarContent({
  user,
  pathname,
  onNavigate,
  onLogout,
}: {
  user: { full_name: string };
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100"
      >
        JFS Method
      </Link>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Yönetim Paneli
      </p>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
        {user.full_name}
      </p>

      <nav className="mt-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-600/50">
        <span className="text-xs text-slate-500 dark:text-slate-400">Tema</span>
        <DarkModeToggle />
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
        >
          Ana Sayfa
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Çıkış Yap
        </button>
      </div>
    </>
  );
}

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isStaffUser(user)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading || !user || !isStaffUser(user)) {
    return (
      <>
        <FluidBackground />
        <Spinner />
      </>
    );
  }

  return (
    <>
      <FluidBackground />
      <div className="relative min-h-screen pb-6">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/70 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300/60 bg-white/80 text-slate-700 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-200"
              aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                JFS Method
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                Yönetim Paneli
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DarkModeToggle />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Menüyü kapat"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-[min(100vw-3rem,280px)] overflow-y-auto border-r border-white/30 bg-white/95 p-5 shadow-xl backdrop-blur-xl dark:border-slate-600/40 dark:bg-slate-900/95">
              <SidebarContent
                user={user}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:w-64 lg:shrink-0">
              <div className="sticky top-6 rounded-2xl border border-white/30 bg-white/50 p-5 backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/50">
                <SidebarContent
                  user={user}
                  pathname={pathname}
                  onLogout={handleLogout}
                />
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <div className="mb-4 hidden items-center justify-end gap-2 lg:mb-6 lg:flex">
                <DarkModeToggle />
                <NotificationBell />
              </div>
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
