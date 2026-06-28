"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { KvkkConsentCheckboxes } from "@/components/kvkk/KvkkConsentCheckboxes";
import { KvkkLegalModal } from "@/components/kvkk/KvkkLegalModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useKvkkConsent } from "@/hooks/useKvkkConsent";
import { setTokens } from "@/lib/auth";
import { api } from "@/lib/api";

export function RegisterSection() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    kvkkAccepted,
    acikRizaAccepted,
    setKvkkAccepted,
    setAcikRizaAccepted,
    isValid,
    legalModal,
    openLegalModal,
    closeLegalModal,
    reset,
  } = useKvkkConsent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      const result = await api.auth.register({
        ...form,
        kvkk_accepted: kvkkAccepted,
        acik_riza_accepted: acikRizaAccepted,
      });
      setTokens(result.access, result.refresh);
      await refreshUser();
      reset();
      router.push("/hesabim");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kayit" className="relative mx-auto max-w-xl px-6 py-24">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Hemen Kayıt Ol
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Kayıt sonrası hesabınıza yönlendirilir, randevu ve takibinizi oradan
          yaparsınız.
        </p>
      </div>

      <GlassCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Ad"
              name="first_name"
              type="text"
              placeholder="Adınız"
              autoComplete="given-name"
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
            />
            <FormField
              label="Soyad"
              name="last_name"
              type="text"
              placeholder="Soyadınız"
              autoComplete="family-name"
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
            />
          </div>

          <FormField
            label="Kullanıcı Adı"
            name="username"
            type="text"
            placeholder="ornek_kullanici"
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
          />

          <FormField
            label="E-posta"
            name="email"
            type="email"
            placeholder="ornek@email.com"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
          />

          <FormField
            label="Şifre"
            name="password"
            type="password"
            placeholder="En az 8 karakter"
            required
            minLength={8}
            autoComplete="new-password"
            hint="Minimum 8 karakter kullanın."
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />

          <KvkkConsentCheckboxes
            kvkkAccepted={kvkkAccepted}
            acikRizaAccepted={acikRizaAccepted}
            onKvkkChange={setKvkkAccepted}
            onAcikRizaChange={setAcikRizaAccepted}
            onOpenAydinlatma={() => openLegalModal("aydinlatma")}
            onOpenAcikRiza={() => openLegalModal("acik_riza")}
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-full bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Kaydediliyor…" : "Hemen Kayıt Ol"}
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Giriş yapın
            </Link>
          </p>
        </form>
      </GlassCard>

      {legalModal && (
        <KvkkLegalModal type={legalModal} onClose={closeLegalModal} />
      )}
    </section>
  );
}
