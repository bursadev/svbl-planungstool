"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, FileSpreadsheetIcon, FileUpIcon, ListFilterIcon, TableIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withQuery } from "@/lib/api/query";
import { ApiError } from "@/lib/api/request";
import { downloadCsv, importCsv, readCsvFile, type ImportReport } from "@/lib/api/tabular";

type CsvMenuProps = {
  /** API base path of the resource, e.g. `/locations`. */
  basePath: string;
  /** Plural for titles: «Standorte importieren». */
  plural: string;
  /** API filters of the current view, for «Gefilterte Ansicht exportieren». */
  filters?: Record<string, string | number | boolean | null | undefined>;
  /** Whether the view is filtered; the filtered export is offered only then. */
  filtered?: boolean;
  /** False for export-only lists (Lernende). */
  importable?: boolean;
};

/**
 * «CSV» menu in the page header: example file, export of everything or of the filtered view, and
 * the import. The example file has the import columns and two example rows; an export can be
 * edited in Excel and imported again (rows are matched by their key, e.g. the code).
 */
export function CsvMenu({ basePath, plural, filters, filtered = false, importable = true }: CsvMenuProps) {
  const [importing, setImporting] = useState(false);

  async function download(path: string) {
    try {
      await downloadCsv(path);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Download fehlgeschlagen.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FileSpreadsheetIcon data-icon="inline-start" />
            CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {importable ? (
            <>
              <DropdownMenuItem onSelect={() => setImporting(true)}>
                <FileUpIcon />
                Importieren…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => download(`${basePath}/import-template.csv`)}>
                <DownloadIcon />
                Vorlage herunterladen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onSelect={() => download(`${basePath}/export.csv`)}>
            <TableIcon />
            Alle exportieren
          </DropdownMenuItem>
          {filtered ? (
            <DropdownMenuItem onSelect={() => download(withQuery(`${basePath}/export.csv`, filters ?? {}))}>
              <ListFilterIcon />
              Gefilterte Ansicht exportieren
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {importable ? (
        <CsvImportDialog
          open={importing}
          onOpenChange={setImporting}
          basePath={basePath}
          plural={plural}
          onTemplate={() => download(`${basePath}/import-template.csv`)}
        />
      ) : null}
    </>
  );
}

type CsvImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath: string;
  plural: string;
  onTemplate: () => void;
};

const ACTION_LABELS = { create: "neu", update: "geändert", unchanged: "unverändert" } as const;

/**
 * Two steps: choosing a file runs the check (dry run) and shows what would happen, with every
 * error by line and column; «Importieren» writes, and is only enabled for a file without errors.
 */
function CsvImportDialog({ open, onOpenChange, basePath, plural, onTemplate }: CsvImportDialogProps) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setFileName(null);
    setCsv(null);
    setReport(null);
    if (input.current) input.current.value = "";
  }

  async function check(file: File) {
    setBusy(true);
    setReport(null);
    try {
      const text = await readCsvFile(file);
      setFileName(file.name);
      setCsv(text);
      setReport(await importCsv(basePath, text, true));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Die Datei konnte nicht geprüft werden.");
    } finally {
      setBusy(false);
    }
  }

  async function write() {
    if (!csv) return;
    setBusy(true);
    try {
      const result = await importCsv(basePath, csv, false);
      if (!result.written) {
        setReport(result);
        return;
      }
      toast.success(
        `${plural} importiert: ${result.created} neu, ${result.updated} geändert, ${result.unchanged} unverändert`,
      );
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    } finally {
      setBusy(false);
    }
  }

  const hasErrors = !!report && (report.errors.length > 0 || report.moreErrors > 0);
  const changes = report ? report.created + report.updated : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{plural} importieren</DialogTitle>
          <DialogDescription>
            CSV-Datei aus Excel («CSV UTF-8» oder «CSV (Trennzeichen-getrennt)»). Bestehende Einträge werden über ihren
            Schlüssel erkannt und aktualisiert, alle anderen neu angelegt. Leere Zellen leeren das Feld; fehlende
            Spalten bleiben unverändert. Enthält die Datei Fehler, wird nichts gespeichert.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv,.txt"
            className="sr-only"
            id="csv-import-file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void check(file);
            }}
          />
          <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            <FileUpIcon data-icon="inline-start" />
            {fileName ? "Andere Datei wählen" : "Datei wählen"}
          </Button>
          <Button variant="ghost" onClick={onTemplate}>
            <DownloadIcon data-icon="inline-start" />
            Vorlage herunterladen
          </Button>
          {fileName ? <span className="truncate text-[13px] text-muted-foreground">{fileName}</span> : null}
        </div>

        {busy && !report ? <p className="text-[13px] text-muted-foreground">Datei wird geprüft…</p> : null}

        {report ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat label="Zeilen" value={report.total} />
              <Stat label="neu" value={report.created} tone="ok" />
              <Stat label="geändert" value={report.updated} tone="accent" />
              <Stat label="unverändert" value={report.unchanged} />
            </div>
            {hasErrors ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-medium text-destructive">
                  {report.errors.length + report.moreErrors} Fehler – es wird nichts gespeichert. Datei korrigieren und
                  erneut wählen.
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg ring-1 ring-foreground/10">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-card text-left text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                      <tr>
                        <th className="px-3 py-1.5 font-medium">Zeile</th>
                        <th className="px-3 py-1.5 font-medium">Spalte</th>
                        <th className="px-3 py-1.5 font-medium">Fehler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.errors.map((error, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-mono tabular-nums">{error.line}</td>
                          <td className="px-3 py-1.5">{error.column ?? "–"}</td>
                          <td className="px-3 py-1.5">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.moreErrors ? (
                  <p className="text-xs text-muted-foreground">… und {report.moreErrors} weitere Fehler.</p>
                ) : null}
              </div>
            ) : changes > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-lg text-[13px] ring-1 ring-foreground/10">
                <ul className="divide-y">
                  {report.rows
                    .filter((row) => row.action !== "unchanged")
                    .map((row) => (
                      <li key={row.line} className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="truncate">{row.label}</span>
                        <span className="shrink-0 text-muted-foreground">{ACTION_LABELS[row.action]}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">Die Datei enthält keine Änderungen.</p>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Abbrechen
          </Button>
          <Button disabled={busy || !report || hasErrors || changes === 0} onClick={write}>
            {report && !hasErrors && changes > 0 ? `${changes} Änderungen importieren` : "Importieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "accent" }) {
  const color = tone === "ok" && value ? "text-ok" : tone === "accent" && value ? "text-primary" : "";
  return (
    <div className="rounded-lg py-2 ring-1 ring-foreground/10">
      <div className={`font-mono text-lg tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
