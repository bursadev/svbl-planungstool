import Link from "next/link";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow } from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { Location } from "@/lib/api/locations";
import { formatAddress } from "@/lib/format";
import { UkBadge } from "./uk-badge";

const COLUMNS = 5;

/** The `/standorte` list; every row links to the Standort's detail page. */
export function LocationsTable({ locations }: { locations: Location[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Standort</DataTableHead>
          <DataTableHead className="text-right">Räume</DataTableHead>
          <DataTableHead className="text-right">Kapazität</DataTableHead>
          <DataTableHead>Kontakt</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Standorte gefunden.</DataTableEmpty>
        ) : (
          locations.map((location) => {
            const href = `/standorte/${location.id}`;
            const address = formatAddress(location);
            return (
              <LinkRow key={location.id} href={href}>
                <DataTableCell className="max-w-md">
                  <div className="flex items-center gap-2">
                    <Link href={href} className="truncate font-medium outline-none hover:underline focus-visible:underline">
                      {location.name}
                    </Link>
                    {location.hostsUk ? <UkBadge /> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{location.code}</span>
                    {address ? ` · ${address}` : null}
                  </div>
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{location.rooms.length}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">
                  {location.parallelCourseCapacity}
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  {location.contactName || location.contactEmail ? (
                    <>
                      <div className="truncate">{location.contactName ?? "–"}</div>
                      {location.contactEmail ? (
                        <div className="truncate text-xs text-muted-foreground">{location.contactEmail}</div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  <ActiveBadge active={location.active} />
                </DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
