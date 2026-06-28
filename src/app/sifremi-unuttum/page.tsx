"use client";

import Link from "next/link";
import { useState } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "İşlem başarısız. Tekrar deneyin."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FluidBackground />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link
              href="/"
              className="text-lg font-bold text-slate-800 dark:text-slate-100"
            >
              JFS Method
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
              Şifremi Unuttum
            </h1>
          </div>

          <GlassCard className="p-6 sm:p-8">
            {sent ? (
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  E-posta adresiniz kayıtlıysa şifre sıfırlama bağlantısı
                  gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Giriş sayfasına dön
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Kayıtlı e-posta adresinizi girin; size sıfırlama bağlantısı
                  gönderelim.
                </p>
                <FormField
                  label="E-posta"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? "Gönderiliyor…" : "Bağlantı Gönder"}
                </button>
                <Link
                  href="/login"
                  className="block text-center text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Girişe dön
                </Link>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}
