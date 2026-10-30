"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/request";
import { bulkAction, type BulkAction, type BulkResult } from "@/lib/api/tabular";
import { DataTableCell, DataTableHead } from "./data-table";

type SelectionContextValue = {
  ids: string[];
  selected: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string, on: boolean) => void;
  setAll: (on: boolean) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function useSelection(): SelectionContextValue {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("Selection components need a SelectionProvider.");
  return value;
}

/**
 * Holds the checked rows of one list page. `ids` are the rows currently shown; a selection that
 * scrolls out of the list (new filter, next page) is dropped, so bulk actions only ever touch
 * rows the user can see.
 */
export function SelectionProvider({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const value = useMemo<SelectionContextValue>(() => {
    const selected = ids.filter((id) => checked.has(id));
    return {
      ids,
      selected,
      isSelected: (id) => checked.has(id),
      toggle: (id, on) =>
        setChecked((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        }),
      setAll: (on) => setChecked(on ? new Set(ids) : new Set()),
      clear: () => setChecked(new Set()),
    };
  }, [ids, checked]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

/** Header cell with «alle auf dieser Seite auswählen». */
export function SelectAllHead() {
  const { ids, selected, setAll } = useSelection();
  const state = selected.length === 0 ? false : selected.length === ids.length ? true : "indeterminate";
  return (
    <DataTableHead className="w-10 pe-0">
      <Checkbox
        aria-label="Alle auf dieser Seite auswählen"
        checked={state}
        disabled={ids.length === 0}
        onCheckedChange={(on) => setAll(on === true)}
      />
    </DataTableHead>
  );
}

/** First cell of a selectable row. The checkbox is a button, so `LinkRow` does not navigate on it. */
export function SelectCell({ id, label }: { id: string; label: string }) {
  const { isSelected, toggle } = useSelection();
  return (
    <DataTableCell className="w-10 pe-0">
      <Checkbox
        aria-label={`${label} auswählen`}
        checked={isSelected(id)}
        onCheckedChange={(on) => toggle(id, on === true)}
      />
    </DataTableCell>
  );
}

/** Bare checkbox for selectable layouts that are not tables (e.g. the Kurstypen cards). */
export function SelectCheckbox({ id, label, className }: { id: string; label: string; className?: string }) {
  const { isSelected, toggle } = useSelection();
  return (
    <Checkbox
      aria-label={`${label} auswählen`}
      checked={isSelected(id)}
      onCheckedChange={(on) => toggle(id, on === true)}
      onClick={(event) => event.stopPropagation()}
      className={className}
    />
  );
}

type BulkBarProps = {
  /** API base path of the resource, e.g. `/locations`. */
  basePath: string;
  /** Plural for messages: «3 Standorte archiviert». */
  plural: string;
  /** False for resources without archive (Teilnehmende, Zeitfenster). */
  canArchive?: boolean;
  /** False for resources that must not be deleted from the list (Lernende). */
  canDelete?: boolean;
};

const DONE: Record<BulkAction, string> = {
  archive: "archiviert",
  restore: "wiederhergestellt",
  delete: "gelöscht",
};

/**
 * Toolbar above a selectable table, visible while rows are checked: archive, restore, delete.
 * Delete asks first; rows a delete could not remove (still referenced) are listed afterwards with
 * the reason and can be archived instead in one click.
 */
export function BulkBar({ basePath, plural, canArchive = true, canDelete = true }: BulkBarProps) {
  const router = useRouter();
  const { selected, clear } = useSelection();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<BulkResult["failed"]>([]);

  async function run(action: BulkAction, ids: string[]): Promise<void> {
    setBusy(true);
    try {
      const result = await bulkAction(basePath, action, ids);
      if (result.succeeded.length) toast.success(`${result.succeeded.length} ${plural} ${DONE[action]}`);
      if (result.failed.length) {
        if (action === "delete") setFailures(result.failed);
        else toast.error(result.failed.map((f) => `${f.label}: ${f.message}`).join(" "));
      }
      clear();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selected.length > 0 ? (
        <div
          role="toolbar"
          aria-label="Aktionen für die Auswahl"
          className="flex flex-wrap items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 ring-1 ring-primary/30"
        >
          <span className="text-[13px] font-medium tabular-nums">{selected.length} ausgewählt</span>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            {canArchive ? (
              <>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run("archive", selected)}>
                  <ArchiveIcon data-icon="inline-start" />
                  Archivieren
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run("restore", selected)}>
                  <ArchiveRestoreIcon data-icon="inline-start" />
                  Wiederherstellen
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>
                <Trash2Icon data-icon="inline-start" />
                Löschen
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" disabled={busy} onClick={clear}>
              <XIcon data-icon="inline-start" />
              Auswahl aufheben
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`${selected.length} ${plural} löschen?`}
        description={
          canArchive
            ? "Die Einträge werden endgültig gelöscht. Einträge, die noch verwendet werden, bleiben bestehen und können stattdessen archiviert werden."
            : "Die Einträge werden endgültig gelöscht. Einträge, die noch verwendet werden, bleiben bestehen."
        }
        onConfirm={() => run("delete", selected)}
      />

      <Dialog open={failures.length > 0} onOpenChange={(open) => (open ? null : setFailures([]))}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{failures.length} nicht gelöscht</DialogTitle>
            <DialogDescription>
              Diese Einträge werden noch verwendet.
              {canArchive ? " Archivierte Einträge verschwinden aus der Liste, die Verweise bleiben gültig." : null}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg text-[13px] ring-1 ring-foreground/10">
            {failures.map((failure) => (
              <li key={failure.id} className="flex justify-between gap-3 px-3 py-2">
                <span className="truncate font-medium">{failure.label}</span>
                <span className="shrink-0 text-muted-foreground">{failure.message}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailures([])}>
              Schliessen
            </Button>
            {canArchive ? (
              <Button
                disabled={busy}
                onClick={async () => {
                  const ids = failures.map((f) => f.id);
                  setFailures([]);
                  await run("archive", ids);
                }}
              >
                <ArchiveIcon data-icon="inline-start" />
                Stattdessen archivieren
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
