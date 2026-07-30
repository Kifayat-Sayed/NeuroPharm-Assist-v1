import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, UserPlus, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, patientStatusTone } from "@/components/common/StatusBadge";
import { calcAge } from "@/features/clinical/derive";
import { cn } from "@/lib/utils";
import type { Patient } from "@/features/clinical/types";

export function ChoosePatientStep({
  patients,
  initialSelected,
  onContinue,
  onCreateNew,
}: {
  patients: Patient[];
  initialSelected?: string;
  onContinue: (patientId: string) => void;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | undefined>(initialSelected);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? patients.filter((p) => `${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(q))
      : patients;
    return list.slice(0, 6);
  }, [patients, query]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Step 1 of 3 · Patient
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Choose Patient
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start the pharmacist-led neuropathic pain assessment with an existing record, or register
          a new patient before the clinical intake.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Existing patient */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Select Existing Patient</h2>
              <p className="text-xs text-muted-foreground">
                Search an existing patient by Name or MRN.
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or MRN…"
              className="pl-9"
              aria-label="Search patients by name or MRN"
            />
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {query ? "Results" : "Recent patients"}
          </p>
          <ul className="mt-2 flex-1 space-y-2">
            {results.map((p) => {
              const active = selected === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-primary/30 hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {p.mrn} · {calcAge(p.dob)} yrs · {p.primaryDiagnosis}
                        </span>
                      </span>
                    </span>
                    <StatusBadge tone={patientStatusTone(p.status)}>{p.status}</StatusBadge>
                  </button>
                </li>
              );
            })}
            {results.length === 0 && (
              <li className="rounded-xl border border-dashed border-border px-3.5 py-6 text-center text-xs text-muted-foreground">
                No patient matches “{query}”.
              </li>
            )}
          </ul>

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!selected}
            onClick={() => selected && onContinue(selected)}
          >
            Continue with Existing Patient
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.section>

        {/* New patient */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Register New Patient</h2>
              <p className="text-xs text-muted-foreground">
                Create a new patient profile before beginning the assessment.
              </p>
            </div>
          </div>

          <div className="mt-5 flex-1 rounded-xl border border-dashed border-border bg-muted/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clinical intake includes
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-foreground">
              {[
                "Patient identification & visit context",
                "Clinical information and pain history",
                "Comorbidities",
                "Current medications table",
                "Drug allergies",
                "Clinical baseline (BMI, NRS, renal function)",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button className="mt-6 w-full" size="lg" variant="outline" onClick={onCreateNew}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create New Patient
          </Button>
        </motion.section>
      </div>
    </div>
  );
}
