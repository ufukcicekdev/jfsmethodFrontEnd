"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type PatientNotification } from "@/lib/api";

const TYPE_STYLES: Record<string, string> = {
  appointment: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  exercise: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  diet_assigned: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  measurement_added: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(value).toLocaleDateString("tr-TR");
}

export default function BildirimlerPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await api.notifications.list(token);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notification: PatientNotification) => {
    const token = getAccessToken();
    if (!token) return;

    if (!notification.is_read) {
      try {
        await api.notifications.markRead(token, notification.id);
        setNotifications((items) =>
          items.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }

    if (notification.link && notification.link !== "#") {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.notifications.markAllRead(token);
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Bildirimler
          </h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {unreadCount} okunmamış bildiriminiz var.
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      <GlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Henüz bildirim yok.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !notification.is_read ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={`flex-1 ${notification.is_read ? "pl-5" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            TYPE_STYLES[notification.notification_type] ?? TYPE_STYLES.general
                          }`}
                        >
                          {notification.type_label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
