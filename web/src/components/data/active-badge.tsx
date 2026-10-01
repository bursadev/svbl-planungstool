import { Badge } from "@/components/ui/badge";

type ActiveBadgeProps = {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

/** «Aktiv» in the ok colour, «Inaktiv» muted; the status column of every Stammdaten table. */
export function ActiveBadge({ active, activeLabel = "Aktiv", inactiveLabel = "Inaktiv" }: ActiveBadgeProps) {
  return active ? (
    <Badge variant="outline" className="border-transparent bg-ok-soft text-ok">
      {activeLabel}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {inactiveLabel}
    </Badge>
  );
}
