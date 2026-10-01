import type { StatusTone } from "@/components/data/status-dot";
import type { ApprenticeStatus } from "@/lib/api/apprentices";

/** Status→colour map of the Lernende screens; enum labels live in `@/lib/labels`. */
export const APPRENTICE_STATUS_TONES: Record<ApprenticeStatus, StatusTone> = {
  active: "ok",
  finished: "muted",
  dropped: "bad",
};
