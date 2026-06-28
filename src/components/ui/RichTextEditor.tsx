"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full rounded-b-xl border-x border-b border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-xs font-semibold transition-colors ${
      active
        ? "bg-blue-500 text-white"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 dark:border-slate-600/60 dark:bg-slate-800/60">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>İ</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>• Liste</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>1. Liste</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>Başlık</button>
      </div>
      {!editor.getText() && placeholder && (
        <div className="pointer-events-none absolute mt-1 px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
          {placeholder}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
