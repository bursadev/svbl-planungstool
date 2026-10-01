import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

/**
 * Maps the backend's `errors[]` onto the form fields (first one focused) and toasts everything
 * that has no field: the error message itself, or errors for fields the form does not have.
 */
export function applyApiErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
): void {
  if (!(error instanceof ApiError)) {
    toast.error("Unerwarteter Fehler.");
    return;
  }

  const fields = new Set(Object.keys(form.getValues()));
  const unmapped: string[] = [];
  let focused = false;

  for (const { field, message } of error.errors ?? []) {
    if (!fields.has(field)) {
      unmapped.push(message);
      continue;
    }
    form.setError(field as Path<TFieldValues>, { type: "server", message }, { shouldFocus: !focused });
    focused = true;
  }

  if (!focused) {
    toast.error(error.message);
  } else if (unmapped.length > 0) {
    toast.error(unmapped.join(" "));
  }
}
