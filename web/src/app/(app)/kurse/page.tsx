import type { Metadata } from "next";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Kurse" };

/** Tab «Durchführungen»: the course list arrives with the Zeitplan slice. */
export default function KursePage() {
  return <PlaceholderCard>Kommt mit dem Zeitplan.</PlaceholderCard>;
}
