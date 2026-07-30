import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Pill,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChoosePatientStep } from "@/components/assessment/ChoosePatientStep";
import { IntakeWorkspace } from "@/components/assessment/IntakeWorkspace";
import { YesNoToggle } from "@/components/assessment/YesNoToggle";
import {
  newAssessmentId,
  savePatient,
  saveAssessment,
  updateAssessment,
  usePatients,
} from "@/features/clinical/clinicalStore";
import { calcAge, patientSnapshotOf } from "@/features/clinical/derive";
import type { Assessment, MedicationReviewEntry, Patient } from "@/features/clinical/types";
import { downloadAssessmentPdf } from "@/lib/pdf/assessmentReport";
import {
  emptyIntake,
  intakeFromPatient,
  intakeToPatient,
  todayISO,
  type PatientIntake,
} from "@/features/patients/intake";
import {
  DN4_ITEMS,
  DN4_SECTIONS,
  DN4_VERSION,
  dn4AnsweredCount,
  dn4Score,
  type DN4ItemId,
  type DN4Responses,
} from "@/features/assessments/dn4";

const searchSchema = z.object({ patient: z.string().optional() });

export const Route = createFileRoute("/assessments/new")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "New Assessment · NeuroPharm Assist" },
      {
        name: "description",
        content:
          "Guided pharmacist workflow: choose or register a patient, complete clinical intake, then score the DN4 questionnaire.",
      },
      { property: "og:title", content: "New Assessment · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Patient selection, clinical intake, and DN4 scoring in one guided workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewAssessmentFlow,
});

type Phase = "choose" | "intake" | "assess";

const CARD_META: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: "Pain Characteristics",
    subtitle: "Does the pain have one or more of the following characteristics?",
  },
  2: {
    title: "Associated Symptoms",
    subtitle: "Is the pain associated with one or more of these symptoms in the same area?",
  },
  3: { title: "Clinical Examination", subtitle: "Examination of the painful area reveals:" },
  4: { title: "Provoked Pain", subtitle: "Can the pain be caused or increased by:" },
};

const MED_FLAGS = [
  { key: "effective", label: "Effective" },
  { key: "ineffective", label: "Ineffective" },
  { key: "adr", label: "Adverse Drug Reaction" },
  { key: "doseAdjustment", label: "Dose Adjustment Required" },
] as const;

type MedFlagKey = (typeof MED_FLAGS)[number]["key"];
type MedReview = { flags: Partial<Record<MedFlagKey, boolean>>; comment: string };

function NewAssessmentFlow() {
  const { patient: preselect } = Route.useSearch();
  const navigate = useNavigate();
  const roster = usePatients();

  const [phase, setPhase] = useState<Phase>("choose");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [intake, setIntake] = useState<PatientIntake>(() => emptyIntake());

  function continueWithExisting(id: string) {
    const p = roster.find((x) => x.id === id);
    if (!p) return;
    setPatient(p);
    setIntake(intakeFromPatient(p));
    setPhase("assess");
  }

  async function finishIntake() {
    const p = await savePatient(intakeToPatient(intake));
    setPatient(p);
    setPhase("assess");
    toast.success("Patient registered", { description: `${p.firstName} ${p.lastName} · ${p.mrn}` });
  }

  if (phase === "choose") {
    return (
      <ChoosePatientStep
        patients={roster}
        initialSelected={preselect}
        onContinue={continueWithExisting}
        onCreateNew={() => setPhase("intake")}
      />
    );
  }

  if (phase === "intake") {
    return (
      <IntakeWorkspace
        intake={intake}
        setIntake={(u) => setIntake((prev) => u(prev))}
        onBack={() => setPhase("choose")}
        onContinue={() => void finishIntake()}
      />
    );
  }

  return (
    <AssessmentWorkspace
      key={patient!.id}
      patient={patient!}
      intake={intake}
      onBack={() => setPhase("choose")}
      navigate={navigate}
    />
  );
}

/* ---------------- DN4 workspace ---------------- */

