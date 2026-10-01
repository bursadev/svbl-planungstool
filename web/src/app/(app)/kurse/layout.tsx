import type { ReactNode } from "react";
import { KurseTabs } from "@/components/kurse/kurse-tabs";
import { PageHeader } from "@/components/shell/page-header";

/**
 * Shared frame of the Kurse hub: the «Kurse» header and the Durchführungen / Kurstypen /
 * Bildungsplan tab bar. The pages render their own action buttons above their content.
 */
export default function KurseLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Kurse" />
      <KurseTabs />
      {children}
    </>
  );
}
