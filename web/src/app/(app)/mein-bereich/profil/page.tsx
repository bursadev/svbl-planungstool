import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Profil & Zertifikate" };

export default function ProfilPage() {
  return (
    <>
      <PageHeader title="Profil & Zertifikate" />
      <PlaceholderCard>Kommt mit dem Ausbilder-Bereich.</PlaceholderCard>
    </>
  );
}
