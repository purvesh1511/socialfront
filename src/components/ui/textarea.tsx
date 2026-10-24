import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-slate-400 focus:ring-2 focus:outline-none",
          error
            ? "border-red-400 focus:ring-red-200"
            : "focus:border-brand-500 focus:ring-brand-100 border-slate-300",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${textareaId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
