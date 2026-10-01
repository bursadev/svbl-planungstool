import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Import" };

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import" />
      <PlaceholderCard>Kommt mit dem Import.</PlaceholderCard>
    </>
  );
}
