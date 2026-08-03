"use client";

import { useState } from "react";
import type { Category } from "@/lib/api";

interface CategoryTreeProps {
  nodes: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAddChild: (parentId: number) => void;
  onRename: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
}: {
  node: Category;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAddChild: (parentId: number) => void;
  onRename: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
          isSelected
            ? "bg-blue-500 text-white"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          className="mr-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-xs"
          onClick={() => setOpen((o) => !o)}
        >
          {hasChildren ? (open ? "▾" : "▸") : <span className="w-4" />}
        </button>
        <button
          type="button"
          className="flex-1 truncate text-left font-medium"
          onClick={() => onSelect(isSelected ? null : node.id)}
        >
          {node.name}
        </button>
        <span
          className={`ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${isSelected ? "opacity-100" : ""}`}
        >
          <button
            type="button"
            title="Alt kategori ekle"
            onClick={() => onAddChild(node.id)}
            className={`rounded p-0.5 hover:bg-white/20 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            title="Yeniden adlandır"
            onClick={() => onRename(node)}
            className={`rounded p-0.5 hover:bg-white/20 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 14H9v-3z" />
            </svg>
          </button>
          <button
            type="button"
            title="Sil"
            onClick={() => onDelete(node)}
            className={`rounded p-0.5 hover:bg-red-500/20 ${isSelected ? "text-white" : "text-red-400"}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
}: CategoryTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
