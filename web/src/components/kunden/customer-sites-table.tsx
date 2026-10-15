import Link from "next/link";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow } from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { Customer } from "@/lib/api/customers";

const COLUMNS = 3;

/** Tab «Standorte»: the Kundenstandorte, managed under /standorte (kind «Kundenstandort»). */
export function CustomerSitesTable({ sites }: { sites: Customer["sites"] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Kundenstandorte werden unter «Standorte» gepflegt und hier dem Kunden zugeordnet.
      </p>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Standort</DataTableHead>
            <DataTableHead>Ort</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Kundenstandorte zugeordnet.</DataTableEmpty>
          ) : (
            sites.map((site) => {
              const href = `/standorte/${site.id}`;
              return (
                <LinkRow key={site.id} href={href}>
                  <DataTableCell className="max-w-md">
                    <Link href={href} className="block truncate font-medium outline-none hover:underline focus-visible:underline">
                      {site.name}
                    </Link>
                    <div className="truncate font-mono text-xs text-muted-foreground">{site.code}</div>
                  </DataTableCell>
                  <DataTableCell>{site.city ?? <span className="text-muted-foreground">–</span>}</DataTableCell>
                  <DataTableCell>
                    <ActiveBadge active={site.active} />
                  </DataTableCell>
                </LinkRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
