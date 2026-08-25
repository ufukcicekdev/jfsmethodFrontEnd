import type { ChatMessage } from "@/lib/api";

/**
 * Canlı "son mesajlar" penceresini mevcut listeyle birleştirir.
 * Pencereden daha eski (yukarı kaydırınca yüklenmiş) mesajlar korunur;
 * pencere içindeki kısım yeni veriyle değiştirilir (düzenleme/silme/yeni mesaj).
 */
export function mergeRecent(
  prev: ChatMessage[],
  recent: ChatMessage[]
): ChatMessage[] {
  if (!recent.length) return prev;
  const minId = recent[0].id;
  const older = prev.filter((m) => m.id < minId);
  return [...older, ...recent];
}

/** Daha eski mesaj sayfasını listenin başına ekler (yinelenenleri atlar). */
export function prependOlder(
  prev: ChatMessage[],
  older: ChatMessage[]
): ChatMessage[] {
  const existing = new Set(prev.map((m) => m.id));
  const fresh = older.filter((m) => !existing.has(m.id));
  return [...fresh, ...prev];
}
