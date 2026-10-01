import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

/** Stand-in for screens that a later slice delivers, e.g. «Kommt mit dem Zeitplan.» */
export function PlaceholderCard({ children }: { children: ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="text-muted-foreground">{children}</CardContent>
    </Card>
  );
}
