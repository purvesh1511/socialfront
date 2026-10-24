import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toApiError } from "@/lib/api-error";
import { toast } from "@/stores/toast.store";

/**
 * Maps Laravel validation errors onto react-hook-form fields; other errors become a toast.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): void {
  const apiError = toApiError(error);

  if (apiError.isValidation) {
    for (const [field, messages] of Object.entries(apiError.errors)) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    }
    return;
  }

  toast.error(apiError.message);
}
