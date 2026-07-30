import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, patientStatusTone, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinicalSnapshot } from "@/features/clinical/clinicalStore";
import { calcAge, formatDate, patientVitals, sortByRecent } from "@/features/clinical/derive";
import type { Patient, PatientStatus } from "@/features/clinical/types";

function exportPatientsCsv(patients: Patient[]) {
  const header = [
    "Name",
    "MRN",
    "Age",
    "Sex",
    "Primary diagnosis",
    "Status",
    "Pharmacist",
    "Next follow-up",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = patients.map((p) =>
    [
      `${p.firstName} ${p.lastName}`,
      p.mrn,
      String(calcAge(p.dob)),
      p.sex,
      p.primaryDiagnosis,
      p.status,
      p.pharmacist,
      p.nextFollowUp ?? "",
    ]
      .map(escape)
      .join(","),
  );
  const csv = [header.map(escape).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuropharm-patients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patients · NeuroPharm Assist" },
      {
        name: "description",
        content: "Search and manage the neuropathic pain patient caseload.",
      },
      { property: "og:title", content: "Patients · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Search and manage the neuropathic pain patient caseload.",
      },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | PatientStatus>("all");
  const snap = useClinicalSnapshot();
  const patients = sortByRecent(snap.patients);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return patients
      .filter((p) => {
        if (status !== "all" && p.status !== status) return false;
        if (!query) return true;
        return (
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
          p.mrn.toLowerCase().includes(query) ||
          p.primaryDiagnosis.toLowerCase().includes(query)
        );
      })
      .map((p) => ({ patient: p, vitals: patientVitals(snap, p.id) }));
  }, [q, status, patients, snap]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Caseload"
        title="Patients"
        description={`${patients.length} patients under active neuropathic pain management`}
        actions={
          <>
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={() => exportPatientsCsv(filtered.map((f) => f.patient))}
            >
              <SlidersHorizontal className="h-4 w-4" /> Export
            </Button>
            <Button asChild>
              <Link to="/assessments/new">
                <Plus className="h-4 w-4" /> Add patient
              </Link>
            </Button>
          </>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, MRN, or diagnosis…"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review">Under review</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Patient</th>
                <th className="px-3 py-3">MRN</th>
                <th className="px-3 py-3">Age / Sex</th>
                <th className="px-3 py-3">Primary diagnosis</th>
                <th className="px-3 py-3 text-center">DN4</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">Last assessment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ patient: p, vitals }, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="group border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                      <div>
                        <Link
                          to="/patients/$id"
                          params={{ id: p.id }}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {p.firstName} {p.lastName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{p.pharmacist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{p.mrn}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {calcAge(p.dob)} · {p.sex}
                  </td>
                  <td className="px-3 py-3 text-foreground">{p.primaryDiagnosis}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex min-w-[2.25rem] justify-center rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {vitals.score ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {vitals.severity && (
                      <StatusBadge tone={severityTone(vitals.severity)} className="capitalize">
                        {vitals.severity}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {formatDate(vitals.lastAssessment)}
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge tone={patientStatusTone(p.status)} className="capitalize">
                      {p.status}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/patients/$id" params={{ id: p.id }}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    No patients match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
