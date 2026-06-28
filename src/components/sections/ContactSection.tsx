"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField, FormGroup } from "@/components/ui/FormField";
import { api, type SiteSettings } from "@/lib/api";

const SOCIAL_LINKS: {
  key: keyof SiteSettings;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "instagram_url", label: "Instagram",
    color: "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 hover:border-transparent hover:text-white dark:hover:text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    key: "facebook_url", label: "Facebook",
    color: "hover:bg-blue-600 hover:border-transparent hover:text-white dark:hover:text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: "x_url", label: "X",
    color: "hover:bg-black hover:border-transparent hover:text-white dark:hover:bg-white dark:hover:text-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: "youtube_url", label: "YouTube",
    color: "hover:bg-red-600 hover:border-transparent hover:text-white dark:hover:text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    key: "linkedin_url", label: "LinkedIn",
    color: "hover:bg-blue-700 hover:border-transparent hover:text-white dark:hover:text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

export function ContactSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    api.site
      .settings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setFeedback({ type: "error", text: "Ad ve mesaj alanları zorunludur." });
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setFeedback({
        type: "error",
        text: "E-posta veya telefon bilgisinden en az birini girin.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await api.site.contact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setFeedback({ type: "success", text: result.detail });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Mesaj gönderilemedi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasContactInfo =
    settings &&
    (settings.address ||
      settings.phone ||
      settings.email ||
      settings.working_hours ||
      settings.map_embed_url);

  const socials = settings
    ? SOCIAL_LINKS.filter((s) => settings[s.key])
    : [];

  return (
    <section id="iletisim" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          İletişim
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sorularınız için bize ulaşın. En kısa sürede dönüş yapalım.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {settings?.clinic_name || "JFS Method"}
            </h3>

            {hasContactInfo ? (
              <ul className="mt-5 space-y-4 text-sm">
                {settings?.address && (
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-blue-500">📍</span>
                    <span className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                      {settings.address}
                    </span>
                  </li>
                )}
                {settings?.phone && (
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500">📞</span>
                    <a
                      href={`tel:${settings.phone.replace(/\s/g, "")}`}
                      className="text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                    >
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings?.whatsapp && (
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-500">💬</span>
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400"
                    >
                      WhatsApp: {settings.whatsapp}
                    </a>
                  </li>
                )}
                {settings?.email && (
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500">✉️</span>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                    >
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings?.working_hours && (
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-blue-500">🕒</span>
                    <span className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                      {settings.working_hours}
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                İletişim bilgileri yakında eklenecek.
              </p>
            )}

            {socials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={settings?.[s.key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition-all duration-200 dark:border-slate-600/60 dark:text-slate-400 ${s.color}`}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </GlassCard>

          {settings?.map_embed_url && (
            <GlassCard className="overflow-hidden p-0">
              <iframe
                src={settings.map_embed_url}
                title="Konum"
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </GlassCard>
          )}
        </div>

        <GlassCard className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Bize Yazın
          </h3>

          {feedback && (
            <p
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {feedback.text}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormField
              label="Ad Soyad"
              name="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="E-posta"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <FormField
                label="Telefon"
                name="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <FormField
              label="Konu"
              name="subject"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
            />
            <FormGroup label="Mesajınız" required>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </FormGroup>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor…" : "Mesajı Gönder"}
            </button>
          </form>
        </GlassCard>
      </div>
    </section>
  );
}
