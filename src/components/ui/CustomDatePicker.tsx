"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

const MONTH_LABELS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function parseISODate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplay(value: string): string {
  const date = parseISODate(value);
  if (!date) return "";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

const triggerClassName =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-left text-sm text-slate-800 shadow-sm shadow-slate-200/50 transition-all outline-none hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-none dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-blue-400 dark:focus:bg-slate-800";

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Tarih seçin",
  disabled = false,
  className = "",
  id,
  name,
  "aria-label": ariaLabel,
}: CustomDatePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;
  const popoverId = `${fieldId}-calendar`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseISODate(value);
  const minDate = min ? parseISODate(min) : null;
  const maxDate = max ? parseISODate(max) : null;
  const today = startOfDay(new Date());

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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
    if (selected) {
      setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({
        date: new Date(year, month, i - startOffset + 1),
        inMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        date: new Date(year, month, day),
        inMonth: true,
      });
    }

    let nextDay = 1;
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push({
        date: new Date(year, month + 1, nextDay),
        inMonth: false,
      });
      nextDay += 1;
      if (cells.length >= 42) break;
    }

    return cells;
  }, [viewMonth]);

  const isDisabledDate = (date: Date) => {
    if (minDate && isBeforeDay(date, minDate)) return true;
    if (maxDate && isBeforeDay(maxDate, date)) return true;
    return false;
  };

  const selectDate = (date: Date) => {
    if (isDisabledDate(date)) return;
    onChange(toISODate(date));
    close();
  };

  const goMonth = (delta: number) => {
    setViewMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
    if (event.key === "Escape") close();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={fieldId}
        name={name}
        aria-label={ariaLabel ?? "Tarih seçin"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={`${triggerClassName} ${open ? "border-blue-400 ring-2 ring-blue-400/25 dark:border-blue-400" : ""}`}
      >
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Takvim"
          className="absolute left-0 z-50 mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-white/30 bg-white/95 p-4 shadow-xl shadow-slate-300/30 backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Önceki ay"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Sonraki ay"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, inMonth }, index) => {
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              const disabledDay = isDisabledDate(date);

              return (
                <button
                  key={`${toISODate(date)}-${index}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => selectDate(date)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                    !inMonth
                      ? "text-slate-300 dark:text-slate-600"
                      : disabledDay
                        ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                        : isSelected
                          ? "bg-blue-500 font-semibold text-white shadow-md shadow-blue-500/30"
                          : isToday
                            ? "font-semibold text-blue-600 ring-1 ring-blue-400/40 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isDisabledDate(today)) {
                  onChange(toISODate(today));
                  close();
                }
              }}
              disabled={isDisabledDate(today)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 dark:text-blue-400"
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FormDateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function FormDateField({
  label,
  required,
  hint,
  id,
  name,
  ...props
}: FormDateFieldProps) {
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
      <CustomDatePicker id={fieldId} name={name} {...props} />
      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export { toISODate as dateToISO };
