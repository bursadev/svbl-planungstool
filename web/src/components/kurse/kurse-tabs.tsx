import { RouteTabs } from "@/components/shell/route-tabs";

const TABS = [
  { label: "Durchführungen", href: "/kurse", exact: true },
  { label: "Kurstypen", href: "/kurse/typen" },
  { label: "Bildungsplan", href: "/kurse/bildungsplan" },
];

/** Tab bar of the Kurse hub. */
export function KurseTabs() {
  return <RouteTabs label="Kurse" tabs={TABS} />;
}
