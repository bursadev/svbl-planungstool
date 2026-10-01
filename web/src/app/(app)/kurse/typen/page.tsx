import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Kurstypen" };

export default function KurstypenPage() {
  return (
    <>
      <PageHeader title="Kurstypen" />
      <PlaceholderCard>Kommt mit den Kurstypen.</PlaceholderCard>
    </>
  );
}
