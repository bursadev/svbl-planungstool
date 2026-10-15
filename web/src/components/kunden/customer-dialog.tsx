"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, SwitchRow, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createCustomer,
  updateCustomer,
  type CreateCustomer,
  type Customer,
  type CustomerRow,
} from "@/lib/api/customers";

const optionalText = z.string().trim();

/** Mirrors `CreateCustomerDto`: name required, e-mail optional but valid. */
const schema = z.object({
  name: z.string().trim().min(1, "Pflichtfeld."),
  addressLine: optionalText,
  postalCode: optionalText,
  city: optionalText,
  contactName: optionalText,
  contactEmail: optionalText.refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Ungültige E-Mail-Adresse.",
  ),
  contactPhone: optionalText,
  externalRefAbacus: optionalText,
  externalRefOdaorg: optionalText,
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(customer?: CustomerRow): FormValues {
  return {
    name: customer?.name ?? "",
    addressLine: customer?.addressLine ?? "",
    postalCode: customer?.postalCode ?? "",
    city: customer?.city ?? "",
    contactName: customer?.contactName ?? "",
    contactEmail: customer?.contactEmail ?? "",
    contactPhone: customer?.contactPhone ?? "",
    externalRefAbacus: customer?.externalRefAbacus ?? "",
    externalRefOdaorg: customer?.externalRefOdaorg ?? "",
    active: customer?.active ?? true,
  };
}

const text = (value: string) => (value === "" ? null : value);

function toDto(values: FormValues): CreateCustomer {
  return {
    name: values.name,
    addressLine: text(values.addressLine),
    postalCode: text(values.postalCode),
    city: text(values.city),
    contactName: text(values.contactName),
    contactEmail: text(values.contactEmail),
    contactPhone: text(values.contactPhone),
    externalRefAbacus: text(values.externalRefAbacus),
    externalRefOdaorg: text(values.externalRefOdaorg),
    active: values.active,
  };
}

type CustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Kunde bearbeiten», absent for «Kunde anlegen». */
  customer?: CustomerRow;
  /** Where to go after a successful create (default: the new Kunde's detail page). */
  onCreated?: (customer: Customer) => void;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function CustomerDialog({ open, onOpenChange, customer, onCreated }: CustomerDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(customer),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(customer));
  }, [open, customer, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (customer) {
        await updateCustomer(customer.id, toDto(values));
        toast.success("Kunde gespeichert");
        onOpenChange(false);
        router.refresh();
      } else {
        const created = await createCustomer(toDto(values));
        toast.success("Kunde gespeichert");
        onOpenChange(false);
        if (onCreated) onCreated(created);
        else router.push(`/kunden/${created.id}`);
        router.refresh();
      }
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={customer ? "Kunde bearbeiten" : "Kunde anlegen"}
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

      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kontaktperson</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="contactEmail"
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
          name="contactPhone"
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
          name="externalRefAbacus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referenz Abacus</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="optional" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="externalRefOdaorg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referenz OdAOrg</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="optional" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {customer ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
