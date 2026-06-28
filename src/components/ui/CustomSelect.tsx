"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

const triggerClassName =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-left text-sm text-slate-800 shadow-sm shadow-slate-200/50 transition-all outline-none hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-none dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-blue-400 dark:focus:bg-slate-800";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  disabled = false,
  className = "",
  id,
  name,
  "aria-label": ariaLabel,
}: CustomSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? name ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((option) => option.value === value);
  const enabledOptions = options.filter((option) => !option.disabled);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  const selectOption = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;
      onChange(option.value);
      close();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        close();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);


  useEffect(() => {
    if (!open) return;
    const selectedIndex = enabledOptions.findIndex(
      (option) => option.value === value
    );
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, enabledOptions, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        setHighlightIndex((current) =>
          current < enabledOptions.length - 1 ? current + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        setHighlightIndex((current) =>
          current > 0 ? current - 1 : enabledOptions.length - 1
        );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open && highlightIndex >= 0) {
          selectOption(enabledOptions[highlightIndex]);
        } else {
          setOpen(true);
        }
        break;
      case "Escape":
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={selectId}
        name={name}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
              position: "fixed",
              top: rect.bottom + 6,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            });
          }
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className={`${triggerClassName} ${open ? "border-blue-400 ring-2 ring-blue-400/25 dark:border-blue-400" : ""}`}
      >
        <span className={selectedOption ? "" : "text-slate-400 dark:text-slate-500"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <ul
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          style={dropdownStyle}
          className="max-h-60 overflow-auto rounded-2xl border border-white/30 bg-white/95 p-1.5 shadow-xl shadow-slate-300/30 backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          {options.map((option) => {
            const enabledIndex = enabledOptions.indexOf(option);
            const isSelected = option.value === value;
            const isHighlighted = enabledIndex === highlightIndex;

            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onMouseEnter={() => {
                  if (!option.disabled && enabledIndex >= 0) {
                    setHighlightIndex(enabledIndex);
                  }
                }}
                onClick={() => selectOption(option)}
                className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  option.disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : isSelected
                      ? "bg-blue-500 font-medium text-white"
                      : isHighlighted
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

interface FormSelectProps<T extends string | number>
  extends CustomSelectProps<T> {
  label: string;
  hint?: string;
  required?: boolean;
}

export function FormSelect<T extends string | number>({
  label,
  hint,
  required,
  id,
  name,
  ...props
}: FormSelectProps<T>) {
  const fieldId = id ?? name;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
      >
        {label}
        {required && <span className="ml-0.5 text-blue-500">*</span>}
      </label>
      <CustomSelect id={fieldId} name={name} {...props} />
      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
