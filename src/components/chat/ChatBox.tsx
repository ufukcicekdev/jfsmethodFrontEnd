"use client";

import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import type { ChatMessage } from "@/lib/api";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value: string) {
  const d = new Date(value);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Bugün";
  if (d.toDateString() === yest.toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Bubble({ message, own }: { message: ChatMessage; own: boolean }) {
  const base =
    "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm break-words";
  const color = own
    ? "bg-blue-500 text-white rounded-br-sm"
    : "bg-white text-slate-800 rounded-bl-sm dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`${base} ${color}`}>
        {message.message_type === "image" && message.attachment_url && (
          <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachment_url}
              alt="Görsel"
              className="mb-1 max-h-64 w-full rounded-xl object-cover"
            />
          </a>
        )}
        {message.message_type === "video" && message.attachment_url && (
          <video
            src={message.attachment_url}
            controls
            className="mb-1 max-h-72 w-full rounded-xl"
          />
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        <div
          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
            own ? "text-blue-100" : "text-slate-400"
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {own && <span>{message.is_read ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}

export function ChatBox({
  messages,
  ownSide,
  onSendText,
  onSendFile,
  loading = false,
  emptyText = "Henüz mesaj yok. İlk mesajı gönderin.",
}: {
  messages: ChatMessage[];
  ownSide: "staff" | "patient";
  onSendText: (text: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  loading?: boolean;
  emptyText?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [err, setErr] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submitText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setErr("");
    try {
      await onSendText(value);
      setText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const submitFile = async (file: File) => {
    setSending(true);
    setErr("");
    try {
      await onSendFile(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Dosya gönderilemedi.");
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  let lastDay = "";

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4"
      >
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">{emptyText}</p>
          </div>
        ) : (
          messages.map((m) => {
            const day = formatDay(m.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const own =
              ownSide === "staff" ? m.is_from_staff : !m.is_from_staff;
            return (
              <div key={m.id} className="space-y-2">
                {showDay && (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-slate-200/70 px-3 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      {day}
                    </span>
                  </div>
                )}
                <Bubble message={m} own={own} />
              </div>
            );
          })
        )}
      </div>

      {err && (
        <p className="px-4 pb-1 text-xs text-red-500">{err}</p>
      )}

      <div className="relative border-t border-slate-200/70 p-2 dark:border-slate-700/60">
        {showEmoji && (
          <EmojiPicker
            onPick={(e) => setText((t) => t + e)}
            onClose={() => setShowEmoji(false)}
          />
        )}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Emoji"
          >
            😊
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Fotoğraf / Video ekle"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) submitFile(file);
            }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitText();
              }
            }}
            rows={1}
            placeholder="Mesaj yazın…"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={submitText}
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
            title="Gönder"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
