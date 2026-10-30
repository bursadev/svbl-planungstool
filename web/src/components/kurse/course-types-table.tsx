"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import {
  ActiveBadge,
  BulkBar,
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  SelectAllHead,
  SelectCell,
  SelectionProvider,
  SortableHead,
  StatusDot,
} from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { COURSE_TYPES_PATH, deleteCourseType, type CourseType } from "@/lib/api/course-types";
import { KindBadge, TrackBadge } from "./course-badges";
import { CourseTypeDialog } from "./course-type-dialog";
import { formatDuration, formatModuleSlot, formatParticipants } from "./labels";
import { RequirementsDialog, type RequirementOptions } from "./requirements-dialog";

const COLUMNS = 9;

type CourseTypesTableProps = {
  courseTypes: CourseType[];
  options: RequirementOptions;
  emptyText: string;
};

/**
 * The `/kurse/typen` list: one compact row per Kurstyp with selection for bulk actions and
 * sortable code, name and duration. Edit, requirements and delete share one dialog each.
 */
export function CourseTypesTable({ courseTypes, options, emptyText }: CourseTypesTableProps) {
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
    <SelectionProvider ids={courseTypes.map((courseType) => courseType.id)}>
      <BulkBar basePath={COURSE_TYPES_PATH} plural="Kurstypen" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="code" defaultSort="code">
              Code
            </SortableHead>
            <SortableHead sortKey="name" defaultSort="code">
              Kurstyp
            </SortableHead>
            <SortableHead sortKey="duration" defaultSort="code">
              Dauer
            </SortableHead>
            <DataTableHead className="text-right">Teilnehmende</DataTableHead>
            <DataTableHead>Sprachen</DataTableHead>
            <DataTableHead>Anforderungen</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courseTypes.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>{emptyText}</DataTableEmpty>
          ) : (
            courseTypes.map((courseType) => (
              <TableRow key={courseType.id}>
                <SelectCell id={courseType.id} label={`${courseType.code} ${courseType.name}`} />
                <DataTableCell className="font-mono text-xs whitespace-nowrap">{courseType.code}</DataTableCell>
                <DataTableCell className="max-w-md">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(courseType)}
                      className="truncate text-start font-medium outline-none hover:underline focus-visible:underline"
                    >
                      {courseType.name}
                    </button>
                    <KindBadge kind={courseType.kind} />
                    {courseType.track ? <TrackBadge track={courseType.track} /> : null}
                  </div>
                  {courseType.description || courseType.curriculumModule ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {[
                        courseType.curriculumModule ? formatModuleSlot(courseType.curriculumModule) : null,
                        courseType.description,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  ) : null}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap">{formatDuration(courseType)}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">
                  {formatParticipants(courseType.minParticipants, courseType.maxParticipants)}
                </DataTableCell>
                <DataTableCell className="font-mono text-xs uppercase">{courseType.languages.join(" ")}</DataTableCell>
                <DataTableCell className="max-w-xs">
                  <Requirements courseType={courseType} />
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-col items-start gap-1">
                    <ActiveBadge active={courseType.active} />
                    <StatusDot
                      tone={courseType.published ? "ok" : "muted"}
                      label={courseType.published ? "veröffentlicht" : "nicht veröffentlicht"}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Aktionen für ${courseType.code}`}>
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(courseType)}>Bearbeiten</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openRequirements(courseType)}>Anforderungen</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => openDelete(courseType)}>
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>

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
        description="Der Kurstyp wird dauerhaft gelöscht, samt seinen Anforderungen. Solange Kurse oder ein ÜK-Modul ihn verwenden, lehnt das System das Löschen ab; archivieren Sie ihn dann stattdessen."
        onConfirm={handleDelete}
      />
    </SelectionProvider>
  );
}

/** Skills by name, then certificate codes and devices (`2× STA`) in mono; «–» without any. */
function Requirements({ courseType }: { courseType: CourseType }) {
  const { requiredSkills, requiredCertificates, requiredDevices } = courseType;
  if (!requiredSkills.length && !requiredCertificates.length && !requiredDevices.length) {
    return <span className="text-muted-foreground">–</span>;
  }
  const codes = [
    ...requiredCertificates.map((certificate) => certificate.code),
    ...requiredDevices.map((device) => `${device.quantity}× ${device.deviceType.code}`),
  ];
  return (
    <>
      {requiredSkills.length ? (
        <div className="truncate" title={requiredSkills.map((skill) => skill.name).join(", ")}>
          {requiredSkills.map((skill) => skill.name).join(", ")}
        </div>
      ) : null}
      {codes.length ? (
        <div className="truncate font-mono text-xs text-muted-foreground" title={codes.join(", ")}>
          {codes.join(", ")}
        </div>
      ) : null}
    </>
  );
}
