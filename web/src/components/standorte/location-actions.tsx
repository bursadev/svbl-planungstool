"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteLocation, type Location } from "@/lib/api/locations";
import { LocationDialog } from "./location-dialog";

/** «Bearbeiten» and «Löschen» in the detail header. */
export function LocationActions({ location }: { location: Location }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      await deleteLocation(location.id);
      toast.success("Standort gelöscht");
      router.push("/standorte");
    } catch (error) {
      // 409 while the Standort is referenced: the API message names the reason.
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
      <LocationDialog open={editing} onOpenChange={setEditing} location={location} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`«${location.name}» löschen?`}
        description="Der Standort wird dauerhaft gelöscht. Räume werden mitgelöscht."
        onConfirm={handleDelete}
      />
    </>
  );
}
