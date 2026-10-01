"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceDialog } from "./device-dialog";
import type { PickerOption } from "./labels";

type CreateDeviceButtonProps = {
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/** «Gerät hinzufügen» in the page header; opens the create dialog. */
export function CreateDeviceButton({ deviceTypes, locations }: CreateDeviceButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Gerät hinzufügen
      </Button>
      <DeviceDialog open={open} onOpenChange={setOpen} deviceTypes={deviceTypes} locations={locations} />
    </>
  );
}
