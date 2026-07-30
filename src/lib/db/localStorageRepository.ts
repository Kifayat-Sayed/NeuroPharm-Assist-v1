import type { Assessment, ClinicalSnapshot, Patient } from "@/features/clinical/types";
import { seedSnapshot } from "@/features/clinical/seed";
import type { ClinicalRepository } from "./repository";

const STORAGE_KEY = "neuropharm.clinical.v2";

function emptySnapshot(): ClinicalSnapshot {
  return { patients: [], assessments: [] };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Local (browser) persistence adapter — Version 1 storage. */
export class LocalStorageRepository implements ClinicalRepository {
  readonly name = "localStorage";

  private read(): ClinicalSnapshot {
    if (typeof window === "undefined") return clone(seedSnapshot);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = clone(seedSnapshot);
        this.write(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw) as Partial<ClinicalSnapshot>;
      return {
        patients: Array.isArray(parsed.patients) ? parsed.patients : [],
        assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      };
    } catch {
      return emptySnapshot();
    }
  }

  private write(snap: ClinicalSnapshot) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      /* quota exceeded — data stays in memory for this session */
    }
  }

  async load(): Promise<ClinicalSnapshot> {
    return this.read();
  }

  async upsertPatient(patient: Patient): Promise<Patient> {
    const snap = this.read();
    const idx = snap.patients.findIndex((p) => p.id === patient.id);
    if (idx >= 0) snap.patients[idx] = patient;
    else snap.patients.unshift(patient);
    this.write(snap);
    return patient;
  }

  async createAssessment(assessment: Assessment): Promise<Assessment> {
    const snap = this.read();
    snap.assessments.unshift(assessment);
    this.write(snap);
    return assessment;
  }

  async updateAssessment(id: string, patch: Partial<Assessment>): Promise<Assessment | undefined> {
    const snap = this.read();
    const idx = snap.assessments.findIndex((a) => a.id === id);
    if (idx < 0) return undefined;
    const next = { ...snap.assessments[idx], ...patch, updatedAt: new Date().toISOString() };
    snap.assessments[idx] = next;
    this.write(snap);
    return next;
  }

  async reset(): Promise<ClinicalSnapshot> {
    const seeded = clone(seedSnapshot);
    this.write(seeded);
    return seeded;
  }
}
