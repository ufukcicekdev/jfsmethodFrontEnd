"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type ContactMessage } from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesPage() {
  const confirm = useConfirm();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .contactMessages(token)
      .then((res) => setMessages(res.messages))
      .catch(() => setError("Mesajlar yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (msg: ContactMessage) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const updated = await api.admin.markMessageRead(
        token,
        msg.id,
        !msg.is_read
      );
      setMessages((items) =>
        items.map((m) => (m.id === msg.id ? updated : m))
      );
    } catch {
      setError("İşlem başarısız.");
    }
  };

  const remove = async (id: number) => {
    const ok = await confirm({
      title: "Mesajı sil",
      message: "Bu mesajı silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.deleteMessage(token, id);
      setMessages((items) => items.filter((m) => m.id !== id));
    } catch {
      setError("Mesaj silinemedi.");
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          İletişim Mesajları
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white align-middle">
              {unreadCount} yeni
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Anasayfadaki iletişim formundan gelen mesajlar.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : messages.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Henüz mesaj yok.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <GlassCard
              key={msg.id}
              className={`p-4 sm:p-5 ${
                msg.is_read ? "" : "border-l-4 border-l-blue-500"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {msg.name}
                    {!msg.is_read && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        Yeni
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(msg.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRead(msg)}
                    className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
                  >
                    {msg.is_read ? "Okunmadı yap" : "Okundu işaretle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(msg.id)}
                    className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {msg.subject && (
                <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {msg.subject}
                </p>
              )}
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                {msg.message}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                {msg.email && (
                  <a
                    href={`mailto:${msg.email}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    ✉️ {msg.email}
                  </a>
                )}
                {msg.phone && (
                  <>
                    <a
                      href={`tel:${msg.phone.replace(/\s/g, "")}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      📞 {msg.phone}
                    </a>
                    <a
                      href={`https://wa.me/${msg.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Merhaba ${msg.name}, iletişim formunuz için dönüş yapıyorum.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                    >
                      WhatsApp ile yanıtla
                    </a>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
