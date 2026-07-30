import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { DN4_SECTIONS, DN4_VERSION } from "@/features/assessments/dn4";
import { markReportGenerated, useAssessment } from "@/features/clinical/clinicalStore";
import {
  assessmentInterpretation,
  assessmentScore,
  assessmentSeverity,
  dn4ResponsesOf,
  formatDate,
  formatDateTime,
} from "@/features/clinical/derive";
import { downloadAssessmentPdf, reportFileName } from "@/lib/pdf/assessmentReport";

export const Route = createFileRoute("/reports/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Assessment report · NeuroPharm Assist" },
      {
        name: "description",
        content:
          "Printable DN4 clinical report with itemised responses, score interpretation, and pharmacist recommendations.",
      },
      { property: "og:title", content: "Assessment report · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "DN4 clinical report with itemised responses and pharmacist recommendations.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { assessmentId } = Route.useParams();
  const a = useAssessment(assessmentId);

  if (!a) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-20 text-center md:px-8">
        <h1 className="text-xl font-semibold text-foreground">Report not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This assessment may still be loading, or it no longer exists.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/reports">Back to reports</Link>
        </Button>
      </div>
    );
  }

  const score = assessmentScore(a);
  const severity = assessmentSeverity(a);
  const interp = assessmentInterpretation(a);
  const responses = dn4ResponsesOf(a);

  async function exportPdf() {
    if (!a) return;
    const file = downloadAssessmentPdf(a);
    await markReportGenerated(a.id);
    toast.success("PDF exported", { description: file });
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={() => void exportPdf()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <header className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          NeuroPharm Assist · Clinical Report
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {a.patientSnapshot.fullName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {a.patientSnapshot.mrn} · {a.patientSnapshot.age} yrs ·{" "}
          {a.patientSnapshot.sex === "F" ? "Female" : "Male"} · {formatDate(a.assessmentDate)}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          File name on export: <span className="font-mono">{reportFileName(a)}</span>
        </p>
      </header>

      <SectionCard title="Patient information">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Primary diagnosis" value={a.patientSnapshot.primaryDiagnosis} />
          <Field
            label="Comorbidities"
            value={a.patientSnapshot.comorbidities.join(", ") || "None recorded"}
          />
          <Field label="Allergies" value={a.patientSnapshot.allergies || "NKDA"} />
          <Field label="Pharmacist" value={a.pharmacist} />
          <Field label="Department" value={a.department || "—"} />
          <Field label="Visit type" value={a.visitType || "—"} />
        </dl>
      </SectionCard>

      <SectionCard title="Clinical context">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Chief complaint" value={a.clinicalContext.chiefComplaint || "—"} />
          <Field label="Pain location" value={a.clinicalContext.painLocation || "—"} />
          <Field label="Duration" value={a.clinicalContext.painDuration || "—"} />
          <Field label="Pain intensity (NRS)" value={`${a.clinicalContext.painNrs}/10`} />
        </dl>
      </SectionCard>

      <SectionCard
        title={`DN4 questionnaire · ${DN4_VERSION}`}
        description="Every individual response is stored with the assessment record."
      >
        <div className="space-y-5">
          {DN4_SECTIONS.map((s) => (
            <div key={s.number}>
              <p className="text-sm font-semibold text-foreground">
                Q{s.number} · {s.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.prompt}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {s.items.map((it) => {
                  const v = responses[it.id];
                  return (
                    <li
                      key={it.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{it.label}</span>
                      <span
                        className={
                          v ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                        }
                      >
                        {v === undefined ? "Not answered" : v ? "YES" : "NO"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Score & interpretation">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center rounded-xl bg-primary-soft px-7 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Total DN4</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-primary">
              {score}
              <span className="text-lg font-normal text-primary/60">/10</span>
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <StatusBadge tone={severityTone(severity)} className="capitalize">
              {severity}
            </StatusBadge>
            <p className="text-sm font-semibold text-foreground">{interp.label}</p>
            <p className="text-sm text-muted-foreground">{interp.detail}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Medication review">
        {a.medicationReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No medications reviewed.</p>
        ) : (
          <ul className="space-y-3">
            {a.medicationReviews.map((m) => {
              const flags = Object.entries(m.flags)
                .filter(([, v]) => v)
                .map(([k]) => FLAG_LABELS[k] ?? k);
              return (
                <li key={m.medicationId} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">
                    {m.name}{" "}
                    <span className="text-muted-foreground">
                      · {m.dose} {m.frequency} {m.route}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {flags.length ? flags.join(" · ") : "No flags"}
                    {m.comment ? ` — ${m.comment}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Pharmacist recommendation">
        <Narrative text={a.recommendation} />
      </SectionCard>
      <SectionCard title="Clinical notes">
        <Narrative text={a.clinicalNotes} />
      </SectionCard>
      <SectionCard title="Follow-up plan">
        <Narrative text={a.followUpPlan} />
      </SectionCard>

      <p className="pb-6 text-xs text-muted-foreground">
        Recorded {formatDateTime(a.createdAt)}
        {a.reportGeneratedAt ? ` · report generated ${formatDateTime(a.reportGeneratedAt)}` : ""} ·
        For clinical documentation purposes only.
      </p>
    </div>
  );
}

const FLAG_LABELS: Record<string, string> = {
  effective: "Effective",
  ineffective: "Ineffective",
  adr: "Adverse drug reaction",
  doseAdjustment: "Dose adjustment required",
};

function Narrative({ text }: { text: string }) {
  if (!text?.trim()) {
    return <p className="text-sm text-muted-foreground">Not documented.</p>;
  }
  return <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
