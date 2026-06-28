import { type InputHTMLAttributes, type ReactNode } from "react";

const inputClassName =
  "w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm shadow-slate-200/50 placeholder:text-slate-400 transition-all outline-none hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-blue-400 dark:focus:bg-slate-800";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function FormField({ label, hint, id, required, className, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
      >
        {label}
        {required && <span className="ml-0.5 text-blue-500">*</span>}
      </label>
      <input
        id={fieldId}
        required={required}
        className={`${inputClassName} ${className ?? ""}`}
        {...props}
      />
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

export function FormInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClassName} ${className ?? ""}`} {...props} />;
}

interface FormGroupProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormGroup({ label, required, hint, children }: FormGroupProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-blue-500">*</span>}
      </p>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
