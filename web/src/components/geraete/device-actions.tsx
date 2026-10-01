"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { deleteDevice, type DeviceDetail } from "@/lib/api/devices";
import { DeviceDialog } from "./device-dialog";
import type { PickerOption } from "./labels";

type DeviceActionsProps = {
  device: DeviceDetail;
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/** «Bearbeiten» and «Löschen» in the detail header; moves and maintenance have their own sections. */
export function DeviceActions({ device, deviceTypes, locations }: DeviceActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      await deleteDevice(device.id);
      toast.success("Gerät gelöscht");
      router.push("/geraete");
    } catch (error) {
      // 409 while reservations reference the device: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon data-icon="inline-start" />
        Bearbeiten
      </Button>
      <Button variant="destructive" onClick={() => setDeleting(true)}>
        <Trash2Icon data-icon="inline-start" />
        Löschen
      </Button>
      <DeviceDialog
        open={editing}
        onOpenChange={setEditing}
        device={device}
        deviceTypes={deviceTypes}
        locations={locations}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Gerät «${device.inventoryNumber}» löschen?`}
        description="Das Gerät wird dauerhaft gelöscht, zusammen mit seinen Verschiebungen und Wartungsfenstern."
        onConfirm={handleDelete}
      />
    </>
  );
}
