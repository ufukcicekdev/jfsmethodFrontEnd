"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatBox } from "@/components/chat/ChatBox";
import { getAccessToken } from "@/lib/auth";
import { api, type ChatConversation, type ChatMessage } from "@/lib/api";

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
  const [loadingThread, setLoadingThread] = useState(false);
  const lastIdRef = useRef(0);

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

  // Aktif sohbet için polling (yeni mesajları çek)
  useEffect(() => {
    if (selected == null) return;
    const poll = () => {
      const token = getAccessToken();
      if (!token) return;
      api.admin
        .chatThread(token, selected, lastIdRef.current || undefined)
        .then((res) => {
          if (res.messages.length) {
            setMessages((prev) => [...prev, ...res.messages]);
            lastIdRef.current = res.messages.at(-1)!.id;
          }
        })
        .catch(() => {});
    };
    const t = setInterval(poll, THREAD_POLL_MS);
    return () => clearInterval(t);
  }, [selected]);

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

      <GlassCard className="grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* Sohbet listesi */}
        <div
          className={`flex flex-col border-slate-200/70 md:border-r dark:border-slate-700/60 ${
            selected != null ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="border-b border-slate-200/70 p-3 dark:border-slate-700/60">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sohbetler
            </p>
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
          className={`flex-col ${selected != null ? "flex" : "hidden md:flex"}`}
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
                  loading={loadingThread}
                />
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
