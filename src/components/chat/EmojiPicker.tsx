"use client";

import { useEffect, useRef } from "react";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😅", "😉", "🙂",
  "😎", "🤩", "🥳", "😇", "🤗", "🤔", "😴", "😌", "😋", "😜",
  "😢", "😭", "😤", "😠", "😱", "😳", "🥺", "😬", "🙄", "😷",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👌", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🔥", "✨", "⭐", "🎉",
  "💯", "✅", "❌", "⚠️", "❓", "❗", "💧", "🏃", "🧘", "🥗",
  "🍎", "🥦", "🍗", "🥑", "🍳", "💊", "🩺", "📋", "📅", "⏰",
];

export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 z-20 grid max-h-56 w-64 grid-cols-8 gap-1 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          className="rounded-lg p-1 text-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
