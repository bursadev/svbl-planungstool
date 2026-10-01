import { Badge } from "@/components/ui/badge";
import type { CourseKind } from "@/lib/api/course-types";
import { TRACK_LABELS, type Track } from "@/lib/format";
import { cn } from "@/lib/utils";
import { COURSE_KIND_LABELS } from "@/lib/labels";

const KIND_CLASS: Record<CourseKind, string> = {
  uk: "border-transparent bg-accent-soft text-accent",
  adult: "border-transparent bg-alt-soft text-alt",
  exam: "border-transparent bg-warn-soft text-warn",
};

/** Art of a Kurstyp: ÜK in the accent colour, Erwachsene in alt, Prüfung in warn. */
export function KindBadge({ kind, className }: { kind: CourseKind; className?: string }) {
  return (
    <Badge variant="outline" className={cn(KIND_CLASS[kind], className)}>
      {COURSE_KIND_LABELS[kind]}
    </Badge>
  );
}

/** Lehrgang EFZ / EBA as a neutral outline badge. */
export function TrackBadge({ track, className }: { track: Track; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono", className)}>
      {TRACK_LABELS[track]}
    </Badge>
  );
}
