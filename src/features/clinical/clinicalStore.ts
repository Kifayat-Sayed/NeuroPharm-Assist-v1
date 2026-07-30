import { useCallback, useSyncExternalStore } from "react";

import { repository } from "@/lib/db";
import type { Assessment, ClinicalSnapshot, Patient } from "./types";
import {
  assessmentsForPatient,
  activityFeed,
  clinicalStats,
  patientVitals,
  sortByRecent,
} from "./derive";

const EMPTY: ClinicalSnapshot = { patients: [], assessments: [] };

let snapshot: ClinicalSnapshot = EMPTY;
let initialised = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setSnapshot(next: ClinicalSnapshot) {
  snapshot = next;
  emit();
}

function ensureLoaded() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  void repository.load().then(setSnapshot);
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

/** Subscribe to the whole clinical dataset. */
export function useClinicalSnapshot(): ClinicalSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useClinicalSelector<T>(selector: (snap: ClinicalSnapshot) => T): T {
  const select = useCallback(() => selector(snapshot), [selector]);
  return useSyncExternalStore(subscribe, select, () => selector(EMPTY));
}

/* ---------- convenience hooks ---------- */

export function usePatients(): Patient[] {
  const snap = useClinicalSnapshot();
  return sortByRecent(snap.patients);
}

export function usePatient(id: string | undefined): Patient | undefined {
  const snap = useClinicalSnapshot();
  return id ? snap.patients.find((p) => p.id === id) : undefined;
}

export function usePatientAssessments(patientId: string | undefined): Assessment[] {
  const snap = useClinicalSnapshot();
  return patientId ? assessmentsForPatient(snap, patientId) : [];
}

export function useAssessment(id: string | undefined): Assessment | undefined {
  const snap = useClinicalSnapshot();
  return id ? snap.assessments.find((a) => a.id === id) : undefined;
}

export function useAllAssessments(): Assessment[] {
  const snap = useClinicalSnapshot();
  return sortByRecent(snap.assessments);
}

export function usePatientVitals(patientId: string) {
  const snap = useClinicalSnapshot();
  return patientVitals(snap, patientId);
}

export function useClinicalStats() {
  const snap = useClinicalSnapshot();
  return clinicalStats(snap);
}

export function useActivityFeed(limit = 8) {
  const snap = useClinicalSnapshot();
  return activityFeed(snap, limit);
}

export function useStoreReady(): boolean {
  const snap = useClinicalSnapshot();
  return snap !== EMPTY;
}

/* ---------- mutations (write-through, then broadcast) ---------- */

export async function savePatient(patient: Patient): Promise<Patient> {
  const saved = await repository.upsertPatient(patient);
  setSnapshot(await repository.load());
  return saved;
}

export async function saveAssessment(assessment: Assessment): Promise<Assessment> {
  const saved = await repository.createAssessment(assessment);
  setSnapshot(await repository.load());
  return saved;
}

export async function updateAssessment(
  id: string,
  patch: Partial<Assessment>,
): Promise<Assessment | undefined> {
  const saved = await repository.updateAssessment(id, patch);
  setSnapshot(await repository.load());
  return saved;
}

export async function markReportGenerated(id: string) {
  return updateAssessment(id, { reportGeneratedAt: new Date().toISOString() });
}

export async function resetClinicalData(): Promise<void> {
  setSnapshot(await repository.reset());
}

/* ---------- id helpers ---------- */

export function newPatientId() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newAssessmentId() {
  return `as-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
