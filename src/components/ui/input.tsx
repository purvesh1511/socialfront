import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "block h-10 w-full rounded-lg border bg-white px-3 text-sm shadow-xs placeholder:text-slate-400 focus:ring-2 focus:outline-none",
          error
            ? "border-red-400 focus:ring-red-200"
            : "focus:border-brand-500 focus:ring-brand-100 border-slate-300",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
