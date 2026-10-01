"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CertificateType } from "@/lib/api/certificate-types";
import {
  createCertificate,
  updateCertificate,
  type CreateCertificate,
  type InstructorCertificate,
  type UpdateCertificate,
} from "@/lib/api/instructors";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const optionalDate = z.string().refine((value) => value === "" || DATE.test(value), "Ungültiges Datum.");

/** Mirrors `CreateInstructorCertificateDto`; `validUntil` empty = computed (create) or unbefristet (edit). */
const schema = z
  .object({
    certificateTypeId: z.string().min(1, "Pflichtfeld."),
    issuedOn: z.string().regex(DATE, "Pflichtfeld."),
    validUntil: optionalDate,
    documentUrl: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((values) => values.validUntil === "" || values.validUntil >= values.issuedOn, {
    path: ["validUntil"],
    message: "Liegt vor dem Ausstelldatum.",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(certificate?: InstructorCertificate): FormValues {
  return {
    certificateTypeId: certificate?.certificateType.id ?? "",
    issuedOn: certificate?.issuedOn ?? "",
    validUntil: certificate?.validUntil ?? "",
    documentUrl: certificate?.documentUrl ?? "",
    notes: certificate?.notes ?? "",
  };
}

const text = (value: string) => (value === "" ? null : value);

/** On create an empty «Gültig bis» is left out, so the API derives it from the type's validity. */
function toCreateDto(values: FormValues): CreateCertificate {
  return {
    certificateTypeId: values.certificateTypeId,
    issuedOn: values.issuedOn,
    ...(values.validUntil === "" ? {} : { validUntil: values.validUntil }),
    documentUrl: text(values.documentUrl),
    notes: text(values.notes),
  };
}

/** On edit an empty «Gültig bis» means unbefristet (`null`); leaving it out would keep the old date. */
function toUpdateDto(values: FormValues): UpdateCertificate {
  return {
    certificateTypeId: values.certificateTypeId,
    issuedOn: values.issuedOn,
    validUntil: text(values.validUntil),
    documentUrl: text(values.documentUrl),
    notes: text(values.notes),
  };
}

type CertificateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  types: CertificateType[];
  /** Present for «Zertifikat bearbeiten», absent for «Zertifikat erfassen». */
  certificate?: InstructorCertificate;
};

export function CertificateDialog({ open, onOpenChange, instructorId, types, certificate }: CertificateDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(certificate),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(certificate));
  }, [open, certificate, form]);

  const selectedTypeId = useWatch({ control: form.control, name: "certificateTypeId" });
  const selectedType = types.find((type) => type.id === selectedTypeId);

  function validUntilHint(): string {
    if (certificate) return "Leer = unbefristet";
    if (!selectedType) return "Leer = aus der Gültigkeit des Typs berechnet";
    if (selectedType.validityYears === null) return "Leer = unbefristet (der Typ läuft nicht ab)";
    return `Leer = aus der Gültigkeit des Typs berechnet (${selectedType.validityYears} ${
      selectedType.validityYears === 1 ? "Jahr" : "Jahre"
    })`;
  }

  async function onSubmit(values: FormValues) {
    try {
      if (certificate) await updateCertificate(certificate.id, toUpdateDto(values));
      else await createCertificate(instructorId, toCreateDto(values));
      toast.success("Zertifikat gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={certificate ? "Zertifikat bearbeiten" : "Zertifikat erfassen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="certificateTypeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zertifikatstyp</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">{type.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="issuedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ausgestellt am</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="font-mono tabular-nums" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="validUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gültig bis</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="font-mono tabular-nums" />
              </FormControl>
              <FormDescription className="text-xs">{validUntilHint()}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="documentUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dokument-URL</FormLabel>
            <FormControl>
              <Input {...field} type="url" inputMode="url" placeholder="https://…" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notizen</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
