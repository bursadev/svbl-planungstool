import Link from "next/link";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { LinkRow } from "@/components/data/link-row";
import { StatusDot } from "@/components/data/status-dot";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { ApprenticeRow } from "@/lib/api/apprentices";
import { TRACK_LABELS, formatDate } from "@/lib/format";
import { APPRENTICE_STATUS_LABELS, APPRENTICE_STATUS_TONES } from "./labels";

const COLUMNS = 8;

const dash = <span className="text-muted-foreground">–</span>;

/** The `/lernende` list; every row links to the Lernende/r's detail page. */
export function ApprenticesTable({ apprentices }: { apprentices: ApprenticeRow[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Name</DataTableHead>
          <DataTableHead>Geburtsdatum</DataTableHead>
          <DataTableHead>Lehrgang</DataTableHead>
          <DataTableHead>Jahrgang</DataTableHead>
          <DataTableHead>Berufsschule</DataTableHead>
          <DataTableHead>Klasse</DataTableHead>
          <DataTableHead>Lehrbetrieb</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apprentices.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Lernenden gefunden.</DataTableEmpty>
        ) : (
          apprentices.map((apprentice) => {
            const href = `/lernende/${apprentice.id}`;
            return (
              <LinkRow key={apprentice.id} href={href}>
                <DataTableCell className="max-w-xs">
                  <Link href={href} className="truncate font-medium outline-none hover:underline focus-visible:underline">
                    {apprentice.lastName}, {apprentice.firstName}
                  </Link>
                </DataTableCell>
                <DataTableCell className="font-mono tabular-nums">{formatDate(apprentice.birthDate)}</DataTableCell>
                <DataTableCell>{TRACK_LABELS[apprentice.track]}</DataTableCell>
                <DataTableCell>{apprentice.cohort.label}</DataTableCell>
                <DataTableCell>
                  <span title={apprentice.vocationalSchool.name}>{apprentice.vocationalSchool.shortName}</span>
                </DataTableCell>
                <DataTableCell className="font-mono">{apprentice.schoolClass?.code ?? dash}</DataTableCell>
                <DataTableCell className="max-w-xs truncate">{apprentice.trainingCompany?.name ?? dash}</DataTableCell>
                <DataTableCell>
                  <StatusDot
                    tone={APPRENTICE_STATUS_TONES[apprentice.status]}
                    label={APPRENTICE_STATUS_LABELS[apprentice.status]}
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
