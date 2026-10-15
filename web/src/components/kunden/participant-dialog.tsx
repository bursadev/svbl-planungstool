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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createParticipant,
  updateParticipant,
  type CreateParticipant,
  type Participant,
} from "@/lib/api/customers";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/labels";

/** Sentinel for «kein Kunde» — Radix selects cannot carry an empty string. */
const NONE = "none";

const optionalText = z.string().trim();

/** Mirrors `CreateParticipantDto`: names and language required, e-mail optional but valid. */
const schema = z.object({
  firstName: z.string().trim().min(1, "Pflichtfeld."),
  lastName: z.string().trim().min(1, "Pflichtfeld."),
  email: optionalText.refine((value) => value === "" || z.email().safeParse(value).success, "Ungültige E-Mail-Adresse."),
  phone: optionalText,
  language: z.enum(["de", "fr", "it"], { error: "Ungültiger Wert." }),
  customerId: z.string(),
  notes: optionalText,
});

type FormValues = z.infer<typeof schema>;

function toFormValues(participant?: Participant, initialCustomerId?: string): FormValues {
  return {
    firstName: participant?.firstName ?? "",
    lastName: participant?.lastName ?? "",
    email: participant?.email ?? "",
    phone: participant?.phone ?? "",
    language: participant?.language ?? "de",
    customerId: participant ? (participant.customer?.id ?? NONE) : (initialCustomerId ?? NONE),
    notes: participant?.notes ?? "",
  };
}

const text = (value: string) => (value === "" ? null : value);

function toDto(values: FormValues): CreateParticipant {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: text(values.email),
    phone: text(values.phone),
    language: values.language,
    customerId: values.customerId === NONE ? null : values.customerId,
    notes: text(values.notes),
  };
}

export type CustomerOption = { id: string; name: string };

type ParticipantDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Options of the Kunde picker; hidden when `lockedCustomerId` is set. */
  customers: CustomerOption[];
  /** Fixes the Kunde (detail page) and hides the picker. */
  lockedCustomerId?: string;
  /** Present for «Teilnehmer/in bearbeiten», absent for «Teilnehmer/in hinzufügen». */
  participant?: Participant;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function ParticipantDialog({
  open,
  onOpenChange,
  customers,
  lockedCustomerId,
  participant,
}: ParticipantDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(participant, lockedCustomerId),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(participant, lockedCustomerId));
  }, [open, participant, lockedCustomerId, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (participant) await updateParticipant(participant.id, toDto(values));
      else await createParticipant(toDto(values));
      toast.success("Teilnehmer/in gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={participant ? "Teilnehmer/in bearbeiten" : "Teilnehmer/in hinzufügen"}
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

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprache</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {LANGUAGE_LABELS[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {lockedCustomerId ? null : (
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kunde</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>Kein Kunde</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notizen</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} placeholder="optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
