"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { isStaffUser } from "@/lib/auth";

export function AppointmentSection() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <section id="randevu" className="relative mx-auto max-w-xl px-6 py-24">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="randevu" className="relative mx-auto max-w-xl px-6 py-24">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Randevu Al
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Randevu alabilmek için önce sisteme kayıt olmanız ve giriş yapmanız
            gerekir. Kayıt sırasında e-posta adresiniz alınır; randevu
            bildirimleri bu adrese gönderilir.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#kayit"
              className="inline-block rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Kayıt Ol
            </a>
            <Link
              href="/login"
              className="inline-block rounded-full border border-blue-500/40 px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
            >
              Giriş Yap
            </Link>
          </div>
        </GlassCard>
      </section>
    );
  }

  if (isStaffUser(user)) {
    return (
      <section id="randevu" className="relative mx-auto max-w-xl px-6 py-24">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Randevu Al
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Yönetici hesabıyla randevu alınamaz. Hasta hesabınızla giriş yapın
            veya yeni kayıt olun.
          </p>
          <Link
            href="/panel"
            className="mt-6 inline-block rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Yönetim Paneli
          </Link>
        </GlassCard>
      </section>
    );
  }

  return (
    <section id="randevu" className="relative mx-auto max-w-xl px-6 py-24">
      <GlassCard className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Randevu Al
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Merhaba {user.full_name}! Randevu oluşturmak ve randevularınızı
          yönetmek için hesabınıza gidin.
        </p>
        <Link
          href="/hesabim/randevular"
          className="mt-6 inline-block rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Hesabıma Git
        </Link>
      </GlassCard>
    </section>
  );
}
