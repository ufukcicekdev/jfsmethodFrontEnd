"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { useConfirm } from "@/components/providers/ConfirmProvider";
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

async function downloadFile(url: string) {
  const name = url.split("/").pop()?.split("?")[0] || "dosya";
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function DownloadButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        downloadFile(url);
      }}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-90 backdrop-blur-sm transition-opacity hover:bg-black/70"
      title="İndir"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
      </svg>
    </button>
  );
}

function Bubble({
  message,
  own,
  onEdit,
  onDelete,
}: {
  message: ChatMessage;
  own: boolean;
  onEdit?: (m: ChatMessage) => void;
  onDelete?: (m: ChatMessage) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const canAct = own && !message.is_deleted && (onEdit || onDelete);
  const canEdit = onEdit && message.message_type === "text";

  if (message.is_deleted) {
    return (
      <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] rounded-2xl bg-slate-100 px-3 py-2 text-sm italic text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
          🚫 Bu mesaj silindi
        </div>
      </div>
    );
  }

  const base = "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm break-words";
  const color = own
    ? "bg-blue-500 text-white rounded-br-md"
    : "bg-white text-slate-800 rounded-bl-md ring-1 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/60";

  return (
    <div className={`group flex items-center gap-1 ${own ? "justify-end" : "justify-start"}`}>
      {canAct && own && (
        <div className="relative order-first" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition-opacity hover:bg-slate-200/70 group-hover:opacity-100 max-md:opacity-100 dark:hover:bg-slate-700"
            title="Seçenekler"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-slate-200/70 bg-white py-1 shadow-xl dark:border-slate-700/60 dark:bg-slate-900">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(message);
                  }}
                  className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ✏️ Düzenle
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(message);
                }}
                className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                🗑️ Sil
              </button>
            </div>
          )}
        </div>
      )}
      <div className={`${base} ${color}`}>
        {message.message_type === "image" && message.attachment_url && (
          <div className="relative mb-1">
            <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.attachment_url}
                alt="Görsel"
                className="max-h-64 w-full rounded-xl object-cover"
              />
            </a>
            <DownloadButton url={message.attachment_url} />
          </div>
        )}
        {message.message_type === "video" && message.attachment_url && (
          <div className="relative mb-1">
            <video
              src={message.attachment_url}
              controls
              className="max-h-72 w-full rounded-xl"
            />
            <DownloadButton url={message.attachment_url} />
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        <div
          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
            own ? "text-blue-100" : "text-slate-400"
          }`}
        >
          {message.edited_at && <span className="italic">düzenlendi</span>}
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
  onEditMessage,
  onDeleteMessage,
  loading = false,
  emptyText = "Henüz mesaj yok. İlk mesajı gönderin.",
  header,
}: {
  messages: ChatMessage[];
  ownSide: "staff" | "patient";
  onSendText: (text: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onEditMessage?: (id: number, text: string) => Promise<void>;
  onDeleteMessage?: (id: number) => Promise<void>;
  loading?: boolean;
  emptyText?: string;
  header?: ReactNode;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const confirm = useConfirm();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const lastIdRef = useRef(0);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const lastId = messages.at(-1)?.id ?? 0;
    const isNew = lastId > lastIdRef.current;
    lastIdRef.current = lastId;
    if (nearBottomRef.current || isNew) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const startEdit = (m: ChatMessage) => {
    setEditing(m);
    setText(m.text);
  };

  const cancelEdit = () => {
    setEditing(null);
    setText("");
  };

  const submitText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setErr("");
    try {
      if (editing && onEditMessage) {
        await onEditMessage(editing.id, value);
        setEditing(null);
      } else {
        await onSendText(value);
      }
      setText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (m: ChatMessage) => {
    if (!onDeleteMessage) return;
    const ok = await confirm({
      title: "Mesajı sil",
      message: "Bu mesajı silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await onDeleteMessage(m.id);
      if (editing?.id === m.id) cancelEdit();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Silinemedi.");
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
      {header && (
        <div className="shrink-0 border-b border-slate-200/70 dark:border-slate-700/60">
          {header}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-2 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-4 dark:bg-slate-950/30"
      >
        {loading && messages.length === 0 ? (
          <div className="flex min-h-full items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-400 dark:bg-blue-950/40 dark:text-blue-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="max-w-[240px] text-sm text-slate-400">{emptyText}</p>
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
                  <div className="flex justify-center py-1">
                    <span className="rounded-full bg-slate-200/80 px-3 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                      {day}
                    </span>
                  </div>
                )}
                <Bubble
                  message={m}
                  own={own}
                  onEdit={onEditMessage ? startEdit : undefined}
                  onDelete={onDeleteMessage ? handleDelete : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {err && <p className="px-4 pt-1 text-xs text-red-500">{err}</p>}

      {editing && (
        <div className="flex items-center justify-between border-t border-blue-200/60 bg-blue-50/70 px-4 py-1.5 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
          <span className="truncate">✏️ Mesaj düzenleniyor</span>
          <button
            type="button"
            onClick={cancelEdit}
            className="shrink-0 font-semibold hover:underline"
          >
            İptal
          </button>
        </div>
      )}

      <div className="relative shrink-0 border-t border-slate-200/70 bg-white/80 p-2 dark:border-slate-700/60 dark:bg-slate-900/60">
        {showEmoji && (
          <EmojiPicker
            onPick={(e) => setText((t) => t + e)}
            onClose={() => setShowEmoji(false)}
          />
        )}
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-end gap-1 rounded-3xl border border-slate-200/80 bg-white px-2 py-1 focus-within:border-blue-400 dark:border-slate-700/60 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Emoji"
            >
              😊
            </button>
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
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            {!editing && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                title="Fotoğraf / Video ekle"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            )}
          </div>
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
          <button
            type="button"
            onClick={submitText}
            disabled={sending || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600 disabled:opacity-40"
            title={editing ? "Kaydet" : "Gönder"}
          >
            {sending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : editing ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
