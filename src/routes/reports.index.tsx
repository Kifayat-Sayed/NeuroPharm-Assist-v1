import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { markReportGenerated, useAllAssessments } from "@/features/clinical/clinicalStore";
import { assessmentScore, assessmentSeverity, formatDateTime } from "@/features/clinical/derive";
import type { Assessment } from "@/features/clinical/types";
import { downloadAssessmentPdf } from "@/lib/pdf/assessmentReport";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports · NeuroPharm Assist" },
      {
        name: "description",
        content: "DN4 assessment reports generated from the patient assessment history.",
      },
      { property: "og:title", content: "Reports · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "DN4 assessment reports generated from the patient assessment history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsIndexPage,
});

function ReportsIndexPage() {
  const assessments = useAllAssessments();

  async function exportPdf(a: Assessment) {
    const file = downloadAssessmentPdf(a);
    await markReportGenerated(a.id);
    toast.success("PDF exported", { description: file });
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Documentation"
        title="Reports"
        description="Preview, print, and export DN4 clinical reports as PDF."
      />

      <SectionCard padded={false} title="Assessment records">
        {assessments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No assessments recorded yet. Complete a DN4 assessment to generate a report.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <Link
                  to="/reports/$assessmentId"
                  params={{ assessmentId: a.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.patientSnapshot.fullName}
                    <span className="text-muted-foreground">
                      {" "}
                      · {a.patientSnapshot.mrn} · DN4 {assessmentScore(a)}/10
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(a.createdAt)} · {a.pharmacist}
                    {a.reportGeneratedAt ? " · report generated" : ""}
                  </p>
                </Link>
                <StatusBadge tone={severityTone(assessmentSeverity(a))} className="capitalize">
                  {assessmentSeverity(a)}
                </StatusBadge>
                <Button size="sm" variant="ghost" onClick={() => void exportPdf(a)}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
