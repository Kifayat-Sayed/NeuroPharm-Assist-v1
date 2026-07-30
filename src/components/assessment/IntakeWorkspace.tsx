import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  COMORBIDITY_OPTIONS,
  blankMedication,
  calcBmi,
  type IntakeMedication,
  type PatientIntake,
  type VisitType,
} from "@/features/patients/intake";

export function IntakeWorkspace({
  intake,
  setIntake,
  onBack,
  onContinue,
}: {
  intake: PatientIntake;
  setIntake: (updater: (prev: PatientIntake) => PatientIntake) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const set = <K extends keyof PatientIntake>(k: K, v: PatientIntake[K]) =>
    setIntake((p) => ({ ...p, [k]: v }));

  const bmi = calcBmi(intake.heightCm, intake.weightKg);

  function updateMed(id: string, patch: Partial<IntakeMedication>) {
    setIntake((p) => ({
      ...p,
      medications: p.medications.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  const canContinue = intake.name.trim().length > 1;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Step 2 of 3 · Clinical Intake
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            New Patient Intake
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Capture the clinical record required before the DN4 questionnaire.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to patient selection
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        <Block delay={0}>
          <SectionCard
            title="Patient Identification"
            description="Demographics, visit context, and responsible clinicians"
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Patient Name" required>
                <Input
                  value={intake.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Full name"
                />
              </Field>
              <Field label="MRN">
                <Input
                  value={intake.mrn}
                  onChange={(e) => set("mrn", e.target.value)}
                  placeholder="MRN-000000"
                />
              </Field>
              <Field label="Hospital ID (optional)">
                <Input
                  value={intake.hospitalId}
                  onChange={(e) => set("hospitalId", e.target.value)}
                  placeholder="HID-0000"
                />
              </Field>
              <Field label="Age">
                <Input
                  inputMode="numeric"
                  value={intake.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="Years"
                />
              </Field>
              <Field label="Gender">
                <Select
                  value={intake.gender || undefined}
                  onValueChange={(v) => set("gender", v as "M" | "F")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Assessment">
                <Input
                  type="date"
                  value={intake.assessmentDate}
                  onChange={(e) => set("assessmentDate", e.target.value)}
                />
              </Field>
              <Field label="Assessment Addressed By">
                <Input
                  value={intake.pharmacist}
                  onChange={(e) => set("pharmacist", e.target.value)}
                  placeholder="Pharmacist name"
                />
              </Field>
              <Field label="Department / Ward">
                <Input
                  value={intake.department}
                  onChange={(e) => set("department", e.target.value)}
                  placeholder="e.g. Neurology Ward B"
                />
              </Field>
              <Field label="Consultant / Physician">
                <Input
                  value={intake.consultant}
                  onChange={(e) => set("consultant", e.target.value)}
                  placeholder="Attending physician"
                />
              </Field>
              <Field label="Visit Type" className="xl:col-span-3">
                <div className="flex flex-wrap gap-2">
                  {(["Outpatient", "Inpatient", "ICU"] as VisitType[]).map((v) => (
                    <Chip
                      key={v}
                      active={intake.visitType === v}
                      onClick={() => set("visitType", v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>
        </Block>

        <Block delay={0.04}>
          <SectionCard
            title="Clinical Information"
            description="Diagnosis, presenting complaint, and pain history"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Primary Diagnosis">
                <Input
                  value={intake.primaryDiagnosis}
                  onChange={(e) => set("primaryDiagnosis", e.target.value)}
                  placeholder="e.g. Diabetic peripheral neuropathy"
                />
              </Field>
              <Field label="Secondary Diagnosis">
                <Input
                  value={intake.secondaryDiagnosis}
                  onChange={(e) => set("secondaryDiagnosis", e.target.value)}
                  placeholder="e.g. Chronic kidney disease stage 3"
                />
              </Field>
              <Field label="Pain Duration">
                <Input
                  value={intake.painDuration}
                  onChange={(e) => set("painDuration", e.target.value)}
                  placeholder="e.g. 14 weeks"
                />
              </Field>
              <Field label="Pain Location">
                <Input
                  value={intake.painLocation}
                  onChange={(e) => set("painLocation", e.target.value)}
                  placeholder="e.g. Bilateral feet, stocking distribution"
                />
              </Field>
              <Field label="Chief Complaint" className="md:col-span-2">
                <Textarea
                  rows={3}
                  value={intake.chiefComplaint}
                  onChange={(e) => set("chiefComplaint", e.target.value)}
                  placeholder="Patient-reported presenting complaint…"
                />
              </Field>
              <Field label="Relevant Medical History" className="md:col-span-2">
                <Textarea
                  rows={3}
                  value={intake.medicalHistory}
                  onChange={(e) => set("medicalHistory", e.target.value)}
                  placeholder="Surgical, oncological, neurological history…"
                />
              </Field>
            </div>
          </SectionCard>
        </Block>

        <Block delay={0.08}>
          <SectionCard title="Comorbidities" description="Select all conditions that apply">
            <div className="flex flex-wrap gap-2">
              {COMORBIDITY_OPTIONS.map((c) => {
                const active = intake.comorbidities.includes(c);
                return (
                  <Chip
                    key={c}
                    active={active}
                    onClick={() =>
                      setIntake((p) => ({
                        ...p,
                        comorbidities: active
                          ? p.comorbidities.filter((x) => x !== c)
                          : [...p.comorbidities, c],
                      }))
                    }
                  >
                    {c}
                  </Chip>
                );
              })}
            </div>
          </SectionCard>
        </Block>

        <Block delay={0.12}>
          <SectionCard
            title="Current Medications"
            description="Full active medication list at the time of assessment"
            actions={
              <Button
                size="sm"
                onClick={() =>
                  setIntake((p) => ({ ...p, medications: [...p.medications, blankMedication()] }))
                }
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Medication
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="hidden gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_1.2fr_36px]">
                <span>Medication Name</span>
                <span>Dose</span>
                <span>Frequency</span>
                <span>Route</span>
                <span>Indication</span>
                <span />
              </div>
              {intake.medications.map((m) => (
                <div
                  key={m.id}
                  className="grid gap-3 rounded-xl border border-border bg-background p-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_1.2fr_36px] lg:items-center lg:border-transparent lg:bg-transparent lg:p-1"
                >
                  <Input
                    value={m.name}
                    onChange={(e) => updateMed(m.id, { name: e.target.value })}
                    placeholder="e.g. Pregabalin"
                    aria-label="Medication name"
                  />
                  <Input
                    value={m.dose}
                    onChange={(e) => updateMed(m.id, { dose: e.target.value })}
                    placeholder="75 mg"
                    aria-label="Dose"
                  />
                  <Input
                    value={m.frequency}
                    onChange={(e) => updateMed(m.id, { frequency: e.target.value })}
                    placeholder="BID"
                    aria-label="Frequency"
                  />
                  <Input
                    value={m.route}
                    onChange={(e) => updateMed(m.id, { route: e.target.value })}
                    placeholder="PO"
                    aria-label="Route"
                  />
                  <Input
                    value={m.indication}
                    onChange={(e) => updateMed(m.id, { indication: e.target.value })}
                    placeholder="Neuropathic pain"
                    aria-label="Indication"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove medication"
                    onClick={() =>
                      setIntake((p) => ({
                        ...p,
                        medications:
                          p.medications.length > 1
                            ? p.medications.filter((x) => x.id !== m.id)
                            : [blankMedication()],
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </Block>

        <Block delay={0.16}>
          <SectionCard
            title="Drug Allergies"
            description="Document known allergies, intolerances, and reaction type"
          >
            <Textarea
              rows={4}
              value={intake.allergies}
              onChange={(e) => set("allergies", e.target.value)}
              placeholder="e.g. Penicillin — urticaria; NSAIDs — bronchospasm…"
            />
          </SectionCard>
        </Block>

        <Block delay={0.2}>
          <SectionCard
            title="Clinical Baseline"
            description="Anthropometrics, pain severity, and renal function"
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Height (cm)">
                <Input
                  inputMode="decimal"
                  value={intake.heightCm}
                  onChange={(e) => set("heightCm", e.target.value)}
                  placeholder="170"
                />
              </Field>
              <Field label="Weight (kg)">
                <Input
                  inputMode="decimal"
                  value={intake.weightKg}
                  onChange={(e) => set("weightKg", e.target.value)}
                  placeholder="72"
                />
              </Field>
              <Field label="BMI (auto)">
                <div className="flex h-9 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-semibold tabular-nums text-foreground">
                  {bmi ?? <span className="font-normal text-muted-foreground">—</span>}
                  {bmi && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">kg/m²</span>
                  )}
                </div>
              </Field>
              <Field label="Serum Creatinine (optional)">
                <Input
                  value={intake.creatinine}
                  onChange={(e) => set("creatinine", e.target.value)}
                  placeholder="mg/dL"
                />
              </Field>
              <Field label="eGFR (optional)">
                <Input
                  value={intake.egfr}
                  onChange={(e) => set("egfr", e.target.value)}
                  placeholder="mL/min/1.73m²"
                />
              </Field>
              <Field label={`Pain Severity — NRS ${intake.painNrs}/10`} className="xl:col-span-3">
                <Slider
                  value={[intake.painNrs]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={([v]) => set("painNrs", v)}
                  aria-label="Pain severity NRS"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>0 · No pain</span>
                  <span>10 · Worst imaginable</span>
                </div>
              </Field>
            </div>
          </SectionCard>
        </Block>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {canContinue
              ? "Intake complete — the DN4 questionnaire unlocks next."
              : "Enter the patient name to continue."}
          </p>
          <Button size="lg" disabled={!canContinue} onClick={onContinue}>
            Continue to DN4 Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- bits ---------------- */

function Block({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">
        {label}
        {required && <span className="ml-0.5 text-critical">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary-soft hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
