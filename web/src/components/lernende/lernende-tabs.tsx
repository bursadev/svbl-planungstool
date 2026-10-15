import { RouteTabs } from "@/components/shell/route-tabs";

const TABS = [
  { label: "Lernende", href: "/lernende", exact: true },
  { label: "Lehrbetriebe", href: "/lernende/lehrbetriebe" },
];

/** Tab bar of the Lernende hub: the imported Lernende and their Lehrbetriebe. */
export function LernendeTabs() {
  return <RouteTabs label="Lernende" tabs={TABS} />;
}
