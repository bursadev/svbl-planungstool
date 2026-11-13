import type { Metadata } from "next";
import { NewRunDialog } from "@/components/planung/new-run-dialog";
import { OverviewKpis } from "@/components/planung/overview-kpis";
import { RunsTable } from "@/components/planung/runs-table";
import { PageHeader } from "@/components/shell/page-header";
import { getPlanningOverview, listPlanningRuns } from "@/lib/api/planning-runs";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Planungslauf" };

/** `/planung`: the intake numbers, the button for a new run and the list of runs (design §3 «Übersicht»). */
export default async function PlanungPage() {
  const [overview, runs] = await Promise.all([
    getPlanningOverview(serverApiFetch),
    listPlanningRuns(serverApiFetch),
  ]);
  return (
    <>
      <PageHeader title="Planungslauf" actions={<NewRunDialog existing={runs} />} />
      <div className="flex flex-col gap-4">
        <OverviewKpis overview={overview} />
        <p className="text-[13px] text-muted-foreground">
          Ein Planungslauf plant ein Semester: Bedarf aus den Jahrgängen, Kurse in die Zeitfenster, Ausbilder auf
          die Kurse. Gleitendes Fenster – jedes Semester wird ein neuer Lauf eröffnet.
        </p>
        <RunsTable runs={runs} />
      </div>
    </>
  );
}
