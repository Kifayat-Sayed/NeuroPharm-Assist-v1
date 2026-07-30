import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pill, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllAssessments } from "@/features/clinical/clinicalStore";
import { formatDate } from "@/features/clinical/derive";
import type { Assessment, MedicationReviewEntry } from "@/features/clinical/types";

export const Route = createFileRoute("/medications")({
  head: () => ({
    meta: [
      { title: "Medication Review · NeuroPharm Assist" },
      {
        name: "description",
        content: "Medication effectiveness, ADR, and dose-adjustment flags across the caseload.",
      },
      { property: "og:title", content: "Medication Review · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Medication review flags recorded during DN4 assessments.",
      },
    ],
  }),
  component: MedicationReviewPage,
});

type Flag = "effective" | "ineffective" | "adr" | "doseAdjustment";

interface ReviewRow {
  assessment: Assessment;
  review: MedicationReviewEntry;
}

const FLAG_META: Record<Flag, { label: string; tone: "success" | "warning" | "critical" }> = {
  effective: { label: "Effective", tone: "success" },
  ineffective: { label: "Ineffective", tone: "warning" },
  adr: { label: "Adverse Drug Reaction", tone: "critical" },
  doseAdjustment: { label: "Dose Adjustment Required", tone: "warning" },
};

function MedicationReviewPage() {
  const assessments = useAllAssessments();
  const [flag, setFlag] = useState<"all" | Flag>("all");

  const rows = useMemo<ReviewRow[]>(() => {
    const all: ReviewRow[] = [];
    for (const assessment of assessments) {
      for (const review of assessment.medicationReviews) {
        const hasContent = Object.values(review.flags).some(Boolean) || review.comment.trim();
        if (hasContent) all.push({ assessment, review });
      }
    }
    return all;
  }, [assessments]);

  const filtered = useMemo(
    () => (flag === "all" ? rows : rows.filter((r) => r.review.flags[flag])),
    [rows, flag],
  );

  const counts = useMemo(() => {
    const c: Record<Flag, number> = { effective: 0, ineffective: 0, adr: 0, doseAdjustment: 0 };
    for (const r of rows) {
      (Object.keys(c) as Flag[]).forEach((k) => {
        if (r.review.flags[k]) c[k] += 1;
      });
    }
    return c;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Workflow"
        title="Medication Review"
        description="Effectiveness, tolerability, and dose-adjustment flags captured during DN4 assessments."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reviews recorded"
          value={rows.length}
          icon={Pill}
          hint={`${assessments.length} assessments`}
          accent="primary"
        />
        <StatCard
          label="Effective"
          value={counts.effective}
          icon={CheckCircle2}
          hint="Flagged effective"
          accent="success"
        />
        <StatCard
          label="Adverse reactions"
          value={counts.adr}
          icon={AlertTriangle}
          hint="Requires attention"
          accent="critical"
        />
        <StatCard
          label="Dose adjustment"
          value={counts.doseAdjustment}
          icon={SlidersHorizontal}
          hint="Titration pending"
          accent="warning"
        />
      </section>

      <SectionCard padded={false} title="Flagged medications">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <span className="text-xs font-medium text-muted-foreground">Filter</span>
          <Select value={flag} onValueChange={(v) => setFlag(v as typeof flag)}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="All flags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All flags</SelectItem>
              {(Object.keys(FLAG_META) as Flag[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FLAG_META[f].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No medication reviews match this filter yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(({ assessment, review }) => (
              <div
                key={`${assessment.id}-${review.medicationId}`}
                className="flex flex-col gap-3 px-5 py-4 hover:bg-muted/40 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {review.dose} · {review.frequency} · {review.route}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Link
                      to="/patients/$id"
                      params={{ id: assessment.patientId }}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {assessment.patientSnapshot.fullName}
                    </Link>{" "}
                    · {assessment.patientSnapshot.mrn} · {formatDate(assessment.assessmentDate)}
                  </p>
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {(Object.keys(FLAG_META) as Flag[])
                    .filter((f) => review.flags[f])
                    .map((f) => (
                      <StatusBadge key={f} tone={FLAG_META[f].tone}>
                        {FLAG_META[f].label}
                      </StatusBadge>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
