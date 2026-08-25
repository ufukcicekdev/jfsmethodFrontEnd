"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatBox } from "@/components/chat/ChatBox";
import { useChatViewportHeight } from "@/hooks/useChatViewportHeight";
import { mergeRecent, prependOlder } from "@/lib/chat";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type AdminPatient,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/api";

const LIST_POLL_MS = 15000;
const THREAD_POLL_MS = 4000;

function relativeTime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const lastIdRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const vh = useChatViewportHeight(cardRef);

  const loadConversations = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    api.admin
      .chatConversations(token)
      .then((res) => setConversations(res.conversations))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  const openConversation = useCallback((patientId: number, name?: string) => {
    setSelected(patientId);
    if (name) setSelectedName(name);
    setMessages([]);
    lastIdRef.current = 0;
    setLoadingThread(true);
    const token = getAccessToken();
    if (!token) return;
    api.admin
      .chatThread(token, patientId)
      .then((res) => {
        setSelectedName(res.patient.name);
        setMessages(res.messages);
        setHasMore(res.has_more);
        lastIdRef.current = res.messages.at(-1)?.id ?? 0;
        // listedeki okunmamışı düş
        setConversations((prev) =>
          prev.map((c) =>
            c.patient_id === patientId ? { ...c, staff_unread: 0 } : c
          )
        );
      })
      .finally(() => setLoadingThread(false));
  }, []);

  // Push linkinden gelen ?ogrenci=<id> ile otomatik seçim
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("ogrenci");
    if (id && /^\d+$/.test(id)) openConversation(Number(id));
  }, [openConversation]);

  // Aktif sohbet için tam senkron polling (düzenleme/silme yansısın diye)
  useEffect(() => {
    if (selected == null) return;
    const poll = () => {
      const token = getAccessToken();
      if (!token) return;
      api.admin
        .chatThread(token, selected)
        .then((res) => {
          setMessages((prev) => mergeRecent(prev, res.messages));
          lastIdRef.current = res.messages.at(-1)?.id ?? lastIdRef.current;
        })
        .catch(() => {});
    };
    const t = setInterval(poll, THREAD_POLL_MS);
    return () => clearInterval(t);
  }, [selected]);

  const handleLoadOlder = async () => {
    if (selected == null || messages.length === 0) return;
    const token = getAccessToken();
    if (!token) return;
    const res = await api.admin.chatThread(token, selected, {
      before: messages[0].id,
    });
    setMessages((prev) => prependOlder(prev, res.messages));
    setHasMore(res.has_more);
  };

  const handleSendText = async (text: string) => {
    if (selected == null) return;
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.admin.chatSendText(token, selected, text);
    setMessages((prev) => [...prev, msg]);
    lastIdRef.current = msg.id;
    loadConversations();
  };

  const handleSendFile = async (file: File) => {
    if (selected == null) return;
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.admin.chatSendFile(token, selected, file);
    setMessages((prev) => [...prev, msg]);
    lastIdRef.current = msg.id;
    loadConversations();
  };

  const handleEdit = async (id: number, text: string) => {
    const token = getAccessToken();
    if (!token) return;
    const updated = await api.admin.chatEditMessage(token, id, text);
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    loadConversations();
  };

  const handleDelete = async (id: number) => {
    const token = getAccessToken();
    if (!token) return;
    await api.admin.chatDeleteMessage(token, id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    loadConversations();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Öğrencilerle birebir sohbet.
        </p>
      </div>

      <div
        ref={cardRef}
        style={vh ? { height: `${vh}px` } : undefined}
        className="glass grid h-[70vh] grid-cols-1 grid-rows-1 overflow-hidden rounded-3xl md:grid-cols-[300px_1fr]"
      >
        {/* Sohbet listesi */}
        <div
          className={`min-h-0 min-w-0 flex-col border-slate-200/70 md:border-r dark:border-slate-700/60 ${
            selected != null ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 p-3 dark:border-slate-700/60">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sohbetler
            </p>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Henüz sohbet yok.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.patient_id, c.patient_name)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                    selected === c.patient_id
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                    {c.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {c.patient_name}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {relativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {c.last_message_preview || "—"}
                      </p>
                      {c.staff_unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                          {c.staff_unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Aktif sohbet */}
        <div
          className={`min-h-0 min-w-0 flex-col ${selected != null ? "flex" : "hidden md:flex"}`}
        >
          {selected == null ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">
                Görüntülemek için bir sohbet seçin.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200/70 p-3 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
                  title="Geri"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                  {selectedName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {selectedName}
                </p>
              </div>
              <div className="min-h-0 flex-1">
                <ChatBox
                  messages={messages}
                  ownSide="staff"
                  onSendText={handleSendText}
                  onSendFile={handleSendFile}
                  onEditMessage={handleEdit}
                  onDeleteMessage={handleDelete}
                  onLoadOlder={handleLoadOlder}
                  hasMore={hasMore}
                  loading={loadingThread}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <NewChatModal
          onClose={() => setShowNew(false)}
          onPick={(p) => {
            setShowNew(false);
            openConversation(p.id, p.full_name || p.username);
          }}
        />
      )}
    </div>
  );
}

function NewChatModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (p: AdminPatient) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const handle = setTimeout(() => {
      api.admin
        .patients(token, search || undefined, 1, 20)
        .then((res) => setResults(res.results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/70 p-3 dark:border-slate-700/60">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Yeni sohbet — öğrenci seç
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya kullanıcı adı ara…"
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Öğrenci bulunamadı.
            </p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                  {(p.full_name || p.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {p.full_name || p.username}
                  </p>
                  <p className="truncate text-xs text-slate-400">@{p.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
