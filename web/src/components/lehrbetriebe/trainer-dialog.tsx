"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createTrainer, updateTrainer, type CreateTrainer, type Trainer } from "@/lib/api/training-companies";

const optionalText = z.string().trim();

/** Mirrors `CreateTrainerDto`: names required, e-mail optional but valid. */
const schema = z.object({
  firstName: z.string().trim().min(1, "Pflichtfeld."),
  lastName: z.string().trim().min(1, "Pflichtfeld."),
  email: optionalText.refine((value) => value === "" || z.email().safeParse(value).success, "Ungültige E-Mail-Adresse."),
  phone: optionalText,
});

type FormValues = z.infer<typeof schema>;

function toFormValues(trainer?: Trainer): FormValues {
  return {
    firstName: trainer?.firstName ?? "",
    lastName: trainer?.lastName ?? "",
    email: trainer?.email ?? "",
    phone: trainer?.phone ?? "",
  };
}

const text = (value: string) => (value === "" ? null : value);

function toDto(values: FormValues): CreateTrainer {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: text(values.email),
    phone: text(values.phone),
  };
}

type TrainerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  /** Present for «Berufsbildner bearbeiten», absent for «Berufsbildner hinzufügen». */
  trainer?: Trainer;
};

export function TrainerDialog({ open, onOpenChange, companyId, trainer }: TrainerDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(trainer),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(trainer));
  }, [open, trainer, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (trainer) await updateTrainer(trainer.id, toDto(values));
      else await createTrainer(companyId, toDto(values));
      toast.success("Berufsbildner gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={trainer ? "Berufsbildner bearbeiten" : "Berufsbildner hinzufügen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nachname</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="off" placeholder="optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input {...field} type="tel" autoComplete="off" placeholder="optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormDialog>
  );
}
