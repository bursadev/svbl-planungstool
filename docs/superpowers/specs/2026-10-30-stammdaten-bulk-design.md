# Stammdaten: CSV import/export, bulk actions, archive, filtering

Date: 2026-10-30. Status: approved in conversation, implementation started. Extends `2026-10-01-stammdaten-crud-design.md`.

Planners fill the Stammdaten from Excel lists rather than one dialog at a time. They also need to clean up the OdAOrg import, which brought in 2,947 Lehrbetriebe, 1,624 Kurstypen, 753 Kunden, 2,766 Teilnehmende and 5,435 Lernende. Lists that load every row don't work at that size. This slice adds the following to the Stammdaten lists:

1. **CSV template**: an example file with the import columns and two example rows.
2. **CSV export**: all rows, or the currently filtered rows. The file can be imported again.
3. **CSV import**: upload, then a dry run with a per-row error report, then an all-or-nothing write. Rows are created or updated by their natural key.
4. **Bulk actions** on selected rows: archive, restore, delete. A delete that is blocked by references reports which rows failed and why, and the UI offers to archive them.
5. **Archive**: archived rows are hidden by default; the list's status filter shows them.
6. **Filtering**: accent-insensitive multi-word search, more filters per list, sortable columns, pagination with a hit count, and a "reset filters" button.

## Where it applies

| Screen | Archive via | Import key | Template / import | Export | Bulk delete | New filters |
|---|---|---|---|---|---|---|
| Standorte | `active` | Code | yes | yes | yes | Art, ÜK, Sprachregion, Kanton |
| Ausbilder | `status` = inactive | E-Mail, else externe Ref. | yes (skills as names, home location as code) | yes | yes | Zertifikatstyp, Zertifikatsstatus; paging |
| Geräte | `status` = retired | Inventarnummer | yes | yes | yes | Suche |
| Kataloge: Skills, Zertifikatstypen, Gerätetypen | `active` (new on certificate_type) | Name / Code / Code | yes | yes | yes | Suche |
| Kurstypen | `active` | Code | yes | yes | yes | Suche, Sprache; paging |
| Bildungsplan: Zeitfenster | — (delete only) | Modul + Jahrgang + Standort | yes (admins create windows, planning decision of 2026-10-30) | yes | yes | — |
| Berufsschulen | `active` | Kurzname | yes | yes | yes | Suche, Sprache, ÜK-Standort |
| Lehrbetriebe | `active` (new) | externe Ref., else Name + PLZ | yes | yes | yes | Kanton; paging |
| Kunden | `active` | Kundennummer / Name | yes | yes | yes | paging |
| Teilnehmende | — | E-Mail / Name + Geburtsdatum | yes | yes | yes | paging |
| Lernende | `status` (finished, dropped) | — | **no**: the school export is the source (Requirements §7); school import comes with the import screen | yes | **no** | Status, Lehrbetrieb, Klasse, Sprache; paging |

Out of scope: Räume and Schulklassen (sub-tables inside detail pages, few rows), Benutzer (Clerk), Einstellungen.

## Backend

### CSV format

- UTF-8 with BOM and `;` as the separator, which is what Swiss Excel opens and saves by default. The import also accepts `,` and tab (detected from the header line) and files without BOM.
- RFC 4180 quoting. Dates are exported as `31.12.2026`; `2026-12-31` is accepted on import. Booleans are exported as `ja`/`nein`; `true`, `false`, `1`, `0` and `x` are accepted. Enums use their German labels (the API values are accepted too). Lists such as skills or languages are comma-separated inside one cell. References use codes or names, never UUIDs.
- Headers are German, matched case- and space-insensitively. Unknown columns are ignored (export-only columns such as "Räume" re-import cleanly). A missing required column is a file error.

### Pieces in `src/common/`

