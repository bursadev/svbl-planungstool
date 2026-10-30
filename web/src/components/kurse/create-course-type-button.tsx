"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseTypeDialog } from "./course-type-dialog";

/** «Kurstyp anlegen» next to the CSV menu; opens the create dialog. */
export function CreateCourseTypeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Kurstyp anlegen
      </Button>
      <CourseTypeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
