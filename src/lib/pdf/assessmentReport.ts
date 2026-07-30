import { jsPDF } from "jspdf";

import type { Assessment } from "@/features/clinical/types";
import {
  assessmentInterpretation,
  assessmentScore,
  assessmentSeverity,
  dn4ItemRows,
  formatDate,
} from "@/features/clinical/derive";

/** MRN_PatientName_YYYY-MM-DD.pdf */
export function reportFileName(a: Assessment): string {
  const safe = (s: string) => s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safe(a.patientSnapshot.mrn)}_${safe(a.patientSnapshot.fullName)}_${a.assessmentDate}.pdf`;
}

const MARGIN = 46;

export function buildAssessmentPdf(a: Assessment): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = 0;

  const score = assessmentScore(a);
  const interp = assessmentInterpretation(a);
  const severity = assessmentSeverity(a);

  const ensure = (needed: number) => {
    if (y + needed > pageH - 60) {
      doc.addPage();
      y = MARGIN;
    }
  };

  /* ---- header band ---- */
  doc.setFillColor(23, 78, 166);
  doc.rect(0, 0, pageW, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("NeuroPharm Assist", MARGIN, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Pharmacist-Led Neuropathic Pain Assessment Report", MARGIN, 56);
  doc.setFontSize(9);
  doc.text(`Report generated ${new Date().toLocaleString("en-GB")}`, MARGIN, 71);
  y = 110;

  const sectionTitle = (title: string) => {
    ensure(34);
    doc.setTextColor(23, 78, 166);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(214, 222, 236);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN + contentW, y);
    y += 16;
  };

  const kv = (rows: Array<[string, string]>) => {
    doc.setFontSize(10);
    const colW = contentW / 2;
    rows.forEach((row, i) => {
      const col = i % 2;
      if (col === 0) ensure(18);
      const x = MARGIN + col * colW;
      const lineY = y;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(90, 102, 122);
      doc.text(`${row[0]}:`, x, lineY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 28, 40);
      const labelW = doc.getTextWidth(`${row[0]}: `);
      doc.text(doc.splitTextToSize(row[1] || "—", colW - labelW - 12), x + labelW + 2, lineY);
      if (col === 1 || i === rows.length - 1) y += 17;
    });
    y += 8;
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 28, 40);
    const lines = doc.splitTextToSize(text?.trim() || "Not documented.", contentW);
    lines.forEach((line: string) => {
      ensure(15);
      doc.text(line, MARGIN, y);
      y += 14;
    });
    y += 8;
  };

  /* ---- patient ---- */
  sectionTitle("Patient Information");
  kv([
    ["Name", a.patientSnapshot.fullName],
    ["MRN", a.patientSnapshot.mrn],
    ["Age / Sex", `${a.patientSnapshot.age} / ${a.patientSnapshot.sex}`],
    ["Assessment Date", formatDate(a.assessmentDate)],
    ["Pharmacist", a.pharmacist],
    ["Department", a.department ?? "—"],
    ["Primary Diagnosis", a.patientSnapshot.primaryDiagnosis],
    ["Comorbidities", a.patientSnapshot.comorbidities.join(", ") || "None recorded"],
    ["Allergies", a.patientSnapshot.allergies || "NKDA"],
    ["Visit Type", a.visitType ?? "—"],
  ]);

  /* ---- clinical context ---- */
  sectionTitle("Clinical Context");
  kv([
    ["Chief Complaint", a.clinicalContext.chiefComplaint],
    ["Pain Location", a.clinicalContext.painLocation],
    ["Duration", a.clinicalContext.painDuration],
    ["Pain Intensity (NRS)", `${a.clinicalContext.painNrs}/10`],
  ]);

  /* ---- DN4 ---- */
  sectionTitle("DN4 Questionnaire — Itemised Responses");
  const rows = dn4ItemRows(a);
  doc.setFontSize(10);
  rows.forEach((r, i) => {
    ensure(20);
    if (i % 2 === 0) {
      doc.setFillColor(246, 249, 253);
      doc.rect(MARGIN, y - 11, contentW, 18, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 28, 40);
    doc.text(`${i + 1}. ${r.label}`, MARGIN + 8, y);
    const answer = r.value === undefined ? "Not answered" : r.value ? "YES" : "NO";
    if (r.value) doc.setTextColor(23, 78, 166);
    else doc.setTextColor(110, 120, 134);
    doc.setFont("helvetica", "bold");
    doc.text(answer, MARGIN + contentW - 8, y, { align: "right" });
    y += 18;
  });
  y += 12;

  /* ---- score ---- */
  ensure(72);
  doc.setFillColor(240, 246, 255);
  doc.setDrawColor(23, 78, 166);
  doc.roundedRect(MARGIN, y - 6, contentW, 62, 6, 6, "FD");
  doc.setTextColor(23, 78, 166);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`${score}/10`, MARGIN + 18, y + 26);
  doc.setFontSize(11);
  doc.text(interp.label, MARGIN + 110, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 72, 88);
  doc.text(
    doc.splitTextToSize(`${interp.detail} Severity band: ${severity}.`, contentW - 130),
    MARGIN + 110,
    y + 32,
  );
  y += 78;

  /* ---- medication review ---- */
  sectionTitle("Medication Review");
  if (a.medicationReviews.length === 0) {
    paragraph("No medications reviewed.");
  } else {
    a.medicationReviews.forEach((m) => {
      ensure(34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 28, 40);
      doc.text(`${m.name} ${m.dose} ${m.frequency} ${m.route}`.trim(), MARGIN, y);
      y += 14;
      const flags = Object.entries(m.flags)
        .filter(([, v]) => v)
        .map(([k]) =>
          k === "adr"
            ? "Adverse reaction"
            : k === "doseAdjustment"
              ? "Dose adjustment needed"
              : k.charAt(0).toUpperCase() + k.slice(1),
        );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 102, 122);
      const line = `${flags.length ? flags.join(" · ") : "No flags"}${m.comment ? ` — ${m.comment}` : ""}`;
      doc.splitTextToSize(line, contentW).forEach((l: string) => {
        ensure(13);
        doc.text(l, MARGIN, y);
        y += 12;
      });
      y += 6;
    });
  }

  /* ---- narrative ---- */
  sectionTitle("Pharmacist Recommendation");
  paragraph(a.recommendation);
  sectionTitle("Clinical Notes");
  paragraph(a.clinicalNotes);
  sectionTitle("Follow-Up Plan");
  paragraph(a.followUpPlan);

  /* ---- signature + footers ---- */
  ensure(70);
  doc.setDrawColor(180, 190, 204);
  doc.line(MARGIN, y + 26, MARGIN + 200, y + 26);
  doc.setFontSize(9);
  doc.setTextColor(90, 102, 122);
  doc.text(`${a.pharmacist} — Clinical Pharmacist`, MARGIN, y + 40);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 164);
    doc.text(
      "NeuroPharm Assist · Clinical decision support — for documentation purposes only",
      MARGIN,
      pageH - 28,
    );
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 28, { align: "right" });
  }

  return doc;
}

export function downloadAssessmentPdf(a: Assessment): string {
  const doc = buildAssessmentPdf(a);
  const name = reportFileName(a);
  doc.save(name);
  return name;
}
