"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatBox } from "@/components/chat/ChatBox";
import { getAccessToken } from "@/lib/auth";
import { api, type ChatMessage } from "@/lib/api";

const POLL_MS = 4000;

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tam senkron: her seferinde son mesajları çekip yerine koyar
    // (düzenleme/silme karşı tarafa da yansısın diye).
    const sync = (first = false) => {
      const token = getAccessToken();
      if (!token) return;
      api.chat
        .thread(token)
        .then((res) => setMessages(res.messages))
        .catch(() => {})
        .finally(() => {
          if (first) setLoading(false);
        });
    };
    sync(true);
    const timer = setInterval(() => sync(), POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleSendText = async (text: string) => {
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.chat.sendText(token, text);
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendFile = async (file: File) => {
    const token = getAccessToken();
    if (!token) return;
    const msg = await api.chat.sendFile(token, file);
    setMessages((prev) => [...prev, msg]);
  };

  const handleEdit = async (id: number, text: string) => {
    const token = getAccessToken();
    if (!token) return;
    const updated = await api.chat.editMessage(token, id, text);
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleDelete = async (id: number) => {
    const token = getAccessToken();
    if (!token) return;
    const updated = await api.chat.deleteMessage(token, id);
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  return (
    <GlassCard className="flex h-[calc(100dvh-9.5rem)] min-h-[440px] flex-col overflow-hidden">
      <ChatBox
        messages={messages}
        ownSide="patient"
        onSendText={handleSendText}
        onSendFile={handleSendFile}
        onEditMessage={handleEdit}
        onDeleteMessage={handleDelete}
        loading={loading}
        emptyText="Henüz mesaj yok. Uzmanınıza ilk mesajı gönderin."
        header={
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white shadow-sm">
              JFS
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                JFS Method
              </p>
              <p className="text-xs text-emerald-500">Uzman ekibiniz</p>
            </div>
          </div>
        }
      />
    </GlassCard>
  );
}
