"use client";

import { useState } from "react";
import Link from "next/link";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { UserRow } from "@/lib/api/users";
import { ROLE_LABELS, formatDate } from "@/lib/format";
import { UserDialog, type PersonOption } from "./user-dialog";

type UsersTableProps = {
  users: UserRow[];
  /** True for admins: shows the edit action; everyone else only reads. */
  canEdit: boolean;
  instructors: PersonOption[];
  trainers: PersonOption[];
};

/** The `/benutzer` list: the Clerk mirror with role, links and status. */
export function UsersTable({ users, canEdit, instructors, trainers }: UsersTableProps) {
  const columns = canEdit ? 6 : 5;
  // The dialog keeps its last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | undefined>();

  function openEdit(user: UserRow) {
    setEditTarget(user);
    setDialogOpen(true);
  }

  return (
    <>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Benutzer</DataTableHead>
            <DataTableHead>Rolle</DataTableHead>
            <DataTableHead>Verknüpfung</DataTableHead>
            <DataTableHead>Letzte Anmeldung</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            {canEdit ? (
              <DataTableHead className="w-0">
                <span className="sr-only">Aktionen</span>
              </DataTableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <DataTableEmpty colSpan={columns}>Noch keine Benutzer.</DataTableEmpty>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <DataTableCell className="max-w-md">
                  <div className="truncate font-medium">{user.displayName}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  {user.instructor || user.trainer ? (
                    <>
                      {user.instructor ? (
                        <Link href={`/ausbilder/${user.instructor.id}`} className="block truncate hover:underline">
                          {user.instructor.firstName} {user.instructor.lastName}
                        </Link>
                      ) : null}
                      {user.trainer ? (
                        <span className="block truncate">
                          {user.trainer.firstName} {user.trainer.lastName}
                          <span className="text-xs text-muted-foreground"> · Berufsbildner</span>
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell className="font-mono tabular-nums">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : <span className="text-muted-foreground">–</span>}
                </DataTableCell>
                <DataTableCell>
                  <ActiveBadge active={user.status === "active"} activeLabel="Aktiv" inactiveLabel="Deaktiviert" />
                </DataTableCell>
                {canEdit ? (
                  <DataTableCell className="py-1.5 text-right">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(user)}>
                      Bearbeiten
                    </Button>
                  </DataTableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>

      {editTarget ? (
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editTarget}
          instructors={instructors}
          trainers={trainers}
        />
      ) : null}
    </>
  );
}
