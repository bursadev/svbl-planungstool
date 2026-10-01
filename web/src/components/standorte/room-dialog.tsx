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
import { ApiError } from "@/lib/api";
import { createRoom, updateRoom, type CreateRoom, type Room } from "@/lib/api/locations";
import { ROOM_KIND_LABELS } from "@/lib/labels";

const capacityMessage = "Ganze Zahl ab 1.";

/** Mirrors `CreateRoomDto`: name required, capacity optional integer ≥ 1. */
const schema = z.object({
  name: z.string().trim().min(1, "Pflichtfeld."),
  kind: z.enum(["theory", "practice_hall", "outdoor"], { error: "Ungültiger Wert." }),
  capacity: z.number({ error: capacityMessage }).int(capacityMessage).min(1, capacityMessage).nullable(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(room?: Room): FormValues {
  return {
    name: room?.name ?? "",
    kind: room?.kind ?? "theory",
    capacity: room?.capacity ?? null,
    active: room?.active ?? true,
  };
}

function toDto(values: FormValues): CreateRoom {
  return { name: values.name, kind: values.kind, capacity: values.capacity, active: values.active };
}

type RoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  /** Present for «Raum bearbeiten», absent for «Raum hinzufügen». */
  room?: Room;
};

export function RoomDialog({ open, onOpenChange, locationId, room }: RoomDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(room),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(room));
  }, [open, room, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (room) await updateRoom(room.id, toDto(values));
      else await createRoom(locationId, toDto(values));
      toast.success("Raum gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409 «Name ist bereits vergeben.» belongs under the name field.
      if (error instanceof ApiError && error.status === 409) {
        form.setError("name", { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={room ? "Raum bearbeiten" : "Raum hinzufügen"}
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

      <div className="grid grid-cols-2 gap-3">
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
                  {Object.entries(ROOM_KIND_LABELS).map(([value, label]) => (
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
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plätze</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="optional"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value === null || Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? null : event.target.valueAsNumber)
                  }
                  className="font-mono tabular-nums"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="active"
        render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
      />
    </FormDialog>
  );
}
