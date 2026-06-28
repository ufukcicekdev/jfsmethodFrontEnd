"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { isStaffUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    router.replace(isStaffUser(user) ? "/panel" : "/hesabim");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const loggedInUser = await login(form.username, form.password);
      router.push(isStaffUser(loggedInUser) ? "/panel" : "/hesabim");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Giriş başarısız. Bilgilerinizi kontrol edin."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FluidBackground />
      <div className="relative flex min-h-screen flex-col px-4 py-8 sm:px-6">
        <header className="mx-auto flex w-full max-w-md items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100"
          >
            JFS Method
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Ana Sayfa
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Giriş Yap
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Hasta veya yönetici hesabınızla giriş yapın.
            </p>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                label="Kullanıcı Adı"
                name="username"
                type="text"
                placeholder="kullanici_adi"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />

              <div>
                <FormField
                  label="Şifre"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <div className="mt-1 text-right">
                  <Link
                    href="/sifremi-unuttum"
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Şifremi unuttum
                  </Link>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full rounded-full bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Hesabınız yok mu?{" "}
              <Link
                href="/#kayit"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Kayıt olun
              </Link>
            </p>
          </GlassCard>
        </main>
      </div>
    </>
  );
}
