import type { Metadata } from "next";
import { SettingsPanel } from "@/components/einstellungen/settings-panel";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMe } from "@/lib/api/me";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { listSettings } from "@/lib/api/settings";

export const metadata: Metadata = { title: "Einstellungen" };

/** `/einstellungen`: application-wide key/value configuration; admins write, planners read. */
export default async function EinstellungenPage() {
  const [me, settings] = await Promise.all([
    getMe(serverApiFetch),
    listSettings(serverApiFetch).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 403) return null;
      throw error;
    }),
  ]);

  if (!settings) {
    return (
      <>
        <PageHeader title="Einstellungen" />
        <Card size="sm">
          <CardContent className="text-muted-foreground">
            Keine Berechtigung: die Einstellungen sind dem Planungsteam und der Administration vorbehalten.
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <PageHeader title="Einstellungen" />
        <p className="text-sm text-muted-foreground">
          Applikationsweite Konfigurationswerte, adressiert über ihren Schlüssel. Ändern können sie nur
          Administratoren.
        </p>
      </div>
      <SettingsPanel settings={settings} canEdit={me.role === "admin"} />
    </>
  );
}
