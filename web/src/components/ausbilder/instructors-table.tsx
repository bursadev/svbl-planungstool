import Link from "next/link";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow } from "@/components/data";
import { InitialsAvatar } from "@/components/data/initials-avatar";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { InstructorRow } from "@/lib/api/instructors";
import { EMPLOYMENT_TYPE_LABELS, INSTRUCTOR_STATUS_LABELS } from "@/lib/labels";
import { LanguageBadges } from "./language-badges";
import { SkillChips } from "./skill-chip";

const COLUMNS = 6;

/** The `/ausbilder` list; every row links to the Ausbilder's detail page. */
export function InstructorsTable({ instructors }: { instructors: InstructorRow[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Name</DataTableHead>
          <DataTableHead>Anstellung</DataTableHead>
          <DataTableHead>Standort</DataTableHead>
          <DataTableHead>Sprachen</DataTableHead>
          <DataTableHead>Skills</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instructors.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Ausbilder gefunden.</DataTableEmpty>
        ) : (
          instructors.map((instructor) => {
            const href = `/ausbilder/${instructor.id}`;
            const name = `${instructor.firstName} ${instructor.lastName}`;
            return (
              <LinkRow key={instructor.id} href={href}>
                <DataTableCell className="max-w-xs">
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar name={name} />
                    <div className="min-w-0">
                      <Link
                        href={href}
                        className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                      >
                        {name}
                      </Link>
                      {instructor.email ? (
                        <div className="truncate text-xs text-muted-foreground">{instructor.email}</div>
                      ) : null}
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>{EMPLOYMENT_TYPE_LABELS[instructor.employmentType]}</DataTableCell>
                <DataTableCell className="max-w-48 truncate">{instructor.homeLocation.name}</DataTableCell>
                <DataTableCell>
                  <LanguageBadges languages={instructor.languages} />
                </DataTableCell>
                <DataTableCell className="max-w-md">
                  <SkillChips skills={instructor.skills} />
                </DataTableCell>
                <DataTableCell>
                  <ActiveBadge
                    active={instructor.status === "active"}
                    activeLabel={INSTRUCTOR_STATUS_LABELS.active}
                    inactiveLabel={INSTRUCTOR_STATUS_LABELS.inactive}
                  />
                </DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
