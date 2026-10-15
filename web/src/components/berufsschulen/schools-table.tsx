import Link from "next/link";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow } from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { VocationalSchool } from "@/lib/api/vocational-schools";
import { LANGUAGE_LABELS } from "@/lib/format";

const COLUMNS = 6;

/** The `/berufsschulen` list; every row links to the school's detail page. */
export function SchoolsTable({ schools }: { schools: VocationalSchool[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Schule</DataTableHead>
          <DataTableHead>Sprache</DataTableHead>
          <DataTableHead>ÜK-Standort</DataTableHead>
          <DataTableHead className="text-right">Klassen</DataTableHead>
          <DataTableHead className="text-right">Lernende</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schools.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Noch keine Berufsschulen erfasst.</DataTableEmpty>
        ) : (
          schools.map((school) => {
            const href = `/berufsschulen/${school.id}`;
            return (
              <LinkRow key={school.id} href={href}>
                <DataTableCell className="max-w-md">
                  <Link href={href} className="block truncate font-medium outline-none hover:underline focus-visible:underline">
                    {school.name}
                  </Link>
                  <div className="truncate text-xs text-muted-foreground">{school.shortName}</div>
                </DataTableCell>
                <DataTableCell>{LANGUAGE_LABELS[school.language]}</DataTableCell>
                <DataTableCell>{school.nearestLocation.name}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{school.classes.length}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{school.apprenticeCount}</DataTableCell>
                <DataTableCell>
                  <ActiveBadge active={school.active} />
                </DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
