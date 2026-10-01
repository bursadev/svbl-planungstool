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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLocation, updateLocation, type CreateLocation, type Location } from "@/lib/api/locations";
import { LANGUAGE_LABELS, LOCATION_KIND_LABELS } from "@/lib/labels";

const optionalText = z.string().trim();
const capacityMessage = "Ganze Zahl ab 1.";

/** Mirrors `CreateLocationDto`: code and name required, e-mail optional but valid, capacity integer ≥ 1. */
const schema = z.object({
  code: z.string().trim().min(1, "Pflichtfeld."),
  name: z.string().trim().min(1, "Pflichtfeld."),
  kind: z.enum(["training_centre", "customer_site"], { error: "Ungültiger Wert." }),
  addressLine: optionalText,
  postalCode: optionalText,
  city: optionalText,
  canton: optionalText,
  languageRegion: z.enum(["de", "fr", "it"], { error: "Ungültiger Wert." }),
  hostsUk: z.boolean(),
  parallelCourseCapacity: z.number({ error: capacityMessage }).int(capacityMessage).min(1, capacityMessage),
  contactName: optionalText,
  contactEmail: optionalText.refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Ungültige E-Mail-Adresse.",
  ),
  contactPhone: optionalText,
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(location?: Location): FormValues {
  return {
    code: location?.code ?? "",
    name: location?.name ?? "",
    kind: location?.kind ?? "training_centre",
    addressLine: location?.addressLine ?? "",
    postalCode: location?.postalCode ?? "",
    city: location?.city ?? "",
    canton: location?.canton ?? "",
    languageRegion: location?.languageRegion ?? "de",
    hostsUk: location?.hostsUk ?? false,
    parallelCourseCapacity: location?.parallelCourseCapacity ?? 1,
    contactName: location?.contactName ?? "",
    contactEmail: location?.contactEmail ?? "",
    contactPhone: location?.contactPhone ?? "",
    active: location?.active ?? true,
  };
}

/** Empty optional strings go to the API as `null`, so clearing a field clears the column. */
function toDto(values: FormValues): CreateLocation {
  const text = (value: string) => (value === "" ? null : value);
  return {
    code: values.code,
    name: values.name,
    kind: values.kind,
    addressLine: text(values.addressLine),
    postalCode: text(values.postalCode),
    city: text(values.city),
    canton: text(values.canton),
    languageRegion: values.languageRegion,
    hostsUk: values.hostsUk,
    parallelCourseCapacity: values.parallelCourseCapacity,
    contactName: text(values.contactName),
    contactEmail: text(values.contactEmail),
    contactPhone: text(values.contactPhone),
    active: values.active,
  };
}

type LocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Standort bearbeiten», absent for «Standort anlegen». */
  location?: Location;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function LocationDialog({ open, onOpenChange, location }: LocationDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(location),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(location));
  }, [open, location, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (location) await updateLocation(location.id, toDto(values));
      else await createLocation(toDto(values));
      toast.success("Standort gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={location ? "Standort bearbeiten" : "Standort anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Art</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(LOCATION_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
              <Input {...field} autoComplete="street-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PLZ</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" autoComplete="postal-code" />
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
                <Input {...field} autoComplete="address-level2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="canton"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kanton</FormLabel>
              <FormControl>
                <Input {...field} placeholder="z. B. AG" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="languageRegion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprachregion</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="parallelCourseCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parallele Kurse</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? Number.NaN : event.target.valueAsNumber)
                  }
                  className="font-mono tabular-nums"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hostsUk"
          render={({ field }) => (
            <SwitchRow label="ÜK-Standort" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kontakt</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Name" autoComplete="off" />
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
                <Input {...field} type="email" autoComplete="off" />
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
                <Input {...field} type="tel" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {location ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
