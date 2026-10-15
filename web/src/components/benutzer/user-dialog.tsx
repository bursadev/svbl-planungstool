"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, SwitchRow, applyApiErrors } from "@/components/form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUser, type UpdateUser, type UserRow } from "@/lib/api/users";

/** Sentinel for «keine Verknüpfung» — Radix selects cannot carry an empty string. */
const NONE = "none";

const schema = z.object({
  active: z.boolean(),
  instructorId: z.string(),
  trainerId: z.string(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(user: UserRow): FormValues {
  return {
    active: user.status === "active",
    instructorId: user.instructor?.id ?? NONE,
    trainerId: user.trainer?.id ?? NONE,
  };
}

function toDto(values: FormValues): UpdateUser {
  return {
    status: values.active ? "active" : "disabled",
    instructorId: values.instructorId === NONE ? null : values.instructorId,
    trainerId: values.trainerId === NONE ? null : values.trainerId,
  };
}

export type PersonOption = { id: string; label: string };

type UserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow;
  /** Options of the «Ausbilder» link picker. */
  instructors: PersonOption[];
  /** Options of the «Berufsbildner» link picker. */
  trainers: PersonOption[];
};

/** Admin only: status and the links of an account; roles are managed in Clerk. */
export function UserDialog({ open, onOpenChange, user, instructors, trainers }: UserDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(user),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(user));
  }, [open, user, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateUser(user.id, toDto(values));
      toast.success("Benutzer gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title="Benutzer bearbeiten"
      description={`${user.displayName} · ${user.email}. Rollen und Einladungen werden in Clerk verwaltet.`}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="instructorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Verknüpfter Ausbilder</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>Keine Verknüpfung</SelectItem>
                {instructors.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="trainerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Verknüpfter Berufsbildner</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>Keine Verknüpfung</SelectItem>
                {trainers.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="active"
        render={({ field }) => (
          <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </FormDialog>
  );
}
