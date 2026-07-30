import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "critical" | "muted";

const tones: Record<Tone, string> = {
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  critical: "bg-critical/10 text-critical border-critical/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  tone = "muted",
  children,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor(tone))} />}
      {children}
    </span>
  );
}

function dotColor(t: Tone) {
  return {
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    muted: "bg-muted-foreground/60",
  }[t];
}

export function severityTone(s?: "mild" | "moderate" | "severe"): Tone {
  if (s === "severe") return "critical";
  if (s === "moderate") return "warning";
  if (s === "mild") return "success";
  return "muted";
}

export function patientStatusTone(s: "active" | "review" | "discharged"): Tone {
  if (s === "active") return "info";
  if (s === "review") return "warning";
  return "muted";
}
