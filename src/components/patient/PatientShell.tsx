"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { PatientNotificationBell } from "@/components/patient/PatientNotificationBell";
import { useAuth } from "@/components/providers/AuthProvider";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { isStaffUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/hesabim", label: "Genel Bakış", exact: true },
  { href: "/hesabim/randevular", label: "Randevular", exact: false },
  { href: "/hesabim/paketler", label: "Paketlerim", exact: false },
  { href: "/hesabim/profil", label: "Profil & Kilo", exact: false },
  { href: "/hesabim/diyet", label: "Diyet Planım", exact: false },
  { href: "/hesabim/dijital-ikiz", label: "Tedavi İkizi", exact: false },
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
  user: { full_name: string; email: string };
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
        Hesabım
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
        {user.full_name}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>

      <nav className="mt-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
            }`}
          >
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

export function PatientShell({ children }: { children: ReactNode }) {
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
    if (isStaffUser(user)) {
      router.replace("/panel");
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading || !user || isStaffUser(user)) {
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
                Hesabım
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {user.full_name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DarkModeToggle />
              <PatientNotificationBell />
            </div>
          </div>
        </header>

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

        <div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
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
                <PatientNotificationBell />
              </div>
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
