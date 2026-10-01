import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Einstellungen" };

export default function EinstellungenPage() {
  return (
    <>
      <PageHeader title="Einstellungen" />
      <PlaceholderCard>Kommt mit den Einstellungen.</PlaceholderCard>
    </>
  );
}
