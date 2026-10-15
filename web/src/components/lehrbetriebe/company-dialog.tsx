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
import {
  createTrainingCompany,
  updateTrainingCompany,
  type CreateTrainingCompany,
  type TrainingCompany,
  type TrainingCompanyRow,
} from "@/lib/api/training-companies";

const optionalText = z.string().trim();

/** Mirrors `CreateTrainingCompanyDto`: name required, e-mail optional but valid. */
const schema = z.object({
  name: z.string().trim().min(1, "Pflichtfeld."),
  addressLine: optionalText,
  postalCode: optionalText,
  city: optionalText,
  email: optionalText.refine((value) => value === "" || z.email().safeParse(value).success, "Ungültige E-Mail-Adresse."),
  phone: optionalText,
  externalRef: optionalText,
});

type FormValues = z.infer<typeof schema>;

function toFormValues(company?: TrainingCompanyRow): FormValues {
  return {
    name: company?.name ?? "",
    addressLine: company?.addressLine ?? "",
    postalCode: company?.postalCode ?? "",
    city: company?.city ?? "",
    email: company?.email ?? "",
    phone: company?.phone ?? "",
    externalRef: company?.externalRef ?? "",
  };
}

const text = (value: string) => (value === "" ? null : value);

function toDto(values: FormValues): CreateTrainingCompany {
  return {
    name: values.name,
    addressLine: text(values.addressLine),
    postalCode: text(values.postalCode),
    city: text(values.city),
    email: text(values.email),
    phone: text(values.phone),
    externalRef: text(values.externalRef),
  };
}

type CompanyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Lehrbetrieb bearbeiten», absent for «Lehrbetrieb anlegen». */
  company?: TrainingCompanyRow;
  /** Where to go after a successful create (default: the new Lehrbetrieb's detail page). */
  onCreated?: (company: TrainingCompany) => void;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function CompanyDialog({ open, onOpenChange, company, onCreated }: CompanyDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(company),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(company));
  }, [open, company, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (company) {
        await updateTrainingCompany(company.id, toDto(values));
        toast.success("Lehrbetrieb gespeichert");
        onOpenChange(false);
        router.refresh();
      } else {
        const created = await createTrainingCompany(toDto(values));
        toast.success("Lehrbetrieb gespeichert");
        onOpenChange(false);
        if (onCreated) onCreated(created);
        else router.push(`/lernende/lehrbetriebe/${created.id}`);
        router.refresh();
      }
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={company ? "Lehrbetrieb bearbeiten" : "Lehrbetrieb anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="addressLine"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresse</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[120px_1fr] gap-3">
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PLZ</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ort</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="optional" />
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

      <FormField
        control={form.control}
        name="externalRef"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Externe Referenz</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="z. B. OdAOrg-Nummer" className="font-mono" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
