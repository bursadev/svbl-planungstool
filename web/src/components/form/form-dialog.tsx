"use client";

import type { ReactNode } from "react";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

type FormDialogProps<TFieldValues extends FieldValues> = {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The `useForm()` instance; fields inside use `FormField` from `@/components/ui/form`. */
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  submitLabel?: string;
  cancelLabel?: string;
  /** Disables both buttons and blocks closing; defaults to the form's own `isSubmitting`. */
  pending?: boolean;
  /** `default` is 440px wide, `wide` 640px (Kurstypen). */
  width?: "default" | "wide";
  children: ReactNode;
};

/** Dialog with a react-hook-form form, Abbrechen / Speichern footer and pending handling. */
export function FormDialog<TFieldValues extends FieldValues>({
  title,
  description,
  open,
  onOpenChange,
  form,
  onSubmit,
  submitLabel = "Speichern",
  cancelLabel = "Abbrechen",
  pending,
  width = "default",
  children,
}: FormDialogProps<TFieldValues>) {
  const isPending = pending ?? form.formState.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={width === "wide" ? "sm:max-w-[640px]" : "sm:max-w-[440px]"}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
            <div className="flex flex-col gap-3.5">{children}</div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
