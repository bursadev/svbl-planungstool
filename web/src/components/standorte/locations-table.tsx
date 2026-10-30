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
import { LOCATIONS_PATH, type Location } from "@/lib/api/locations";
import { formatAddress } from "@/lib/format";
import { UkBadge } from "./uk-badge";

const COLUMNS = 6;

/** The `/standorte` list with row selection for bulk actions; every row links to the detail page. */
export function LocationsTable({ locations }: { locations: Location[] }) {
  return (
    <SelectionProvider ids={locations.map((location) => location.id)}>
      <BulkBar basePath={LOCATIONS_PATH} plural="Standorte" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="name" defaultSort="name">
              Standort
            </SortableHead>
            <DataTableHead className="text-right">Räume</DataTableHead>
            <SortableHead sortKey="capacity" defaultSort="name" className="text-right">
              Kapazität
            </SortableHead>
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
                  <SelectCell id={location.id} label={location.name} />
                  <DataTableCell className="max-w-md">
                    <div className="flex items-center gap-2">
                      <Link
                        href={href}
                        className="truncate font-medium outline-none hover:underline focus-visible:underline"
                      >
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
    </SelectionProvider>
  );
}
