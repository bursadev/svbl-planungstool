import { Badge } from "@/components/ui/badge";

type ActiveBadgeProps = {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

/** «Aktiv» in the ok colour, «Archiviert» muted; the status column of every Stammdaten table. */
export function ActiveBadge({ active, activeLabel = "Aktiv", inactiveLabel = "Archiviert" }: ActiveBadgeProps) {
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
