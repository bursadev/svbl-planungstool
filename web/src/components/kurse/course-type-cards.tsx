"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { ApiError } from "@/lib/api";
import { deleteCourseType, type CourseType } from "@/lib/api/course-types";
import { CourseTypeCard } from "./course-type-card";
import { CourseTypeDialog } from "./course-type-dialog";
import { RequirementsDialog, type RequirementOptions } from "./requirements-dialog";

type CourseTypeCardsProps = {
  courseTypes: CourseType[];
  options: RequirementOptions;
  emptyText: string;
};

/** The card grid with one shared edit, requirements and delete dialog for all cards. */
export function CourseTypeCards({ courseTypes, options, emptyText }: CourseTypeCardsProps) {
  const router = useRouter();
  // Each dialog keeps its last target while closing, so its title does not flip mid-animation.
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseType | undefined>();
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [requirementsTarget, setRequirementsTarget] = useState<CourseType | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseType | undefined>();

  function openEdit(courseType: CourseType) {
    setEditTarget(courseType);
    setEditOpen(true);
  }

  function openRequirements(courseType: CourseType) {
    setRequirementsTarget(courseType);
    setRequirementsOpen(true);
  }

  function openDelete(courseType: CourseType) {
    setDeleteTarget(courseType);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCourseType(deleteTarget.id);
      toast.success("Kurstyp gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while courses or a Bildungsplan module still use the type: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <>
      {courseTypes.length === 0 ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <EmptyState>{emptyText}</EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courseTypes.map((courseType) => (
            <CourseTypeCard
              key={courseType.id}
              courseType={courseType}
              onEdit={() => openEdit(courseType)}
              onRequirements={() => openRequirements(courseType)}
              onDelete={() => openDelete(courseType)}
            />
          ))}
        </div>
      )}

      <CourseTypeDialog open={editOpen} onOpenChange={setEditOpen} courseType={editTarget} />
      <RequirementsDialog
        open={requirementsOpen}
        onOpenChange={setRequirementsOpen}
        courseType={requirementsTarget}
        options={options}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Kurstyp «${deleteTarget.code} ${deleteTarget.name}» löschen?` : "Kurstyp löschen?"}
        description="Der Kurstyp wird dauerhaft gelöscht, samt seinen Anforderungen. Solange Kurse oder ein ÜK-Modul ihn verwenden, lehnt das System das Löschen ab."
        onConfirm={handleDelete}
      />
    </>
  );
}
