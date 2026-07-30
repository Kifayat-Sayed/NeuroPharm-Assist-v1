import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function YesNoToggle({
  value,
  onChange,
  label,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label ? `${label} — yes or no` : "Yes or no"}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background p-1 shadow-[var(--shadow-card)]"
    >
      <Pill
        active={value === true}
        onClick={() => onChange(true)}
        icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
        activeClass="border-primary bg-primary text-primary-foreground"
        idleClass="border-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
      >
        Yes
      </Pill>
      <Pill
        active={value === false}
        onClick={() => onChange(false)}
        icon={<X className="h-3.5 w-3.5" strokeWidth={3} />}
        activeClass="border-foreground bg-foreground text-background"
        idleClass="border-transparent text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground"
      >
        No
      </Pill>
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  children,
  activeClass,
  idleClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  activeClass: string;
  idleClass: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-[74px] items-center justify-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? cn(activeClass, "shadow-[var(--shadow-elevated)]") : idleClass,
      )}
    >
      <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-45")}>
        {icon}
      </span>
      {children}
    </button>
  );
}
