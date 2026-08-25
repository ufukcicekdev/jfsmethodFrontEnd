"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatBox } from "@/components/chat/ChatBox";
import { getAccessToken } from "@/lib/auth";
import { api, type ChatMessage } from "@/lib/api";

const POLL_MS = 4000;

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastIdRef = useRef(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    api.chat
      .thread(token)
      .then((res) => {
        setMessages(res.messages);
        lastIdRef.current = res.messages.at(-1)?.id ?? 0;
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const poll = () => {
      const t = getAccessToken();
      if (!t) return;
      api.chat
        .thread(t, lastIdRef.current || undefined)
        .then((res) => {
          if (res.messages.length) {
            setMessages((prev) => [...prev, ...res.messages]);
            lastIdRef.current = res.messages.at(-1)!.id;
          }
        })
        .catch(() => {});
    };
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleSendText = async (text: string) => {
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.chat.sendText(token, text);
    setMessages((prev) => [...prev, msg]);
    lastIdRef.current = msg.id;
  };

  const handleSendFile = async (file: File) => {
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.chat.sendFile(token, file);
    setMessages((prev) => [...prev, msg]);
    lastIdRef.current = msg.id;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Uzmanınızla birebir yazışın.
        </p>
      </div>

      <GlassCard className="h-[70vh] overflow-hidden">
        <ChatBox
          messages={messages}
          ownSide="patient"
          onSendText={handleSendText}
          onSendFile={handleSendFile}
          loading={loading}
          emptyText="Henüz mesaj yok. Uzmanınıza ilk mesajı gönderin."
        />
      </GlassCard>
    </div>
  );
}
