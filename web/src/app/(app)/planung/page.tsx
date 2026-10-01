import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Planungslauf" };

export default function PlanungPage() {
  return (
    <>
      <PageHeader title="Planungslauf" />
      <PlaceholderCard>Kommt mit dem Planungslauf.</PlaceholderCard>
    </>
  );
}
