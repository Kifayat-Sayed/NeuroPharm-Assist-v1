import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardPlus,
  Download,
  FileText,
  Phone,
  Pill,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, patientStatusTone, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  markReportGenerated,
  usePatient,
  usePatientAssessments,
} from "@/features/clinical/clinicalStore";
import {
  assessmentInterpretation,
  assessmentScore,
  assessmentSeverity,
  calcAge,
  dn4ItemRows,
  formatDate,
} from "@/features/clinical/derive";
import { DN4_VERSION } from "@/features/assessments/dn4";
import type { Assessment } from "@/features/clinical/types";
import { downloadAssessmentPdf } from "@/lib/pdf/assessmentReport";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient profile · NeuroPharm Assist" },
      {
        name: "description",
        content:
          "Clinical profile with full DN4 assessment history, medications, and pharmacist interventions.",
      },
      { property: "og:title", content: "Patient profile · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Clinical profile, DN4 history, medications, and interventions.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PatientProfilePage,
});

function PatientProfilePage() {
  const { id } = Route.useParams();
  const p = usePatient(id);
  const history = usePatientAssessments(id);

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-20 text-center md:px-8">
        <h1 className="text-xl font-semibold text-foreground">Patient not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This record may still be loading, or it no longer exists.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/patients">Back to patients</Link>
        </Button>
      </div>
    );
  }

  const latest = history[0];
  const score = latest ? assessmentScore(latest) : undefined;
  const severity = latest ? assessmentSeverity(latest) : undefined;
  const interp = latest ? assessmentInterpretation(latest) : undefined;
  const dn4Pct = ((score ?? 0) / 10) * 100;

  async function exportLatest() {
    if (!latest) return;
    const file = downloadAssessmentPdf(latest);
    await markReportGenerated(latest.id);
    toast.success("PDF exported", { description: file });
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 md:px-8">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
      </Link>

      <PageHeader
        eyebrow={p.mrn}
        title={`${p.firstName} ${p.lastName}`}
        description={`${calcAge(p.dob)} years · ${p.sex === "F" ? "Female" : "Male"} · ${p.primaryDiagnosis}`}
        actions={
          <>
            <Button variant="outline" disabled={!latest} onClick={() => void exportLatest()}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            {latest && (
              <Button variant="outline" asChild>
                <Link to="/reports/$assessmentId" params={{ assessmentId: latest.id }}>
                  <FileText className="h-4 w-4" /> View report
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/assessments/new" search={{ patient: p.id }}>
                <ClipboardPlus className="h-4 w-4" /> New assessment
              </Link>
            </Button>
          </>
        }
      />

      {/* Vitals strip */}
      <section className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:grid-cols-4">
        <MetaField icon={User} label="Status">
          <StatusBadge tone={patientStatusTone(p.status)} className="capitalize">
            {p.status}
          </StatusBadge>
        </MetaField>
        <MetaField icon={Phone} label="Contact">
          <span className="text-sm font-medium text-foreground">{p.phone || "—"}</span>
        </MetaField>
        <MetaField icon={CalendarClock} label="Next follow-up">
          <span className="text-sm font-medium text-foreground">
            {p.nextFollowUp ? formatDate(p.nextFollowUp) : "Not scheduled"}
          </span>
        </MetaField>
        <MetaField icon={Pill} label="Active medications">
          <span className="text-sm font-medium text-foreground">{p.medications.length}</span>
        </MetaField>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">
                Assessments {history.length > 0 && `(${history.length})`}
              </TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-6">
              <SectionCard title="Latest DN4 assessment">
                {!latest ? (
                  <p className="text-sm text-muted-foreground">
                    No assessment recorded yet for this patient.
                  </p>
                ) : (
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-primary-soft px-6 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        DN4 score
                      </p>
                      <p className="mt-1 text-4xl font-semibold tabular-nums text-primary">
                        {score}
                        <span className="text-lg font-normal text-primary/60">/10</span>
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-muted-foreground">
                            Neuropathic pain likelihood
                          </span>
                          <span className="font-semibold text-foreground">
                            {(score ?? 0) >= 4 ? "Positive" : "Negative"}
                          </span>
                        </div>
                        <Progress value={dn4Pct} className="h-2" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Assessed on{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(latest.assessmentDate)}
                        </span>{" "}
                        by {latest.pharmacist}. {interp?.detail}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={severityTone(severity)} className="capitalize">
                          {severity} pain
                        </StatusBadge>
                        <StatusBadge tone="info">{DN4_VERSION}</StatusBadge>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Clinical summary">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Field label="Primary diagnosis" value={p.primaryDiagnosis} />
                  <Field label="Secondary diagnosis" value={p.secondaryDiagnosis || "None"} />
                  <Field label="Date of birth" value={formatDate(p.dob)} />
                  <Field
                    label="Comorbidities"
                    value={p.comorbidities.length ? p.comorbidities.join(", ") : "None reported"}
                  />
                  <Field label="Allergies" value={p.allergies || "NKDA"} />
                  <Field label="Assigned pharmacist" value={p.pharmacist} />
                </dl>
              </SectionCard>
            </TabsContent>

            <TabsContent value="assessments" className="mt-5 space-y-4">
              {history.length === 0 ? (
                <SectionCard title="Assessment history">
                  <p className="text-sm text-muted-foreground">
                    No assessments yet. Start one to build this patient's history.
                  </p>
                </SectionCard>
              ) : (
                history.map((a) => <AssessmentHistoryCard key={a.id} assessment={a} />)
              )}
            </TabsContent>

            <TabsContent value="medications" className="mt-5">
              <SectionCard padded={false} title="Current medications">
                {p.medications.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-muted-foreground">
                    No medications recorded.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {p.medications.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40"
                      >
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.name}{" "}
                            <span className="text-muted-foreground">
                              · {m.dose} {m.route} {m.frequency}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.indication} · started {formatDate(m.startedOn)}
                          </p>
                        </div>
                        <StatusBadge tone="success">Active</StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="timeline" className="mt-5">
              <SectionCard title="Clinical timeline">
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {[
                    ...history.map((a) => ({
                      when: a.createdAt,
                      title: "DN4 assessment completed",
                      body: `Score ${assessmentScore(a)}/10 — ${assessmentSeverity(a)} severity band, recorded by ${a.pharmacist}.`,
                    })),
                    {
                      when: p.createdAt,
                      title: "Patient enrolled in program",
                      body: "Baseline intake and medication reconciliation completed.",
                    },
                  ]
                    .filter((x) => x.when)
                    .map((e, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {formatDate(e.when)}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{e.title}</p>
                        <p className="text-sm text-muted-foreground">{e.body}</p>
                      </li>
                    ))}
                </ol>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <SectionCard title="Care team">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {p.pharmacist
                  .replace("Dr. ", "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{p.pharmacist}</p>
                <p className="text-xs text-muted-foreground">
                  {p.department ? `${p.department} · ` : ""}Lead pharmacist
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Alerts">
            {severity === "severe" ? (
              <div className="rounded-lg border border-critical/20 bg-critical/5 p-3">
                <p className="text-sm font-medium text-critical">Severe pain flagged</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  DN4 ≥ 7. Consider titration review and non-pharmacologic adjuncts.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function AssessmentHistoryCard({ assessment }: { assessment: Assessment }) {
  const score = assessmentScore(assessment);
  const severity = assessmentSeverity(assessment);
  const rows = dn4ItemRows(assessment);

  return (
    <SectionCard
      title={`${formatDate(assessment.assessmentDate)} · DN4 ${score}/10`}
      description={`${assessment.pharmacist}${assessment.department ? ` · ${assessment.department}` : ""}`}
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge tone={severityTone(severity)} className="capitalize">
            {severity}
          </StatusBadge>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/reports/$assessmentId" params={{ assessmentId: assessment.id }}>
              Report
            </Link>
          </Button>
        </div>
      }
    >
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-xs"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span
              className={
                r.value ? "font-semibold text-primary" : "font-medium text-muted-foreground"
              }
            >
              {r.value === undefined ? "—" : r.value ? "YES" : "NO"}
            </span>
          </li>
        ))}
      </ul>
      {assessment.recommendation && (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Recommendation: </span>
          {assessment.recommendation}
        </p>
      )}
    </SectionCard>
  );
}

function MetaField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
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