- `csv.ts`: `parseCsv(text)` and `toCsv(rows)`, unit-tested.
- `tabular.ts`: column builders (`text`, `int`, `number`, `bool`, `date`, `enumOf`, `list`, `ref`, `refList`) that know both how to export a row and how to parse a cell into a DTO field; `templateCsv(columns)`, `exportCsv(columns, rows)`.
- `csv-import.ts`: `runCsvImport(spec, text, { dryRun, actor })`. Parses, maps headers and parses cells, resolves references through the spec's lookups, and validates each row with the resource's **Create DTO** (the same class-validator rules as the dialogs). It detects duplicate keys within the file and looks up existing rows by natural key, classifying each row as created, updated or unchanged. Any error means nothing is written. Otherwise one transaction writes in chunks of 500 and inserts one audit entry per row, with before and after snapshots. Report: `{ total, created, updated, unchanged, errors: [{ line, column, message }] }`.
- `bulk.ts`: `BulkActionDto { action: 'archive' | 'restore' | 'delete', ids: uuid[] (1–2000) }` and `runBulk(...)`. Archive and restore run as one `UPDATE … WHERE id IN`. Delete first tries all ids in one statement inside a savepoint. On a foreign-key violation it retries id by id, each in its own savepoint, so the referenced rows end up in `failed` with the German reason. Audit entries are written in bulk. Result: `{ succeeded: string[], failed: [{ id, label, message }] }`.
- `list-query.ts`:
  - `ListPageQuery`: `page`, `pageSize` (max 500), `sort`, `dir`, plus `archive=active|archived|all`. Without `archive` the API keeps returning every row, so existing callers and dropdowns are unaffected.
  - `applySearch(qb, fields, q)`: every word has to match some field, using `unaccent(…) ILIKE unaccent(…)`, so "zurich" finds "Zürich".
  - `applyPaging(qb, query, sortable)`, and a `X-Total-Count` response header (exposed through CORS). The body stays an array.

### Routes per resource

`GET /<resource>/export.csv?<list filters>` · `GET /<resource>/import-template.csv` · `POST /<resource>/import?dryRun=true|false` with body `{ csv: string }` (JSON body limit raised to 10 MB) · `POST /<resource>/bulk`. Writes require `WRITE_ROLES`, like all Stammdaten writes. CSV responses use `Content-Disposition: attachment; filename="standorte-2026-10-30.csv"`.

### Migration

`CREATE EXTENSION IF NOT EXISTS unaccent`, plus an `active boolean NOT NULL DEFAULT true` column on `certificate_type` and `training_company`.

## Frontend

Shared components in `components/data/`:
- `ArchiveFilter`: URL `?archiv=archiviert|alle`. When absent, only active rows show.
- `Pagination`: URL `?seite=`, `?proSeite=` (25/50/100/200), "1–50 von 5'435".
- `SortableHead`: URL `?sortierung=&richtung=`.
- `ResetFilters`: appears when any filter is set.
- `SelectionProvider`, `RowCheckbox`, `SelectAllCheckbox`, `BulkBar`: a sticky bar showing "3 ausgewählt" with Archivieren, Wiederherstellen and Löschen. The confirm dialog names the consequence. After a partial delete, a dialog lists the rows that could not be deleted, with the reason and an "Stattdessen archivieren" button.
- `CsvMenu`: dropdown "CSV" with Vorlage herunterladen · Alle exportieren · Gefilterte Ansicht exportieren · Importieren…
- `CsvImportDialog`: choose a file, run the dry run, show the summary (neu, aktualisiert, unverändert) and an error table (Zeile, Spalte, Fehler). "Importieren" is enabled only without errors.

`lib/api/request.ts` gains `onResponse` (to read `X-Total-Count`), and `lib/api/tabular.ts` adds `downloadCsv(path)` (an authenticated fetch that saves a blob), `importCsv(path, csv, dryRun)` and `bulk(path, action, ids)`.

## Tests

- Unit: `csv.ts` (quoting, separators, BOM, CRLF, empty cells) and the column parsers (dates, booleans, enums, lists).
- e2e per resource: the template downloads; an export re-imports as all unchanged; an import with an error writes nothing and reports line and column; a valid import creates and updates rows; bulk archive and restore work; a bulk delete with one referenced row returns it in `failed`; `archive=active` hides archived rows; search ignores accents; paging sets `X-Total-Count`.
