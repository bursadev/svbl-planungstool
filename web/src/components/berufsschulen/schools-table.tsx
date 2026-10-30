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
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { VOCATIONAL_SCHOOLS_PATH, type VocationalSchool } from "@/lib/api/vocational-schools";
import { LANGUAGE_LABELS } from "@/lib/format";

const COLUMNS = 7;

/** The `/berufsschulen` list with row selection for bulk actions; every row links to the detail page. */
export function SchoolsTable({ schools }: { schools: VocationalSchool[] }) {
  return (
    <SelectionProvider ids={schools.map((school) => school.id)}>
      <BulkBar basePath={VOCATIONAL_SCHOOLS_PATH} plural="Berufsschulen" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="name" defaultSort="name">
              Schule
            </SortableHead>
            <DataTableHead>Sprache</DataTableHead>
            <SortableHead sortKey="location" defaultSort="name">
              ÜK-Standort
            </SortableHead>
            <DataTableHead className="text-right">Klassen</DataTableHead>
            <DataTableHead className="text-right">Lernende</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Keine Berufsschulen gefunden.</DataTableEmpty>
          ) : (
            schools.map((school) => {
              const href = `/berufsschulen/${school.id}`;
              return (
                <LinkRow key={school.id} href={href}>
                  <SelectCell id={school.id} label={school.name} />
                  <DataTableCell className="max-w-md">
                    <Link
                      href={href}
                      className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                    >
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
    </SelectionProvider>
  );
}
