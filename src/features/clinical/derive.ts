import {
  DN4_ITEMS,
  DN4_VERSION,
  dn4AnsweredCount,
  dn4Interpretation,
  dn4Score,
  severityFromScore,
  type DN4Responses,
} from "@/features/assessments/dn4";
import type {
  Assessment,
  ClinicalSnapshot,
  PainSeverity,
  Patient,
  PatientSnapshot,
  ScaleResult,
} from "./types";

/* ---------- deterministic derivations (never stored) ---------- */

export function dn4ResponsesOf(a: Assessment | undefined): DN4Responses {
  const scale = a?.scales?.dn4 as ScaleResult<DN4Responses> | undefined;
  return (scale?.responses ?? {}) as DN4Responses;
}

export function assessmentScore(a: Assessment | undefined): number {
  return dn4Score(dn4ResponsesOf(a));
}

export function assessmentAnswered(a: Assessment | undefined): number {
  return dn4AnsweredCount(dn4ResponsesOf(a));
}

export function assessmentSeverity(a: Assessment | undefined): PainSeverity {
  return severityFromScore(assessmentScore(a));
}

export function assessmentInterpretation(a: Assessment | undefined) {
  return dn4Interpretation(assessmentScore(a));
}

export function dn4ItemRows(a: Assessment | undefined) {
  const r = dn4ResponsesOf(a);
  return DN4_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    value: r[item.id],
  }));
}

export const DN4_SCALE_VERSION = DN4_VERSION;

/* ---------- patient / collection helpers ---------- */

export function fullName(p: Pick<Patient, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function calcAge(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

export function sortByRecent<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function assessmentsForPatient(snap: ClinicalSnapshot, patientId: string): Assessment[] {
  return sortByRecent(snap.assessments.filter((a) => a.patientId === patientId));
}

export function latestAssessment(
  snap: ClinicalSnapshot,
  patientId: string,
): Assessment | undefined {
  return assessmentsForPatient(snap, patientId)[0];
}

export function patientSnapshotOf(p: Patient): PatientSnapshot {
  return {
    mrn: p.mrn,
    fullName: fullName(p),
    age: calcAge(p.dob),
    sex: p.sex,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnosis: p.secondaryDiagnosis,
    comorbidities: [...p.comorbidities],
    allergies: p.allergies,
    medications: p.medications.map((m) => ({ ...m })),
  };
}

export interface PatientVitals {
  latest?: Assessment;
  score?: number;
  severity?: PainSeverity;
  lastAssessment?: string;
  assessmentCount: number;
}

export function patientVitals(snap: ClinicalSnapshot, patientId: string): PatientVitals {
  const list = assessmentsForPatient(snap, patientId);
  const latest = list[0];
  return {
    latest,
    score: latest ? assessmentScore(latest) : undefined,
    severity: latest ? assessmentSeverity(latest) : undefined,
    lastAssessment: latest?.assessmentDate,
    assessmentCount: list.length,
  };
}

export interface ClinicalStats {
  totalPatients: number;
  activePatients: number;
  totalAssessments: number;
  severeCases: number;
  positiveRate: number;
  followUps: number;
  reportsGenerated: number;
}

export function clinicalStats(snap: ClinicalSnapshot): ClinicalStats {
  const scores = snap.assessments.map(assessmentScore);
  const positive = scores.filter((s) => s >= 4).length;
  const severe = new Set(
    snap.assessments.filter((a) => assessmentScore(a) >= 7).map((a) => a.patientId),
  ).size;
  return {
    totalPatients: snap.patients.length,
    activePatients: snap.patients.filter((p) => p.status === "active").length,
    totalAssessments: snap.assessments.length,
    severeCases: severe,
    positiveRate: scores.length ? Math.round((positive / scores.length) * 100) : 0,
    followUps: snap.patients.filter((p) => p.nextFollowUp).length,
    reportsGenerated: snap.assessments.filter((a) => a.reportGeneratedAt).length,
  };
}

export interface ActivityEntry {
  id: string;
  kind: "assessment" | "report" | "patient";
  title: string;
  detail: string;
  at: string;
  patientId: string;
  assessmentId?: string;
}

export function activityFeed(snap: ClinicalSnapshot, limit = 8): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const a of snap.assessments) {
    entries.push({
      id: `a-${a.id}`,
      kind: "assessment",
      title: `DN4 completed for ${a.patientSnapshot.fullName}`,
      detail: `Score ${assessmentScore(a)}/10 · ${a.pharmacist}`,
      at: a.createdAt,
      patientId: a.patientId,
      assessmentId: a.id,
    });
    if (a.reportGeneratedAt) {
      entries.push({
        id: `r-${a.id}`,
        kind: "report",
        title: `Clinical report generated · ${a.patientSnapshot.fullName}`,
        detail: a.pharmacist,
        at: a.reportGeneratedAt,
        patientId: a.patientId,
        assessmentId: a.id,
      });
    }
  }

  for (const p of snap.patients) {
    entries.push({
      id: `p-${p.id}`,
      kind: "patient",
      title: `Patient record created · ${fullName(p)}`,
      detail: `${p.mrn} · ${p.primaryDiagnosis}`,
      at: p.createdAt,
      patientId: p.id,
    });
  }

  return entries.sort((x, y) => y.at.localeCompare(x.at)).slice(0, limit);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
