import Link from "next/link";
import {
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  LinkRow,
  SortableHead,
  StatusDot,
} from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { CourseRow } from "@/lib/api/courses";
import { LANGUAGE_SHORT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { COURSE_STATUS_LABELS, courseTone, formatDayRange, instructorNames } from "./course-status";

const COLUMNS = 8;

type CoursesTableProps = {
  courses: CourseRow[];
  /** The list's own query string (without `kurs`); a row links to it plus `kurs=<id>`, which opens the drawer. */
  query: string;
};

function hrefFor(query: string, id: string): string {
  const params = new URLSearchParams(query);
  params.set("kurs", id);
  return `/kurse?${params.toString()}`;
}

/** Tab «Durchführungen»: one row per course in the range, in the handoff's columns. */
export function CoursesTable({ courses, query }: CoursesTableProps) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead sortKey="courseType" defaultSort="startsOn">
            Code
          </SortableHead>
          <DataTableHead>Kurs</DataTableHead>
          <SortableHead sortKey="location" defaultSort="startsOn">
            Standort
          </SortableHead>
          <SortableHead sortKey="startsOn" defaultSort="startsOn">
            KW
          </SortableHead>
          <DataTableHead>Tage</DataTableHead>
          <DataTableHead>Ausbilder</DataTableHead>
          <DataTableHead className="text-right">TN</DataTableHead>
          <SortableHead sortKey="status" defaultSort="startsOn">
            Status
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Kurse im gewählten Zeitraum.</DataTableEmpty>
        ) : (
          courses.map((course) => {
            const href = hrefFor(query, course.id);
            const unstaffed = course.instructors.length === 0;
            return (
              <LinkRow key={course.id} href={href}>
                <DataTableCell className="font-mono text-xs">
                  <Link href={href} scroll={false} className="outline-none hover:underline focus-visible:underline">
                    {course.courseType.code}
                  </Link>
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  <div className="truncate">{course.courseType.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {LANGUAGE_SHORT_LABELS[course.language]}
                    {course.externalRef ? ` · ${course.externalRef}` : null}
                  </div>
                </DataTableCell>
                <DataTableCell className="max-w-48 truncate">{course.location.name}</DataTableCell>
                <DataTableCell className="font-mono text-xs tabular-nums">
                  {course.isoWeek === null ? "—" : `KW ${course.isoWeek}`}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap">{formatDayRange(course.startsOn, course.endsOn)}</DataTableCell>
                <DataTableCell className={cn("max-w-48 truncate", unstaffed && "text-warn")}>
                  {instructorNames(course)}
                </DataTableCell>
                <DataTableCell className="text-right font-mono text-xs tabular-nums">
                  {course.booked}/{course.capacity}
                </DataTableCell>
                <DataTableCell>
                  <StatusDot tone={courseTone(course)} label={COURSE_STATUS_LABELS[course.status]} />
                </DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
