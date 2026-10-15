import { RouteTabs } from "@/components/shell/route-tabs";

const TABS = [
  { label: "Kunden", href: "/kunden", exact: true },
  { label: "Teilnehmende", href: "/kunden/teilnehmende" },
];

/** Tab bar of the Kunden hub: companies booking adult courses and their participants. */
export function KundenTabs() {
  return <RouteTabs label="Kunden" tabs={TABS} />;
}
