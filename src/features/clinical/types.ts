/**
 * Core clinical domain model.
 *
 * These types are storage-agnostic: the same shapes are used by the local
 * persistence adapter today and can be mapped to Supabase/PostgreSQL tables
 * later without touching the UI layer.
 */

export type PatientStatus = "active" | "review" | "discharged";
export type PainSeverity = "mild" | "moderate" | "severe";
export type VisitType = "Outpatient" | "Inpatient" | "ICU";

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  indication: string;
  startedOn: string; // ISO date
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date
  sex: "M" | "F";
  phone: string;
  status: PatientStatus;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  comorbidities: string[];
  allergies?: string;
  medicalHistory?: string;
  pharmacist: string;
  department?: string;
  consultant?: string;
  visitType?: VisitType;
  heightCm?: string;
  weightKg?: string;
  creatinine?: string;
  egfr?: string;
  medications: Medication[];
  nextFollowUp?: string; // ISO date
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/** Immutable copy of the patient at the moment an assessment was recorded. */
export interface PatientSnapshot {
  mrn: string;
  fullName: string;
  age: number;
  sex: "M" | "F";
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  comorbidities: string[];
  allergies?: string;
  medications: Medication[];
}

export interface MedicationReviewFlags {
  effective?: boolean;
  ineffective?: boolean;
  adr?: boolean;
  doseAdjustment?: boolean;
}

export interface MedicationReviewEntry {
  medicationId: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  flags: MedicationReviewFlags;
  comment: string;
}

/**
 * Standardised scale results are stored generically so future scales
 * (LANSS, PainDETECT, NRS, VAS) can be appended without schema changes.
 * Raw item responses are the source of truth — scores are always derived.
 */
export type ScaleId = "dn4" | "lanss" | "painDetect" | "nrs" | "vas";

export interface ScaleResult<TResponses = Record<string, unknown>> {
  scaleId: ScaleId;
  version: string;
  responses: TResponses;
  recordedAt: string; // ISO datetime
}

export interface ClinicalContext {
  chiefComplaint: string;
  painLocation: string;
  painDuration: string;
  painNrs: number;
}

export interface Assessment {
  id: string;
  patientId: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  assessmentDate: string; // yyyy-mm-dd
  pharmacist: string;
  department?: string;
  visitType?: VisitType;
  patientSnapshot: PatientSnapshot;
  /** Keyed by scale id; only the recorded scales are present. */
  scales: Partial<Record<ScaleId, ScaleResult>>;
  clinicalContext: ClinicalContext;
  medicationReviews: MedicationReviewEntry[];
  recommendation: string;
  clinicalNotes: string;
  followUpPlan: string;
  reportGeneratedAt?: string;
  status: "draft" | "completed";
}

export interface ClinicalSnapshot {
  patients: Patient[];
  assessments: Assessment[];
}
