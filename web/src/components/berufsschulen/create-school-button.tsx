"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchoolDialog, type LocationOption } from "./school-dialog";

/** «Berufsschule anlegen» in the page header; opens the create dialog. */
export function CreateSchoolButton({ locations }: { locations: LocationOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Berufsschule anlegen
      </Button>
      <SchoolDialog open={open} onOpenChange={setOpen} locations={locations} />
    </>
  );
}