function AssessmentWorkspace({
  patient,
  intake,
  onBack,
  navigate,
}: {
  patient: Patient;
  intake: PatientIntake;
  onBack: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [answers, setAnswers] = useState<DN4Responses>({});
  const [medReview, setMedReview] = useState<Record<string, MedReview>>({});
  const [optimisation, setOptimisation] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [followUpPlan, setFollowUpPlan] = useState("");
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | undefined>(undefined);
  const reportGenerated = !!reportGeneratedAt;
  // Tracks the record created by the *first* save/report/export in this session so
  // later actions update that same assessment instead of creating a duplicate.
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);

  const score = dn4Score(answers);
  const answered = dn4AnsweredCount(answers);
  const total = DN4_ITEMS.length;
  const likely = score >= 4;

  const medsReviewed = patient.medications.filter((m) => {
    const r = medReview[m.id];
    return r && (Object.values(r.flags).some(Boolean) || r.comment.trim());
  }).length;

  function setAnswer(id: DN4ItemId, v: boolean) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  function toggleFlag(medId: string, key: MedFlagKey) {
    setMedReview((m) => {
      const cur = m[medId] ?? { flags: {}, comment: "" };
      return { ...m, [medId]: { ...cur, flags: { ...cur.flags, [key]: !cur.flags[key] } } };
    });
  }

  function setComment(medId: string, comment: string) {
    setMedReview((m) => ({ ...m, [medId]: { ...(m[medId] ?? { flags: {} }), comment } }));
  }

  function buildAssessment(reportedAt?: string): Assessment {
    const now = new Date().toISOString();
    const reviews: MedicationReviewEntry[] = patient.medications.map((med) => {
      const r = medReview[med.id] ?? { flags: {}, comment: "" };
      return {
        medicationId: med.id,
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        route: med.route,
        flags: { ...r.flags },
        comment: r.comment ?? "",
      };
    });

    return {
      id: savedAssessmentId ?? newAssessmentId(),
      patientId: patient.id,
      createdAt: now,
      updatedAt: now,
      assessmentDate: intake.assessmentDate || todayISO(),
      pharmacist: intake.pharmacist || patient.pharmacist,
      department: intake.department || patient.department,
      visitType: intake.visitType ?? patient.visitType,
      patientSnapshot: patientSnapshotOf(patient),
      scales: {
        dn4: { scaleId: "dn4", version: DN4_VERSION, responses: { ...answers }, recordedAt: now },
      },
      clinicalContext: {
        chiefComplaint: intake.chiefComplaint,
        painLocation: intake.painLocation || patient.primaryDiagnosis,
        painDuration: intake.painDuration,
        painNrs: intake.painNrs,
      },
      medicationReviews: reviews,
      recommendation: optimisation.trim(),
      clinicalNotes: clinicalNotes.trim(),
      followUpPlan: followUpPlan.trim(),
      reportGeneratedAt: reportedAt ?? reportGeneratedAt,
      status: "completed",
    };
  }

  /** Creates the assessment on the first call in this session, then updates that
   *  same record on every subsequent call (save / report / export can be used in
   *  any order without leaving behind duplicate draft assessments). */
  async function persistAssessment(reportedAt?: string): Promise<Assessment> {
    const draft = buildAssessment(reportedAt);
    const saved = savedAssessmentId
      ? ((await updateAssessment(savedAssessmentId, draft)) ?? (await saveAssessment(draft)))
      : await saveAssessment(draft);
    setSavedAssessmentId(saved.id);
    return saved;
  }

  async function handleSave() {
    const a = await persistAssessment();
    toast.success("Assessment saved", {
      description: `${patient.firstName} ${patient.lastName} · DN4 ${score}/10`,
    });
    navigate({ to: "/patients/$id", params: { id: a.patientId } });
  }

  async function handleReport() {
    const stamp = new Date().toISOString();
    const a = await persistAssessment(stamp);
    setReportGeneratedAt(stamp);
    toast.success("Clinical report generated");
    navigate({ to: "/reports/$assessmentId", params: { assessmentId: a.id } });
  }

  async function handleExportPdf() {
    const stamp = new Date().toISOString();
    const a = await persistAssessment(stamp);
    const file = downloadAssessmentPdf(a);
    setReportGeneratedAt(stamp);
    toast.success("PDF exported", { description: file });
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Change patient
      </Button>

      <PatientBanner patient={patient} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading
              icon={Stethoscope}
              title="DN4 Assessment"
              subtitle="Ten-item neuropathic pain diagnostic questionnaire · scores update instantly"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {DN4_SECTIONS.map((s, i) => (
                <motion.div
                  key={s.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SectionCard
                    className="h-full"
                    title={`Card ${s.number} · ${CARD_META[s.number].title}`}
                    description={CARD_META[s.number].subtitle}
                  >
                    <ul className="space-y-2">
                      {s.items.map((it) => {
                        const label = it.label;
                        return (
                          <li
                            key={it.id}
                            className={cn(
                              "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                              answers[it.id] === true
                                ? "border-primary/30 bg-primary-soft"
                                : answers[it.id] === false
                                  ? "border-border bg-muted/50"
                                  : "border-border bg-background",
                            )}
                          >
                            <span className="text-sm font-medium text-foreground">{label}</span>
                            <YesNoToggle
                              label={label}
                              value={answers[it.id]}
                              onChange={(v) => setAnswer(it.id, v)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </SectionCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Medication review */}
          <div className="space-y-4">
            <SectionHeading
              icon={Pill}
              title="Medication Review"
              subtitle="Assess each active medication for efficacy, tolerability, and dose appropriateness"
            />
            {patient.medications.length === 0 ? (
              <SectionCard>
                <p className="text-sm text-muted-foreground">
                  No active medications recorded for this patient.
                </p>
              </SectionCard>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {patient.medications.map((med, i) => {
                  const r = medReview[med.id] ?? { flags: {}, comment: "" };
                  return (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{med.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {med.dose} · {med.frequency} · {med.route}
                          </p>
                        </div>
                        <StatusBadge tone="muted" dot={false}>
                          {med.indication}
                        </StatusBadge>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {MED_FLAGS.map((f) => {
                          const on = !!r.flags[f.key];
                          return (
                            <label
                              key={f.key}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                                on
                                  ? "border-primary/30 bg-primary-soft text-primary"
                                  : "border-border bg-background text-muted-foreground hover:bg-muted/60",
                              )}
                            >
                              <Checkbox
                                checked={on}
                                onCheckedChange={() => toggleFlag(med.id, f.key)}
                              />
                              {f.label}
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <Label htmlFor={`c-${med.id}`} className="text-xs">
                          Clinical Comments
                        </Label>
                        <Textarea
                          id={`c-${med.id}`}
                          rows={2}
                          placeholder="Observations, monitoring plan, counselling points…"
                          value={r.comment}
                          onChange={(e) => setComment(med.id, e.target.value)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="space-y-4">
            <SectionHeading
              icon={ClipboardCheck}
              title="Pharmacist Recommendation"
              subtitle="Document the proposed therapeutic plan and supporting rationale"
            />
            <SectionCard>
              <div className="grid gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="opt">Suggested Medication Optimisation</Label>
                  <Textarea
                    id="opt"
                    rows={6}
                    placeholder="e.g. Titrate pregabalin to 150 mg BID over 2 weeks; review renal dosing…"
                    value={optimisation}
                    onChange={(e) => setOptimisation(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <Textarea
                    id="notes"
                    rows={6}
                    placeholder="Rationale, red flags, referral, follow-up interval…"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="followup">Follow-Up Plan</Label>
                  <Textarea
                    id="followup"
                    rows={4}
                    placeholder="e.g. Telephone review in 7 days; renal panel before next titration…"
                    value={followUpPlan}
                    onChange={(e) => setFollowUpPlan(e.target.value)}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => void handleExportPdf()}>
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={() => void handleReport()}>
              <FileText className="mr-2 h-4 w-4" /> Generate Clinical Report
            </Button>
            <Button onClick={() => void handleSave()}>
              <Save className="mr-2 h-4 w-4" /> Save Assessment
            </Button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <SummaryPanel
            patient={patient}
            answered={answered}
            total={total}
            score={score}
            likely={likely}
            medsReviewed={medsReviewed}
            medsTotal={patient.medications.length}
            reportGenerated={reportGenerated}
          />
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Patient banner ---------------- */

function PatientBanner({ patient }: { patient: Patient }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UserRound className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Step 3 of 3 · Clinical Assessment Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Meta label="MRN" value={patient.mrn} />
              <Meta label="Age" value={`${calcAge(patient.dob)} yrs`} />
              <Meta label="Gender" value={patient.sex === "F" ? "Female" : "Male"} />
              <Meta label="Pharmacist" value={patient.pharmacist} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Diagnosis
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{patient.primaryDiagnosis}</p>
          {patient.comorbidities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patient.comorbidities.map((c) => (
                <StatusBadge key={c} tone="muted" dot={false}>
                  {c}
                </StatusBadge>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current Medications
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {patient.medications.map((m) => (
              <li
                key={m.id}
                className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-foreground"
              >
                {m.name}{" "}
                <span className="text-muted-foreground">
                  {m.dose} · {m.frequency}
                </span>
              </li>
            ))}
            {patient.medications.length === 0 && (
              <li className="text-xs text-muted-foreground">None recorded</li>
            )}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>{" "}
      <span className="text-foreground">{value}</span>
    </span>
  );
}

/* ---------------- Bits ---------------- */

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Activity;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function SummaryPanel({
  patient,
  answered,
  total,
  score,
  likely,
  medsReviewed,
  medsTotal,
  reportGenerated,
}: {
  patient: Patient;
  answered: number;
  total: number;
  score: number;
  likely: boolean;
  medsReviewed: number;
  medsTotal: number;
  reportGenerated: boolean;
}) {
  const pct = Math.round((answered / total) * 100);
  const status =
    answered === 0 ? "Not started" : answered < total ? "In progress" : "Ready to save";
  const medStatus =
    medsTotal === 0
      ? "No medications"
      : medsReviewed === 0
        ? "Pending"
        : medsReviewed < medsTotal
          ? `${medsReviewed}/${medsTotal} reviewed`
          : "Complete";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Assessment Summary</h2>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Patient" value={`${patient.firstName} ${patient.lastName}`} />
        <Row
          label="Assessment status"
          value={
            <StatusBadge tone={answered === total ? "success" : answered ? "info" : "muted"}>
              {status}
            </StatusBadge>
          }
        />
        <Row label="Questions answered" value={`${answered} / ${total}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Current DN4 Score
        </p>
        <motion.p
          key={score}
          initial={{ scale: 0.92, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-1 text-4xl font-semibold tabular-nums text-foreground"
        >
          {score}
          <span className="text-lg text-muted-foreground">/10</span>
        </motion.p>
      </div>

      <div
        className={cn(
          "rounded-lg border p-3 text-center text-sm font-semibold",
          likely
            ? "border-critical/20 bg-critical/10 text-critical"
            : "border-success/20 bg-success/10 text-success",
        )}
      >
        {likely ? "Neuropathic Pain Likely" : "Neuropathic Pain Unlikely"}
        <p className="mt-1 text-xs font-normal text-muted-foreground">Threshold: DN4 ≥ 4 / 10</p>
      </div>

      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <Row
          label="Medication review"
          value={
            <StatusBadge tone={medStatus === "Complete" ? "success" : "muted"}>
              {medStatus}
            </StatusBadge>
          }
        />
        <Row
          label="Report"
          value={
            <StatusBadge tone={reportGenerated ? "success" : "muted"} dot={!reportGenerated}>
              {reportGenerated ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Generated
                </>
              ) : (
                "Not generated"
              )}
            </StatusBadge>
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {typeof value === "string" ? (
        <span className="text-sm font-medium text-foreground">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}
