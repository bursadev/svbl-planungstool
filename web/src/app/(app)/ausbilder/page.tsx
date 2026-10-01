import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Ausbilder" };

export default function AusbilderPage() {
  return (
    <>
      <PageHeader title="Ausbilder" />
      <PlaceholderCard>Kommt mit den Ausbildern.</PlaceholderCard>
    </>
  );
}
