import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Kurse" };

export default function KursePage() {
  return (
    <>
      <PageHeader title="Kurse" />
      <PlaceholderCard>Kommt mit den Kursen.</PlaceholderCard>
    </>
  );
}
