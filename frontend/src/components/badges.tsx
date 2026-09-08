import { cn } from "@/lib/utils";

const SCORE_STYLES = [
  { min: 80, cls: "bg-[oklch(0.585_0.226_27)]/10 text-[oklch(0.5_0.21_27)] ring-[oklch(0.585_0.226_27)]/25" },
  { min: 60, cls: "bg-[oklch(0.75_0.14_75)]/15 text-[oklch(0.55_0.13_70)] ring-[oklch(0.75_0.14_75)]/30" },
  { min: 40, cls: "bg-[oklch(0.62_0.14_155)]/10 text-[oklch(0.48_0.11_158)] ring-[oklch(0.62_0.14_155)]/25" },
  { min: 0, cls: "bg-muted text-muted-foreground ring-foreground/10" },
];

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const style = SCORE_STYLES.find((s) => score >= s.min)!;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular ring-1",
        style.cls,
        className
      )}
    >
      {score}
      {score >= 60 && <span aria-hidden>🔥</span>}
    </span>
  );
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-foreground/10",
  success: "bg-[oklch(0.62_0.14_155)]/10 text-[oklch(0.46_0.1_158)] ring-[oklch(0.62_0.14_155)]/25",
  warning: "bg-[oklch(0.75_0.14_75)]/15 text-[oklch(0.52_0.12_68)] ring-[oklch(0.75_0.14_75)]/30",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-[oklch(0.62_0.13_220)]/10 text-[oklch(0.47_0.11_232)] ring-[oklch(0.62_0.13_220)]/25",
  accent: "bg-accent text-accent-foreground ring-primary/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export const LEAD_STATUS_TONES: Record<string, StatusTone> = {
  new: "info",
  contacted: "warning",
  qualified: "success",
  viewing_scheduled: "accent",
  converted: "success",
  lost: "danger",
};

export const BOOKING_STATUS_TONES: Record<string, StatusTone> = {
  pending: "warning",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
};

export const PROPERTY_STATUS_TONES: Record<string, StatusTone> = {
  available: "success",
  reserved: "warning",
  sold: "danger",
  rented: "info",
};
