import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Kataloge" };

export default function KatalogePage() {
  return (
    <>
      <PageHeader title="Kataloge" />
      <PlaceholderCard>Kommt mit den Katalogen.</PlaceholderCard>
    </>
  );
}
