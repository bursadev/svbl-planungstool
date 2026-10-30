import Link from "next/link";
import {
  ActiveBadge,
  BulkBar,
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  LinkRow,
  SelectAllHead,
  SelectCell,
  SelectionProvider,
  SortableHead,
} from "@/components/data";
import { InitialsAvatar } from "@/components/data/initials-avatar";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { INSTRUCTORS_PATH, type InstructorRow } from "@/lib/api/instructors";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/labels";
import { LanguageBadges } from "./language-badges";
import { SkillChips } from "./skill-chip";

const COLUMNS = 7;

/**
 * The `/ausbilder` list with row selection for bulk actions (archived = inactive); every row
 * links to the Ausbilder's detail page.
 */
export function InstructorsTable({ instructors }: { instructors: InstructorRow[] }) {
  return (
    <SelectionProvider ids={instructors.map((instructor) => instructor.id)}>
      <BulkBar basePath={INSTRUCTORS_PATH} plural="Ausbilder" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="name" defaultSort="name">
              Name
            </SortableHead>
            <SortableHead sortKey="employmentType" defaultSort="name">
              Anstellung
            </SortableHead>
            <SortableHead sortKey="location" defaultSort="name">
              Standort
            </SortableHead>
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
                  <SelectCell id={instructor.id} label={name} />
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
                    <ActiveBadge active={instructor.status === "active"} />
                  </DataTableCell>
                </LinkRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
    </SelectionProvider>
  );
}
