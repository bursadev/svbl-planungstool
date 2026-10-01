"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstructorDialog } from "./instructor-dialog";
import type { LocationOption } from "./options";

/** «Ausbilder anlegen» in the page header; opens the create dialog. */
export function CreateInstructorButton({ locations }: { locations: LocationOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Ausbilder anlegen
      </Button>
      <InstructorDialog open={open} onOpenChange={setOpen} locations={locations} />
    </>
  );
}
