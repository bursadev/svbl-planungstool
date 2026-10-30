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
import { CUSTOMERS_PATH, type CustomerRow } from "@/lib/api/customers";
import { formatAddress } from "@/lib/format";

const COLUMNS = 6;

/** The `/kunden` list with row selection for bulk actions; every row links to the Kunde's detail page. */
export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  return (
    <SelectionProvider ids={customers.map((customer) => customer.id)}>
      <BulkBar basePath={CUSTOMERS_PATH} plural="Kunden" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="name" defaultSort="name">
              Kunde
            </SortableHead>
            <DataTableHead>Kontakt</DataTableHead>
            <DataTableHead className="text-right">Teilnehmende</DataTableHead>
            <DataTableHead className="text-right">Standorte</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Keine Kunden gefunden.</DataTableEmpty>
          ) : (
            customers.map((customer) => {
              const href = `/kunden/${customer.id}`;
              const address = formatAddress(customer);
              return (
                <LinkRow key={customer.id} href={href}>
                  <SelectCell id={customer.id} label={customer.name} />
                  <DataTableCell className="max-w-md">
                    <Link
                      href={href}
                      className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                    >
                      {customer.name}
                    </Link>
                    {address ? <div className="truncate text-xs text-muted-foreground">{address}</div> : null}
                  </DataTableCell>
                  <DataTableCell className="max-w-xs">
                    {customer.contactName || customer.contactEmail ? (
                      <>
                        <div className="truncate">{customer.contactName ?? "–"}</div>
                        {customer.contactEmail ? (
                          <div className="truncate text-xs text-muted-foreground">{customer.contactEmail}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono tabular-nums">{customer.participantCount}</DataTableCell>
                  <DataTableCell className="text-right font-mono tabular-nums">{customer.siteCount}</DataTableCell>
                  <DataTableCell>
                    <ActiveBadge active={customer.active} />
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
