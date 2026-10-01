"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationDialog } from "./location-dialog";

/** «Standort anlegen» in the page header; opens the create dialog. */
export function CreateLocationButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Standort anlegen
      </Button>
      <LocationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
