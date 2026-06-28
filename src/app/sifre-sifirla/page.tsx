"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { api } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (!uid || !token) {
      setError("Geçersiz sıfırlama bağlantısı.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.auth.resetPassword({ uid, token, new_password: password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Şifre güncellenemedi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!uid || !token) {
    return (
      <p className="text-center text-sm text-red-600">
        Geçersiz veya eksik sıfırlama bağlantısı.{" "}
        <Link href="/sifremi-unuttum" className="underline">
          Yeni bağlantı isteyin
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
        Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        label="Yeni şifre"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <FormField
        label="Yeni şifre (tekrar)"
        name="confirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {submitting ? "Kaydediliyor…" : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <FluidBackground />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
            Yeni Şifre Belirle
          </h1>
          <GlassCard className="p-6 sm:p-8">
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                </div>
              }
            >
              <ResetForm />
            </Suspense>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
