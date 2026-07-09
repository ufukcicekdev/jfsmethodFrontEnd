"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { getAccessToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ── Toolbar button helpers ────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-xs font-semibold transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />;
}

// ── Heading dropdown ──────────────────────────────────────────────────────────

function HeadingDropdown({ editor }: { editor: Editor }) {
  const current = [1, 2, 3].find((l) =>
    editor.isActive("heading", { level: l })
  );
  const label = current ? `H${current}` : "Normal";

  const options = [
    { label: "Normal metin", value: 0 },
    { label: "Başlık 1", value: 1 },
    { label: "Başlık 2", value: 2 },
    { label: "Başlık 3", value: 3 },
  ];

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex h-7 items-center gap-1 rounded px-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600 min-w-[72px] justify-between"
      >
        {label}
        <svg className="h-3 w-3 opacity-60" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10z" />
        </svg>
      </button>
      <div className="absolute left-0 top-full z-20 hidden group-hover:block pt-0.5">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 overflow-hidden min-w-[140px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: opt.value as 1 | 2 | 3 }).run();
                }
              }}
              className={`flex w-full items-center px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                (opt.value === 0 && !current) || current === opt.value
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {opt.value > 0 ? (
                <span className={`font-bold mr-2 ${opt.value === 1 ? "text-base" : opt.value === 2 ? "text-sm" : "text-xs"}`}>
                  H{opt.value}
                </span>
              ) : (
                <span className="mr-2 text-sm">¶</span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Image upload ──────────────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/admin/blog/upload-image/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error("Görsel yüklenemedi.");
  const data = await res.json();
  return data.url as string;
}

// ── Link modal ────────────────────────────────────────────────────────────────

function LinkButton({ editor }: { editor: Editor }) {
  const isActive = editor.isActive("link");

  const handleClick = () => {
    if (isActive) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL girin:", "https://");
    if (url) {
      editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
    }
  };

  return (
    <ToolBtn active={isActive} onClick={handleClick} title="Link ekle / kaldır">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </ToolBtn>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Yazı içeriğini buraya girin…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[320px] w-full px-5 py-4 text-sm text-slate-800 dark:text-slate-100 outline-none leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const handleImageFile = async (file: File) => {
    if (!editor) return;
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      alert("Görsel yüklenemedi.");
    }
  };

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-800/60">
        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Geri al">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Yinele">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
        </ToolBtn>

        <Divider />

        {/* Heading */}
        <HeadingDropdown editor={editor} />

        <Divider />

        {/* Text style */}
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Kalın">
          <span className="font-black text-sm">B</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="İtalik">
          <span className="italic font-semibold text-sm">İ</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Altı çizili">
          <span className="underline font-semibold text-sm">U</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Üstü çizili">
          <span className="line-through font-semibold text-sm">S</span>
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Sola hizala">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h15" /></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Ortala">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16" /></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Sağa hizala">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M6 18h15" /></svg>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Madde işaretli liste">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01" /></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numaralı liste">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5h11M9 12h11M9 19h11M4 7V5l-1 1M4 12a1 1 0 011-1h.5a1 1 0 011 1v.5a1 1 0 01-1 1H4m1 2.5H4m1 0a1 1 0 011 1v.5a1 1 0 01-1 1H4" /></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Alıntı">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h6l-2 6H3V4zm8 0h6l-2 6h-4V4z" opacity=".3"/><path d="M3 4h6l-2 6H3V4zm8 0h6l-2 6h-4V4zM5 10v8h4v-8H5zm8 0v8h4v-8h-4z"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Yatay çizgi">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M3 12h18" /></svg>
        </ToolBtn>

        <Divider />

        {/* Link */}
        <LinkButton editor={editor} />

        {/* Image upload */}
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Görsel ekle">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
          </svg>
        </ToolBtn>

        <Divider />

        {/* Clear */}
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Formatı temizle">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L17.94 6M4 6h16M8 6l8 12" /></svg>
        </ToolBtn>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Word count */}
      <div className="border-t border-slate-200/60 bg-slate-50/50 px-4 py-1.5 text-right text-[10px] text-slate-400 dark:border-slate-700/40 dark:bg-slate-800/30">
        {editor.storage.characterCount?.words?.() ?? editor.getText().trim().split(/\s+/).filter(Boolean).length} kelime
      </div>
    </div>
  );
}
