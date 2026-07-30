import type { Assessment, ClinicalSnapshot, Patient } from "@/features/clinical/types";

/**
 * Storage-agnostic persistence contract.
 *
 * Every method is async so the local adapter can be swapped for a Supabase /
 * PostgreSQL adapter later without any change to the UI or the store.
 */
export interface ClinicalRepository {
  readonly name: string;
  load(): Promise<ClinicalSnapshot>;
  upsertPatient(patient: Patient): Promise<Patient>;
  createAssessment(assessment: Assessment): Promise<Assessment>;
  updateAssessment(id: string, patch: Partial<Assessment>): Promise<Assessment | undefined>;
  reset(): Promise<ClinicalSnapshot>;
}
