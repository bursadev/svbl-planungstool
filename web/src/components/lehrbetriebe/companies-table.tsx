import Link from "next/link";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow } from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { TrainingCompanyRow } from "@/lib/api/training-companies";
import { formatAddress } from "@/lib/format";

const COLUMNS = 4;

/** The `/lernende/lehrbetriebe` list; every row links to the Lehrbetrieb's detail page. */
export function CompaniesTable({ companies }: { companies: TrainingCompanyRow[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Lehrbetrieb</DataTableHead>
          <DataTableHead>Kontakt</DataTableHead>
          <DataTableHead className="text-right">Berufsbildner</DataTableHead>
          <DataTableHead className="text-right">Lernende</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Lehrbetriebe gefunden.</DataTableEmpty>
        ) : (
          companies.map((company) => {
            const href = `/lernende/lehrbetriebe/${company.id}`;
            const address = formatAddress(company);
            return (
              <LinkRow key={company.id} href={href}>
                <DataTableCell className="max-w-md">
                  <Link href={href} className="block truncate font-medium outline-none hover:underline focus-visible:underline">
                    {company.name}
                  </Link>
                  {address ? <div className="truncate text-xs text-muted-foreground">{address}</div> : null}
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  {company.email || company.phone ? (
                    <>
                      {company.email ? <div className="truncate">{company.email}</div> : null}
                      {company.phone ? (
                        <div className="truncate text-xs text-muted-foreground">{company.phone}</div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{company.trainerCount}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{company.apprenticeCount}</DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
