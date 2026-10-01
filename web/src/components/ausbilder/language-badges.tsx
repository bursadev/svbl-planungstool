import { Badge } from "@/components/ui/badge";
import type { Language } from "@/lib/format";
import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_SHORT_LABELS } from "./labels";

/** «DE» «FR» «IT» badges in fixed order, each with the full language name as tooltip. */
export function LanguageBadges({ languages }: { languages: Language[] }) {
  const shown = LANGUAGES.filter((language) => languages.includes(language));
  if (shown.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {shown.map((language) => (
        <Badge
          key={language}
          variant="outline"
          className="h-5 px-1.5 font-mono text-[10px] tracking-[0.04em]"
          title={LANGUAGE_LABELS[language]}
        >
          {LANGUAGE_SHORT_LABELS[language]}
        </Badge>
      ))}
    </span>
  );
}
