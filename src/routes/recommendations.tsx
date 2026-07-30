import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardCheck, FileText, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllAssessments } from "@/features/clinical/clinicalStore";
import { assessmentScore, assessmentSeverity, formatDate } from "@/features/clinical/derive";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations · NeuroPharm Assist" },
      {
        name: "description",
        content: "Pharmacist-led medication optimisation recommendations across the caseload.",
      },
      { property: "og:title", content: "Recommendations · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Documented medication optimisation strategy and rationale per assessment.",
      },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const assessments = useAllAssessments();
  const [q, setQ] = useState("");

  const documented = useMemo(
    () => assessments.filter((a) => a.recommendation.trim().length > 0),
    [assessments],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return documented;
    return documented.filter(
      (a) =>
        a.patientSnapshot.fullName.toLowerCase().includes(query) ||
        a.patientSnapshot.mrn.toLowerCase().includes(query) ||
        a.recommendation.toLowerCase().includes(query),
    );
  }, [documented, q]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Workflow"
        title="Recommendations"
        description={`${documented.length} documented medication optimisation strategies across ${assessments.length} assessments.`}
      />

      <SectionCard padded={false}>
        <div className="relative border-b border-border p-4">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by patient, MRN, or recommendation text…"
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {documented.length === 0
              ? "No recommendations documented yet. They're captured during the assessment workflow."
              : "No recommendations match your search."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 px-5 py-4 hover:bg-muted/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <Link
                        to="/patients/$id"
                        params={{ id: a.patientId }}
                        className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {a.patientSnapshot.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {a.patientSnapshot.mrn} · DN4 {assessmentScore(a)}/10 ·{" "}
                        {formatDate(a.assessmentDate)} · {a.pharmacist}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={severityTone(assessmentSeverity(a))} className="capitalize">
                      {assessmentSeverity(a)}
                    </StatusBadge>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/reports/$assessmentId" params={{ assessmentId: a.id }}>
                        <FileText className="h-3.5 w-3.5" /> Report
                      </Link>
                    </Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap pl-12 text-sm text-foreground">
                  {a.recommendation}
                </p>
                {a.followUpPlan && (
                  <p className="pl-12 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Follow-up: </span>
                    {a.followUpPlan}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
