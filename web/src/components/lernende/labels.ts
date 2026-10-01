import type { StatusTone } from "@/components/data/status-dot";
import type { ApprenticeStatus, Gender } from "@/lib/api/apprentices";

export const APPRENTICE_STATUS_LABELS: Record<ApprenticeStatus, string> = {
  active: "aktiv",
  finished: "abgeschlossen",
  dropped: "abgebrochen",
};

export const APPRENTICE_STATUS_TONES: Record<ApprenticeStatus, StatusTone> = {
  active: "ok",
  finished: "muted",
  dropped: "bad",
};

export const GENDER_LABELS: Record<Gender, string> = {
  m: "männlich",
  f: "weiblich",
  other: "divers",
};
