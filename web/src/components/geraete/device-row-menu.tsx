"use client";

import { EllipsisIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeviceRow } from "@/lib/api/devices";

type DeviceRowMenuProps = {
  device: Pick<DeviceRow, "inventoryNumber" | "mobility">;
  onEdit: () => void;
  onMove: () => void;
  onMaintenance: () => void;
  onDelete: () => void;
};

/** The «Aktionen» dropdown of a Geräte row; «Verschieben» only for mobile and rental devices. */
export function DeviceRowMenu({ device, onEdit, onMove, onMaintenance, onDelete }: DeviceRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Aktionen für ${device.inventoryNumber}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={onEdit}>Bearbeiten</DropdownMenuItem>
        {device.mobility !== "fixed" ? <DropdownMenuItem onSelect={onMove}>Verschieben</DropdownMenuItem> : null}
        <DropdownMenuItem onSelect={onMaintenance}>Wartung erfassen</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
