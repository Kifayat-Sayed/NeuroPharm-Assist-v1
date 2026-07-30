import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  delay?: number;
  accent?: "primary" | "info" | "success" | "warning" | "critical";
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  critical: "bg-critical/10 text-critical",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  delay = 0,
  accent = "primary",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{value}</p>
        </div>
        <div
          className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        {hint && <span className="text-muted-foreground">{hint}</span>}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              trend.positive === false ? "text-critical" : "text-success",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
