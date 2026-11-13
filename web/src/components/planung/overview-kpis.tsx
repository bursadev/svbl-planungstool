import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanningOverview } from "@/lib/api/planning-runs";
import { cn } from "@/lib/utils";

const count = new Intl.NumberFormat("de-CH");

type Kpi = { label: string; value: number; unit: string; warn: boolean; link?: { href: string; label: string } };

/** The intake numbers of the design's Planungslauf overview: what still needs a plan before a run starts. */
export function OverviewKpis({ overview }: { overview: PlanningOverview }) {
  const kpis: Kpi[] = [
    {
      label: "Lernende ohne eingeteiltes ÜK",
      value: overview.apprenticesWithoutFutureUk,
      unit: `von ${count.format(overview.activeApprentices)} aktiven Lernenden`,
      warn: overview.apprenticesWithoutFutureUk > 0,
      link: { href: "/lernende", label: "Zu den Lernenden" },
    },
    {
      label: "Kurse ohne Ausbilder",
      value: overview.unstaffedCourses,
      unit: "ÜK in den nächsten 8 Wochen",
      warn: overview.unstaffedCourses > 0,
      link: { href: "/kurse?besetzung=offen&art=uk", label: "Zu den Kursen" },
    },
    {
      label: "Module ohne Zeitfenster",
      value: overview.modulesWithoutTimeWindow,
      unit: "im laufenden Semester",
      warn: overview.modulesWithoutTimeWindow > 0,
      link: { href: "/kurse/bildungsplan", label: "Zum Bildungsplan" },
    },
  ];
  return (
    <section aria-label="Ausgangslage" className="grid gap-4 sm:grid-cols-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} size="sm">
          <CardContent className="flex flex-col gap-1">
            <div className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{kpi.label}</div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-mono text-2xl font-semibold tabular-nums", kpi.warn ? "text-warn" : "text-ok")}>
                {count.format(kpi.value)}
              </span>
              <span className="text-xs text-muted-foreground">{kpi.unit}</span>
            </div>
            {kpi.link ? (
              <Link href={kpi.link.href} className="text-xs text-accent hover:underline">
                {kpi.link.label}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
