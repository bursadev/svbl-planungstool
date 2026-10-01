import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  /** 28px: table rows. */
  sm: "size-7 text-[11px]",
  /** 40px: detail headers. */
  md: "size-10 text-sm",
} as const;

/** «Anna Müller» → «AM»; a single word gives its first letter. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toLocaleUpperCase("de-CH");
}

type InitialsAvatarProps = {
  name: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

/** Round initials badge in the accent colours (`bg-accent-soft text-accent`); decorative, the name is rendered next to it. */
export function InitialsAvatar({ name, size = "sm", className }: InitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent select-none",
        SIZE_CLASS[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
