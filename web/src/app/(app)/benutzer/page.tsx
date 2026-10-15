import type { Metadata } from "next";
import { UsersTable } from "@/components/benutzer/users-table";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listInstructors } from "@/lib/api/instructors";
import { getMe } from "@/lib/api/me";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { listTrainers } from "@/lib/api/training-companies";
import { listUsers } from "@/lib/api/users";

export const metadata: Metadata = { title: "Benutzer" };

/**
 * `/benutzer`: the Clerk mirror (ADR-0003). Planners read, admins additionally set status and the
 * links to Ausbilder / Berufsbildner; roles and invitations are managed in Clerk itself.
 */
export default async function BenutzerPage() {
  const [me, users] = await Promise.all([
    getMe(serverApiFetch),
    listUsers(serverApiFetch).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 403) return null;
      throw error;
    }),
  ]);

  if (!users) {
    return (
      <>
        <PageHeader title="Benutzer" />
        <Card size="sm">
          <CardContent className="text-muted-foreground">
            Keine Berechtigung: die Benutzerverwaltung ist dem Planungsteam und der Administration vorbehalten.
          </CardContent>
        </Card>
      </>
    );
  }

  const canEdit = me.role === "admin";
  // The link pickers are only needed for admins; everyone else gets a read-only table.
  const [instructors, trainers] = canEdit
    ? await Promise.all([
        listInstructors({}, serverApiFetch).catch(() => []),
        listTrainers(undefined, serverApiFetch).catch(() => []),
      ])
    : [[], []];

  return (
    <>
      <div className="flex flex-col gap-1">
        <PageHeader title="Benutzer" />
        <p className="text-sm text-muted-foreground">
          Konten, Rollen und Einladungen werden in Clerk verwaltet; hier stehen Status und die Verknüpfung zu
          Ausbildern und Berufsbildnern.
        </p>
      </div>
      <UsersTable
        users={users}
        canEdit={canEdit}
        instructors={instructors.map((instructor) => ({
          id: instructor.id,
          label: `${instructor.lastName} ${instructor.firstName}`,
        }))}
        trainers={trainers.map((trainer) => ({
          id: trainer.id,
          label: `${trainer.lastName} ${trainer.firstName} (${trainer.trainingCompany.name})`,
        }))}
      />
    </>
  );
}
