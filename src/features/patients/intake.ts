import type { Medication, Patient, VisitType } from "@/features/clinical/types";
import { newPatientId } from "@/features/clinical/clinicalStore";

export type { VisitType };

export interface IntakeMedication extends Omit<Medication, "startedOn"> {
  startedOn?: string;
}

export interface PatientIntake {
  // Identification
  name: string;
  mrn: string;
  hospitalId: string;
  age: string;
  gender: "M" | "F" | "";
  assessmentDate: string; // yyyy-mm-dd
  pharmacist: string;
  department: string;
  consultant: string;
  visitType: VisitType;
  // Clinical information
  primaryDiagnosis: string;
  secondaryDiagnosis: string;
  chiefComplaint: string;
  painDuration: string;
  painLocation: string;
  medicalHistory: string;
  // Comorbidities
  comorbidities: string[];
  // Medications
  medications: IntakeMedication[];
  // Allergies
  allergies: string;
  // Baseline
  heightCm: string;
  weightKg: string;
  painNrs: number;
  creatinine: string;
  egfr: string;
}

export const COMORBIDITY_OPTIONS = [
  "Diabetes Mellitus",
  "Hypertension",
  "CKD",
  "CAD",
  "Stroke",
  "Cancer",
  "Thyroid Disease",
  "Other",
];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyIntake(): PatientIntake {
  return {
    name: "",
    mrn: "",
    hospitalId: "",
    age: "",
    gender: "",
    assessmentDate: todayISO(),
    pharmacist: "",
    department: "",
    consultant: "",
    visitType: "Outpatient",
    primaryDiagnosis: "",
    secondaryDiagnosis: "",
    chiefComplaint: "",
    painDuration: "",
    painLocation: "",
    medicalHistory: "",
    comorbidities: [],
    medications: [blankMedication()],
    allergies: "",
    heightCm: "",
    weightKg: "",
    painNrs: 0,
    creatinine: "",
    egfr: "",
  };
}

/** Prefill an intake record from an existing patient (used for context capture). */
export function intakeFromPatient(p: Patient): PatientIntake {
  const base = emptyIntake();
  return {
    ...base,
    name: `${p.firstName} ${p.lastName}`.trim(),
    mrn: p.mrn,
    gender: p.sex,
    pharmacist: p.pharmacist,
    department: p.department ?? "",
    consultant: p.consultant ?? "",
    visitType: p.visitType ?? "Outpatient",
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnosis: p.secondaryDiagnosis ?? "",
    comorbidities: [...p.comorbidities],
    allergies: p.allergies ?? "",
    medicalHistory: p.medicalHistory ?? "",
    heightCm: p.heightCm ?? "",
    weightKg: p.weightKg ?? "",
    creatinine: p.creatinine ?? "",
    egfr: p.egfr ?? "",
    medications: p.medications.map((m) => ({ ...m })),
  };
}

let medSeq = 0;
export function blankMedication(): IntakeMedication {
  medSeq += 1;
  return {
    id: `im-${Date.now().toString(36)}-${medSeq}`,
    name: "",
    dose: "",
    frequency: "",
    route: "PO",
    indication: "",
  };
}

export function calcBmi(heightCm: string, weightKg: string): number | null {
  const h = parseFloat(heightCm) / 100;
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0) return null;
  const bmi = w / (h * h);
  if (!Number.isFinite(bmi)) return null;
  return Math.round(bmi * 10) / 10;
}

export function dobFromAge(age: string): string {
  const a = parseInt(age, 10);
  const year = new Date().getFullYear() - (Number.isFinite(a) ? a : 0);
  return `${year}-01-01`;
}

/** Convert an intake record into a persistable Patient. */
export function intakeToPatient(intake: PatientIntake): Patient {
  const [firstName, ...rest] = intake.name.trim().split(/\s+/);
  const now = new Date().toISOString();
  return {
    id: newPatientId(),
    mrn: intake.mrn.trim() || `MRN-${Math.floor(100000 + Math.random() * 899999)}`,
    firstName: firstName || "New",
    lastName: rest.join(" ") || "Patient",
    dob: dobFromAge(intake.age),
    sex: intake.gender === "F" ? "F" : "M",
    phone: "",
    status: "active",
    primaryDiagnosis: intake.primaryDiagnosis || "Not specified",
    secondaryDiagnosis: intake.secondaryDiagnosis || undefined,
    comorbidities: intake.comorbidities,
    allergies: intake.allergies || undefined,
    medicalHistory: intake.medicalHistory || undefined,
    pharmacist: intake.pharmacist || "Unassigned",
    department: intake.department || undefined,
    consultant: intake.consultant || undefined,
    visitType: intake.visitType,
    heightCm: intake.heightCm || undefined,
    weightKg: intake.weightKg || undefined,
    creatinine: intake.creatinine || undefined,
    egfr: intake.egfr || undefined,
    createdAt: now,
    updatedAt: now,
    medications: intake.medications
      .filter((m) => m.name.trim())
      .map((m) => ({
        id: m.id,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        route: m.route,
        indication: m.indication,
        startedOn: m.startedOn || intake.assessmentDate,
      })),
  };
}
