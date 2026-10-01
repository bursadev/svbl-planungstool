import { Badge } from "@/components/ui/badge";

/** Marks a Standort that hosts überbetriebliche Kurse. */
export function UkBadge() {
  return (
    <Badge variant="outline" className="border-transparent bg-accent-soft text-accent" title="ÜK-Standort">
      ÜK
    </Badge>
  );
}
