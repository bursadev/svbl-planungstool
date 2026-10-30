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
import { TRAINING_COMPANIES_PATH, type TrainingCompanyRow } from "@/lib/api/training-companies";
import { formatAddress } from "@/lib/format";

const COLUMNS = 7;

/** The `/lernende/lehrbetriebe` list with row selection for bulk actions; every row links to the detail page. */
export function CompaniesTable({ companies }: { companies: TrainingCompanyRow[] }) {
  return (
    <SelectionProvider ids={companies.map((company) => company.id)}>
      <BulkBar basePath={TRAINING_COMPANIES_PATH} plural="Lehrbetriebe" />
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SelectAllHead />
            <SortableHead sortKey="name" defaultSort="name">
              Lehrbetrieb
            </SortableHead>
            <SortableHead sortKey="city" defaultSort="name">
              Ort
            </SortableHead>
            <DataTableHead>Kontakt</DataTableHead>
            <DataTableHead className="text-right">Berufsbildner</DataTableHead>
            <DataTableHead className="text-right">Lernende</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Keine Lehrbetriebe gefunden.</DataTableEmpty>
          ) : (
            companies.map((company) => {
              const href = `/lernende/lehrbetriebe/${company.id}`;
              const address = company.addressLine;
              const place = formatAddress({ postalCode: company.postalCode, city: company.city });
              return (
                <LinkRow key={company.id} href={href}>
                  <SelectCell id={company.id} label={company.name} />
                  <DataTableCell className="max-w-md">
                    <Link
                      href={href}
                      className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                    >
                      {company.name}
                    </Link>
                    {address || company.externalRef ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {address}
                        {address && company.externalRef ? " · " : null}
                        {company.externalRef ? <span className="font-mono">{company.externalRef}</span> : null}
                      </div>
                    ) : null}
                  </DataTableCell>
                  <DataTableCell className="max-w-48 truncate">
                    {place || <span className="text-muted-foreground">–</span>}
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
                  <DataTableCell>
                    <ActiveBadge active={company.active} />
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
