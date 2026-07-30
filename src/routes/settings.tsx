import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AlertTriangle, Database, Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resetClinicalData, useClinicalSnapshot } from "@/features/clinical/clinicalStore";
import type { ClinicalSnapshot } from "@/features/clinical/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · NeuroPharm Assist" },
      { name: "description", content: "Preferences and workspace configuration." },
      { property: "og:title", content: "Settings · NeuroPharm Assist" },
      { property: "og:description", content: "Preferences and workspace configuration." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const snapshot = useClinicalSnapshot();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  function exportData() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neuropharm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported", {
      description: `${snapshot.patients.length} patients · ${snapshot.assessments.length} assessments`,
    });
  }

  async function importData(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ClinicalSnapshot>;
      if (!Array.isArray(parsed.patients) || !Array.isArray(parsed.assessments)) {
        throw new Error("File does not look like a NeuroPharm Assist backup.");
      }
      // Write directly through the repository, then reload so every part of the
      // app (store subscribers, route loaders) picks up the restored dataset.
      const { repository } = await import("@/lib/db");
      await repository.reset();
      for (const patient of parsed.patients) await repository.upsertPatient(patient);
      for (const assessment of parsed.assessments) await repository.createAssessment(assessment);
      toast.success("Backup restored", {
        description: `${parsed.patients.length} patients · ${parsed.assessments.length} assessments`,
      });
      window.location.reload();
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "The file could not be read.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleReset() {
    await resetClinicalData();
    toast.success("Demo data restored");
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Preferences" title="Settings" />

      <SectionCard
        title="Data & storage"
        description="NeuroPharm Assist currently persists all clinical data in this browser's local storage. Back up your data regularly and before clearing browser storage."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Current dataset</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {snapshot.patients.length} patients · {snapshot.assessments.length} assessments
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
            <Button variant="outline" className="w-full sm:w-auto" onClick={exportData}>
              <Download className="h-4 w-4" /> Export backup (JSON)
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Import backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importData(file);
              }}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Reset workspace"
        description="Discard all patients and assessments in this browser and restore the original demo dataset. This cannot be undone."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-critical/30 text-critical hover:bg-critical/10"
            >
              <AlertTriangle className="h-4 w-4" /> Reset to demo data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all clinical data?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes every patient and assessment stored in this browser and
                replaces them with the sample dataset. Export a backup first if you want to keep a
                copy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleReset()}>Reset data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionCard>
    </div>
  );
}
