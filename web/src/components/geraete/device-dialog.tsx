"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyApiErrors } from "@/components/form/api-errors";
import { FormDialog } from "@/components/form/form-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDevice, updateDevice, type CreateDevice, type DeviceRow } from "@/lib/api/devices";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";
import { selectableOptions, type PickerOption } from "./labels";

const dateMessage = "Datum wählen.";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const optionalDate = z.string().refine((value) => value === "" || ISO_DATE.test(value), dateMessage);

/** Mirrors `CreateDeviceDto`; the rental range check mirrors the service's «Mietende vor Mietbeginn». */
const schema = z
  .object({
    deviceTypeId: z.string().min(1, "Pflichtfeld."),
    inventoryNumber: z.string().trim().min(1, "Pflichtfeld."),
    homeLocationId: z.string().min(1, "Pflichtfeld."),
    mobility: z.enum(["fixed", "mobile", "rental"], { error: "Ungültiger Wert." }),
    status: z.enum(["available", "maintenance", "retired"], { error: "Ungültiger Wert." }),
    rentalFrom: optionalDate,
    rentalUntil: optionalDate,
    rentalVendor: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((values) => !values.rentalFrom || !values.rentalUntil || values.rentalUntil >= values.rentalFrom, {
    path: ["rentalUntil"],
    message: "Das Mietende liegt vor dem Mietbeginn.",
  });

type FormValues = z.infer<typeof schema>;

/** A list row does not carry the notes, so callers load the detail before editing. */
export type EditableDevice = DeviceRow & { notes: string | null };

function toFormValues(device?: EditableDevice): FormValues {
  return {
    deviceTypeId: device?.deviceType.id ?? "",
    inventoryNumber: device?.inventoryNumber ?? "",
    homeLocationId: device?.homeLocation.id ?? "",
    mobility: device?.mobility ?? "fixed",
    status: device?.status ?? "available",
    rentalFrom: device?.rentalFrom ?? "",
    rentalUntil: device?.rentalUntil ?? "",
    rentalVendor: device?.rentalVendor ?? "",
    notes: device?.notes ?? "",
  };
}

/** Rental fields are cleared unless the device is a Miete; empty strings go to the API as `null`. */
function toDto(values: FormValues): CreateDevice {
  const rental = values.mobility === "rental";
  return {
    deviceTypeId: values.deviceTypeId,
    inventoryNumber: values.inventoryNumber,
    homeLocationId: values.homeLocationId,
    mobility: values.mobility,
    status: values.status,
    rentalFrom: rental && values.rentalFrom ? values.rentalFrom : null,
    rentalUntil: rental && values.rentalUntil ? values.rentalUntil : null,
    rentalVendor: rental && values.rentalVendor ? values.rentalVendor : null,
    notes: values.notes || null,
  };
}

type DeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Gerät bearbeiten», absent for «Gerät hinzufügen». */
  device?: EditableDevice;
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function DeviceDialog({ open, onOpenChange, device, deviceTypes, locations }: DeviceDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(device),
  });
  const mobility = useWatch({ control: form.control, name: "mobility" });

  useEffect(() => {
    if (open) form.reset(toFormValues(device));
  }, [open, device, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (device) await updateDevice(device.id, toDto(values));
      else await createDevice(toDto(values));
      toast.success("Gerät gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  const typeOptions = selectableOptions(deviceTypes, device?.deviceType.id);
  const locationOptions = selectableOptions(locations, device?.homeLocation.id);

  return (
    <FormDialog
      title={device ? "Gerät bearbeiten" : "Gerät hinzufügen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="deviceTypeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Typ</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    <span className="font-mono text-xs text-muted-foreground">{type.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <FormField
          control={form.control}
          name="inventoryNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inventarnummer</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="homeLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heimstandort</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Standort wählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
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
          name="mobility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobilität</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DEVICE_MOBILITY_LABELS).map(([value, label]) => (
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
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
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

      {mobility === "rental" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="rentalFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mietbeginn</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="font-mono tabular-nums" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rentalUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mietende</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="font-mono tabular-nums" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="rentalVendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anbieter</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="optional" autoComplete="organization" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}

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
