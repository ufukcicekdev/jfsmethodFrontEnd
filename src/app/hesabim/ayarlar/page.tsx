"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  isFirebaseConfigured,
  pushSupported,
  requestPushToken,
} from "@/lib/firebase/messaging";

export default function AyarlarPage() {
  // --- Bildirim durumu ---
  const [pushSupport, setPushSupport] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFirebaseConfigured()) return;
    pushSupported().then((ok) => {
      setPushSupport(ok);
      if (ok) setPermission(Notification.permission);
    });
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    const token = getAccessToken();
    if (!token) { setPushLoading(false); return; }

    const fcmToken = await requestPushToken();
    setPermission(Notification.permission);

    if (!fcmToken) {
      setPushMessage(
        Notification.permission === "denied"
          ? "Tarayıcı bildirimleri engellendi. Tarayıcı site ayarlarından izin verin."
          : "Bildirim izni alınamadı."
      );
      setPushLoading(false);
      return;
    }

    try {
      await api.devices.register(token, fcmToken);
      setPushMessage("Bildirimler açıldı.");
    } catch {
      setPushMessage("Kayıt sırasında hata oluştu.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    const token = getAccessToken();
    if (!token) { setPushLoading(false); return; }

    const { requestPushToken: rpt } = await import("@/lib/firebase/messaging");
    const fcmToken = await rpt();
    if (fcmToken) {
      try { await api.devices.unregister(token, fcmToken); } catch { /* ignore */ }
    }
    setPushMessage("Bildirimler devre dışı bırakıldı. Tarayıcı iznini tamamen kaldırmak için site ayarlarını kullanın.");
    setPushLoading(false);
  };

  // --- Şifre ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== newPasswordRepeat) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setPasswordLoading(true);
    try {
      await api.auth.changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Şifre değiştirilemedi.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Hesap güvenlik ayarlarınızı yönetin.
        </p>
      </div>

      {/* Bildirimler */}
      {pushSupport !== false && (
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Push Bildirimleri
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {permission === "granted"
                  ? "Bildirimler açık. Diyet, egzersiz ve duyuru bildirimlerini alıyorsunuz."
                  : permission === "denied"
                  ? "Tarayıcı bildirimleri engellendi. Açmak için tarayıcı site ayarlarını kullanın."
                  : "Bildirim alarak program güncellemelerinden anında haberdar olun."}
              </p>
              {pushMessage && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">{pushMessage}</p>
              )}
            </div>
            <div className="shrink-0">
              {permission === "granted" ? (
                <button
                  type="button"
                  onClick={handleDisablePush}
                  disabled={pushLoading}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {pushLoading ? "…" : "Kapat"}
                </button>
              ) : permission !== "denied" ? (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                >
                  {pushLoading ? "…" : "Aç"}
                </button>
              ) : null}
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Şifre Değiştir
        </h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mevcut Şifre
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Yeni Şifre
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              required
              value={newPasswordRepeat}
              onChange={(e) => setNewPasswordRepeat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </div>

          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
              Şifreniz başarıyla değiştirildi.
            </p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-600 disabled:opacity-60"
          >
            {passwordLoading ? "Kaydediliyor…" : "Şifreyi Güncelle"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
