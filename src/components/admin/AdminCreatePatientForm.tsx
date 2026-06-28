"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";

interface AdminCreatePatientFormProps {
  onCreated: () => void;
  onClose: () => void;
}

export function AdminCreatePatientForm({
  onCreated,
  onClose,
}: AdminCreatePatientFormProps) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    if (!form.first_name.trim()) {
      setError("Ad zorunludur.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await api.admin.createPatient(token, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim() || undefined,
      });
      onCreated();
      if (result.generated_password) {
        setCredentials({
          username: result.username,
          password: result.generated_password,
        });
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğrenci eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (credentials) {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 sm:p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
          Öğrenci eklendi
        </h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          Otomatik bir şifre oluşturuldu. Lütfen öğrenciye iletin (bu bilgi
          tekrar gösterilmeyecek):
        </p>
        <div className="rounded-xl bg-white/70 px-4 py-3 text-sm dark:bg-slate-900/50">
          <p className="text-slate-700 dark:text-slate-200">
            Kullanıcı adı:{" "}
            <strong className="font-mono">{credentials.username}</strong>
          </p>
          <p className="mt-1 text-slate-700 dark:text-slate-200">
            Şifre:{" "}
            <strong className="font-mono">{credentials.password}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Tamam
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/60 p-4 sm:p-5 dark:border-slate-600/50 dark:bg-slate-800/40"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Yeni Öğrenci Ekle
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Kapat
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Ad"
          name="first_name"
          required
          value={form.first_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, first_name: e.target.value }))
          }
        />
        <FormField
          label="Soyad"
          name="last_name"
          value={form.last_name}
          onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="E-posta (opsiyonel)"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <FormField
          label="Telefon (opsiyonel)"
          name="phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>

      <FormField
        label="Şifre (opsiyonel — boş bırakılırsa otomatik oluşturulur)"
        name="password"
        type="text"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Ekleniyor…" : "Öğrenci Ekle"}
      </button>
    </form>
  );
}
