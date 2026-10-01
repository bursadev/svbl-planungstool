import type { Metadata } from "next";
import { CreateSchoolButton } from "@/components/berufsschulen/create-school-button";
import { SchoolsTable } from "@/components/berufsschulen/schools-table";
import { PageHeader } from "@/components/shell/page-header";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { listVocationalSchools } from "@/lib/api/vocational-schools";

export const metadata: Metadata = { title: "Berufsschulen" };

/** `/berufsschulen`: schools with their classes, rendered on the server with the signed-in user's token. */
export default async function BerufsschulenPage() {
  const [schools, locations] = await Promise.all([
    listVocationalSchools(serverApiFetch),
    listLocations(undefined, serverApiFetch),
  ]);
  // The ÜK-Standort picker only needs id, name and the ÜK flag; rooms stay on the server.
  const locationOptions = locations.map(({ id, name, hostsUk }) => ({ id, name, hostsUk }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <PageHeader title="Berufsschulen" actions={<CreateSchoolButton locations={locationOptions} />} />
        <p className="text-sm text-muted-foreground">
          Die Schul-Exporte sind die Quelle für die Lernenden; hier werden Standort-Zuordnung, Klassen und
          Schultage gepflegt.
        </p>
      </div>
      <SchoolsTable schools={schools} locations={locationOptions} />
    </>
  );
}
